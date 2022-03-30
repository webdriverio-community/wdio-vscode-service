import fs from 'fs/promises'
import path from 'path'
import slash from 'slash'
import tmp from 'tmp-promise'
import logger from '@wdio/logger'
import { Services, Options } from '@wdio/types'
import { SevereServiceError } from 'webdriverio'

import { Workbench } from './pageobjects'
import { getLocators } from './utils'
import { VSCODE_APPLICATION_ARGS, DEFAULT_VSCODE_SETTINGS } from './constants'
import type { ServiceOptions, ServiceCapabilities, WDIOLogs } from './types'

const log = logger('wdio-vscode-service')

export default class VSCodeWorkerService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser

    constructor (private _options: ServiceOptions) {}

    async beforeSession (_: Options.Testrunner, capabilities: ServiceCapabilities) {
        const customArgs: string[] = []
        const storagePath = await tmp.dir()
        const userSettings = path.join(storagePath.path, 'settings', 'User')

        if (!this._options.extensionPath) {
            throw new SevereServiceError('No extension path provided')
        }

        log.info(`Setting up VSCode directory at ${userSettings}`)
        await fs.mkdir(userSettings, { recursive: true })
        await fs.writeFile(
            path.join(userSettings, 'settings.json'),
            JSON.stringify({
                ...DEFAULT_VSCODE_SETTINGS,
                ...(this._options.userSettings || {})
            }),
            'utf-8'
        )

        if (this._options.workspacePath) {
            customArgs.push(`--folder-uri=file:${slash(this._options.workspacePath)}`)
        }

        if (this._options.filePath) {
            customArgs.push(`--file-uri=file:${slash(this._options.filePath)}`)
        }

        if (this._options.verboseLogging) {
            customArgs.push('--verbose', '--logExtensionHostCommunication')
        }

        capabilities.browserName = 'chrome'
        capabilities['goog:chromeOptions'] = {
            binary: capabilities['wdio:vscodeService'].vscode.path,
            args: [
                ...VSCODE_APPLICATION_ARGS,
                `--extensionDevelopmentPath=${slash(this._options.extensionPath)}`,
                `--user-data-dir=${slash(path.join(storagePath.path, 'settings'))}`,
                `--extensions-dir=${slash(path.join(storagePath.path, 'extensions'))}`,
                ...customArgs,
                ...(this._options.args || [])
            ].filter(Boolean),
            windowTypes: ['webview']
        }
    }

    async before (capabilities: ServiceCapabilities, __: never, browser: WebdriverIO.Browser) {
        this._browser = browser
        const locators = await getLocators(capabilities['wdio:vscodeService'].vscode.version)
        const workbenchPO = new Workbench(locators)
        this._browser.addCommand('getWorkbench', () => workbenchPO.wait())
        this._browser.addCommand('getVSCodeVersion', () => capabilities['wdio:vscodeService'].vscode.version)
        this._browser.addCommand('getVSCodeChannel', () => (
            capabilities['wdio:vscodeService'].vscode.version === 'insiders' ? 'insiders' : 'vscode'
        ))
        return workbenchPO.elem.waitForExist()
    }

    async after () {
        if (!this._browser || !this._options.verboseLogging) {
            return
        }

        const logs = await this._browser.getLogs('browser').then(
            (res) => res as WDIOLogs[],
            (err) => err as Error
        )

        if (logs instanceof Error) {
            return
        }

        for (const l of logs) {
            log.info(
                `[${(new Date(l.timestamp)).toISOString()}]`
                + ` - ${l.source} - ${l.message}`
            )
        }
    }
}

declare global {
    namespace WebdriverIO {
        interface Browser {
            getWorkbench: () => Promise<Workbench>
            getVSCodeVersion: () => Promise<string>
            getVSCodeChannel: () => Promise<string>
        }
    }
}
