import fs from 'fs/promises'
import path from 'path'
import slash from 'slash'
import tmp from 'tmp-promise'
import logger from '@wdio/logger'
import decamelize from 'decamelize'
import { Services, Options } from '@wdio/types'
import { SevereServiceError } from 'webdriverio'

import { Workbench } from './pageobjects'
import { getLocators, getValueSuffix } from './utils'
import { VSCODE_APPLICATION_ARGS, DEFAULT_VSCODE_SETTINGS } from './constants'
import type {
    ServiceOptions, ServiceCapabilities, WDIOLogs, ArgsParams
} from './types'

const log = logger('wdio-vscode-service')

export default class VSCodeWorkerService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser

    constructor (private _options: ServiceOptions) {}

    async beforeSession (_: Options.Testrunner, capabilities: ServiceCapabilities) {
        const customArgs: ArgsParams = { ...VSCODE_APPLICATION_ARGS }
        const storagePath = await tmp.dir()
        const userSettings = path.join(storagePath.path, 'settings', 'User')

        if (!this._options.extensionPath) {
            throw new SevereServiceError('No extension path provided')
        }

        customArgs.extensionDevelopmentPath = slash(this._options.extensionPath)
        customArgs.userDataDir = slash(path.join(storagePath.path, 'settings'))
        customArgs.extensionsDir = slash(path.join(storagePath.path, 'extensions'))
        customArgs.vscodeBinaryPath = capabilities['wdio:vscodeService'].vscode.path

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
            customArgs.folderUri = `file:${slash(this._options.workspacePath)}`
        }

        if (this._options.filePath) {
            customArgs.fileUri = `file:${slash(this._options.filePath)}`
        }

        if (this._options.verboseLogging) {
            customArgs.verbose = true
            customArgs.logExtensionHostCommunication = true
        }

        const binary = path.join(__dirname, 'chromium', `index.${process.platform === 'win32' ? 'exe' : 'js'}`)
        const args = Object.entries({ ...customArgs, ...this._options.vscodeArgs }).reduce(
            (prev, [key, value]) => [
                ...prev,
                `--${decamelize(key, { separator: '-' })}${getValueSuffix(value)}`
            ],
            [] as string[]
        )
        capabilities.browserName = 'chrome'
        capabilities['goog:chromeOptions'] = { binary, args, windowTypes: ['webview'] }
        log.info(`Start VSCode: ${binary} ${args.join(' ')}`)
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
