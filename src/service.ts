import fs from 'fs/promises'
import path from 'path'
import slash from 'slash'
import tmp from 'tmp-promise'
import logger from '@wdio/logger'
import decamelize from 'decamelize'
import { WebSocketServer, WebSocket } from 'ws'
import { Services, Options } from '@wdio/types'
import { SevereServiceError } from 'webdriverio'

import { Workbench } from './pageobjects'
import { getLocators, getValueSuffix } from './utils'
import {
    VSCODE_APPLICATION_ARGS, DEFAULT_VSCODE_SETTINGS, DEFAULT_PROXY_OPTIONS
} from './constants'
import type {
    ServiceOptions, ServiceCapabilities, WDIOLogs, ArgsParams,
    RemoteCommand, RemoteResponse, PendingMessageResolver,
    VSCodeProxyOptions
} from './types'

const log = logger('wdio-vscode-service')

export default class VSCodeWorkerService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser
    private _wss?: WebSocketServer
    private _messageId = 0
    private _pendingMessages = new Map<number, PendingMessageResolver>()
    private _promisedSocket?: Promise<WebSocket>
    private _proxyOptions: Required<VSCodeProxyOptions>

    constructor (private _options: ServiceOptions) {
        this._proxyOptions = { ...DEFAULT_PROXY_OPTIONS, ...this._options.vscodeProxyOptions }

        if (this._proxyOptions.enable) {
            this._wss = new WebSocketServer({ port: this._proxyOptions.port })
            this._promisedSocket = new Promise((resolve, reject) => {
                const socketTimeout = setTimeout(
                    () => reject(new Error('Connection timeout exceeded')),
                    this._proxyOptions.connectionTimeout
                )
                this._wss!.on('connection', (socket) => {
                    resolve(socket)
                    clearTimeout(socketTimeout)
                    socket.on('message', this._handleIncoming.bind(this))
                })
            })
        }
    }

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

    async beforeSession (_: Options.Testrunner, capabilities: ServiceCapabilities) {
        const customArgs: ArgsParams = { ...VSCODE_APPLICATION_ARGS }
        const storagePath = await tmp.dir()
        const userSettings = path.join(storagePath.path, 'settings', 'User')

        if (!this._options.extensionPath) {
            throw new SevereServiceError('No extension path provided')
        }

        customArgs.extensionDevelopmentPath = slash(this._options.extensionPath)
        customArgs.extensionTestsPath = slash(path.join(__dirname, 'proxy', 'index.js'))
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
        this._browser.addCommand('executeWorkbench', this._executeVSCode.bind(this))
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

        if (this._wss) {
            this._wss.close()
        }
    }

    private async _executeVSCode (fn: Function | string, ...params: any[]) {
        if (!this._promisedSocket) {
            throw new Error('VSCode API proxy not enabled, see "vscodeProxyOptions" option in service docs')
        }

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
                this._proxyOptions.commandTimeout
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
