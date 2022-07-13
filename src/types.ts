import type { ChromedriverServiceOptions } from 'wdio-chromedriver-service'
import type { Capabilities } from '@wdio/types'
import type { VSCODE_CAPABILITY_KEY } from './constants'

/**
 * extend WebdriverIO capabilities object
 */
export interface WDIOVSCodeServiceOptions {
    [VSCODE_CAPABILITY_KEY]?: VSCodeOptions
}

export interface VSCodeCapabilities extends Capabilities.Capabilities, WDIOVSCodeServiceOptions {}

/**
 * Settings to handle VSCode Proxy API
 */
export interface VSCodeProxyOptions {
    /**
     * If set to true, the service tries to establish a connection with the
     * VSCode workbench to enable access to the VSCode API
     * @default true
     */
    enable: boolean
    /**
     * Port of the WebSocket connection used to connect to the workbench.
     * By default set to an available port in your operating system.
     */
    port?: number
    /**
     * Timeout for connecting to WebSocket inside of VSCode
     * @default 5000
     */
    connectionTimeout?: number
    /**
     * Timeout for command to be executed within VSCode
     * @default 5000
     */
    commandTimeout?: number
}

export type ArgsParams = Record<string, string | boolean>

/**
 * wdio-vscode-service options
 */
export interface ServiceOptions extends ChromedriverServiceOptions {
    /**
     * Define a cache path to avoid re-downloading all bundles
     */
    cachePath?: string
}

export interface BundleInformation {
    version: string
    path: string
}

export interface ServiceCapability {
    vscode: BundleInformation
    chromedriver: BundleInformation
}

/**
 * Options to manage VSCode session as part of session capability
 */
export interface VSCodeOptions {
    /**
     * Path to custom VSCode installation
     */
    binary?: string
    /**
     * Define the directory to the extension you want to test
     * @required
     */
    extensionPath: string
    /**
     * Define custom user settings to be applied to VSCode
     */
    userSettings?: Record<string, number | string | object | boolean>
    /**
     * Opens VSCode for a specific workspace
     */
    workspacePath?: string
    /**
     * Opens VSCode with a specific file opened
     */
    filePath?: string
    /**
     * Additional start-up arguments as object, e.g.
     * ```
     * vscodeArgs: { fooBar: true, 'bar-foo': '/foobar' }
     * ```
     * will be passed in as:
     * ```
     * --foo-bar --fooBar --bar-foo=/foobar
     * ```
     */
    vscodeArgs?: ArgsParams
    /**
     * If set to true, service logs VSCode output from the extension host
     * and console API
     *
     * @default `true`
     */
    verboseLogging?: boolean
    /**
     * VSCode API proxy configurations
     */
    vscodeProxyOptions?: Partial<VSCodeProxyOptions>
}

export interface WDIOLogs {
    level: string
    message: string
    source: string
    timestamp: number
}

export interface RemoteCommand {
    id: number
    fn: string
    params: any[]
}

export interface RemoteResponse {
    id: number
    result: any,
    error?: string
}

export type PendingMessageResolver = (error: string | undefined, result: any) => void
