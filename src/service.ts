import fs from 'fs/promises'
import path from 'path'
import slash from 'slash'
import tmp from 'tmp-promise'
import logger from '@wdio/logger'
import getPort from 'get-port'
import decamelize from 'decamelize'
import { WebSocketServer, WebSocket } from 'ws'
import { Services, Options, Capabilities } from '@wdio/types'
import { SevereServiceError } from 'webdriverio'

import { Workbench } from './pageobjects'
import { getLocators, getValueSuffix, isVSCodeCapability } from './utils'
import {
    VSCODE_APPLICATION_ARGS, DEFAULT_VSCODE_SETTINGS, DEFAULT_PROXY_OPTIONS,
    SETTINGS_KEY, VSCODE_CAPABILITY_KEY
} from './constants'
import type {
    VSCodeCapabilities, WDIOLogs, ArgsParams, RemoteCommand, RemoteResponse,
    PendingMessageResolver, VSCodeOptions
} from './types'

const log = logger('wdio-vscode-service')

export default class VSCodeWorkerService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser
    private _wss?: WebSocketServer
    private _messageId = 0
    private _pendingMessages = new Map<number, PendingMessageResolver>()
    private _promisedSocket?: Promise<WebSocket>

    constructor (_: never, private _capabilities: VSCodeCapabilities) {}

    private _handleIncoming (data: Buffer) {
        try {
            const message = JSON.parse(data.toString('utf-8')) as RemoteResponse
            const resolver = this._pendingMessages.get(message.id)

            if (!resolver) {
                log.error(`Couldn't find remote message resolver with id ${message.id}`)
                return
            }

            resolver(message.error, message.result)
            return
        } catch (err: any) {
            log.error(`Error parsing remote response: ${err.message}`)
        }
    }

    /**
     * helper method to parse either normal or multiremote capabilities into
     * an array
     */
    private _parseCapabilities (capabilities?: Capabilities.RemoteCapability) {
        return ((capabilities || this._capabilities) as Capabilities.Capabilities).browserName
            ? [capabilities as VSCodeCapabilities]
            : Object.values(capabilities || this._capabilities).map((c) => c.capabilities as VSCodeCapabilities)
    }

    async beforeSession (_: Options.Testrunner, capabilities: Capabilities.RemoteCapability) {
        const caps = this._parseCapabilities(capabilities)
        for (const cap of caps) {
            await this._beforeSession(cap)
        }
    }

    private async _beforeSession (capabilities: VSCodeCapabilities) {
        /**
         * only run setup for VSCode capabilities
         */
        if (!isVSCodeCapability(capabilities)) {
            return
        }

        const vscodeOptions = capabilities[VSCODE_CAPABILITY_KEY] || {} as VSCodeOptions
        const proxyOptions = { ...DEFAULT_PROXY_OPTIONS, ...vscodeOptions.vscodeProxyOptions }
        const customArgs: ArgsParams = { ...VSCODE_APPLICATION_ARGS }
        const storagePath = await tmp.dir()
        const userSettingsPath = path.join(storagePath.path, 'settings', 'User')
        const userSettings: Record<string, any> = {
            ...DEFAULT_VSCODE_SETTINGS,
            ...(vscodeOptions.userSettings || {})
        }

        if (!vscodeOptions.extensionPath) {
            throw new SevereServiceError('No extension path provided')
        }

        if (proxyOptions.enable) {
            const port = await getPort({ port: proxyOptions.port })
            userSettings[SETTINGS_KEY].port = port
            log.info(`Start VSCode proxy server on port ${port}`)
            const wss = this._wss = new WebSocketServer({ port })
            this._promisedSocket = new Promise((resolve, reject) => {
                const socketTimeout = setTimeout(
                    () => reject(new Error('Connection timeout exceeded')),
                    proxyOptions.connectionTimeout
                )
                wss.on('connection', (socket) => {
                    log.info('Connected with VSCode workbench')
                    resolve(socket)
                    clearTimeout(socketTimeout)
                    socket.on('message', this._handleIncoming.bind(this))
                })
            })
        }

        customArgs.extensionDevelopmentPath = slash(vscodeOptions.extensionPath)
        customArgs.extensionTestsPath = slash(path.join(__dirname, 'proxy', 'index.js'))
        customArgs.userDataDir = slash(path.join(storagePath.path, 'settings'))
        customArgs.extensionsDir = slash(path.join(storagePath.path, 'extensions'))
        customArgs.vscodeBinaryPath = vscodeOptions.binary

        log.info(`Setting up VSCode directory at ${userSettingsPath}`)
        await fs.mkdir(userSettingsPath, { recursive: true })
        await fs.writeFile(
            path.join(userSettingsPath, 'settings.json'),
            JSON.stringify(userSettings),
            'utf-8'
        )

        if (vscodeOptions.workspacePath) {
            customArgs.folderUri = `file:${slash(vscodeOptions.workspacePath)}`
        }

        if (vscodeOptions.filePath) {
            customArgs.fileUri = `file:${slash(vscodeOptions.filePath)}`
        }

        if (vscodeOptions.verboseLogging) {
            customArgs.verbose = true
            customArgs.logExtensionHostCommunication = true
        }

        const binary = path.join(__dirname, 'chromium', `index.${process.platform === 'win32' ? 'exe' : 'js'}`)
        const args = Object.entries({ ...customArgs, ...vscodeOptions.vscodeArgs }).reduce(
            (prev, [key, value]) => [
                ...prev,
                `--${decamelize(key, { separator: '-' })}${getValueSuffix(value)}`
            ],
            [] as string[]
        )

        /**
         * need to rename capability back to Chrome otherwise Chromedriver
         * won't recognise this capability
         */
        capabilities.browserName = 'chrome'
        capabilities['goog:chromeOptions'] = { binary, args, windowTypes: ['webview'] }
        log.info(`Start VSCode: ${binary} ${args.join(' ')}`)
    }

    async before (capabilities: Capabilities.RemoteCapability, __: never, browser: WebdriverIO.Browser) {
        const caps = this._parseCapabilities(capabilities)
        for (const cap of caps) {
            await this._before(cap, browser)
        }
    }

    private async _before (capabilities: VSCodeCapabilities, browser: WebdriverIO.Browser) {
        /**
         * only run setup for VSCode capabilities
         */
        if (!isVSCodeCapability(capabilities)) {
            return
        }

        this._browser = browser
        const locators = await getLocators(capabilities.browserVersion || 'insiders')
        const workbenchPO = new Workbench(locators)
        this._browser.addCommand('getWorkbench', () => workbenchPO.wait())
        this._browser.addCommand('executeWorkbench', (
            fn: Function | string,
            ...params: any[]
        ) => this._executeVSCode(capabilities, fn, params))
        this._browser.addCommand('getVSCodeVersion', () => capabilities.browserVersion)
        this._browser.addCommand('getVSCodeChannel', () => (
            capabilities.browserVersion === 'insiders' ? 'insiders' : 'vscode'
        ))
        await workbenchPO.elem.waitForExist()
    }

    async after () {
        const caps = this._parseCapabilities()
        for (const cap of caps) {
            await this._after(cap)
        }
    }

    private async _after (capabilities: VSCodeCapabilities) {
        if (
            !isVSCodeCapability(capabilities)
            || !this._browser
            || !capabilities[VSCODE_CAPABILITY_KEY]?.verboseLogging
        ) {
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

        if (this._wss) {
            this._wss.close()
        }
    }

    private async _executeVSCode (capabilities: VSCodeCapabilities, fn: Function | string, ...params: any[]) {
        if (!this._promisedSocket) {
            throw new Error('VSCode API proxy not enabled, see "vscodeProxyOptions" option in service docs')
        }

        const vscodeOptions = capabilities[VSCODE_CAPABILITY_KEY] || {} as VSCodeOptions
        const proxyOptions = { ...DEFAULT_PROXY_OPTIONS, ...vscodeOptions.vscodeProxyOptions }
        const socket = await this._promisedSocket

        const proxyFn = typeof fn === 'function'
            ? fn.toString()
            : fn

        socket.send(JSON.stringify(<RemoteCommand>{
            id: this._messageId,
            fn: proxyFn,
            params
        }))

        const returnVal = new Promise((resolve, reject) => {
            const cmdTimeout = setTimeout(
                () => reject(new Error('Remote command timeout exceeded')),
                proxyOptions.commandTimeout
            )
            this._pendingMessages.set(this._messageId, (error: string | undefined, result: any) => {
                clearTimeout(cmdTimeout)
                if (error) {
                    reject(new Error(error))
                    return
                }
                resolve(result)
            })
        })
        this._messageId += 1
        return returnVal
    }
}

declare global {
    namespace WebdriverIO {
        interface Browser {
            getWorkbench: () => Promise<Workbench>
            // Todo(Christian): properly type VSCode object here
            executeWorkbench: <T>(fn: (vscode: any, ...params: any[]) => T) => Promise<T>
            getVSCodeVersion: () => Promise<string>
            getVSCodeChannel: () => Promise<string>
        }
    }
}
