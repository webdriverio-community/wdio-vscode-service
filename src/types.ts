import type { ChromedriverServiceOptions } from 'wdio-chromedriver-service'
import type { DownloadOptions } from '@vscode/test-electron/out/download'
import type { Capabilities } from '@wdio/types'

export type VSCodeChannel = 'stable' | 'insiders'

export interface ServiceDownloadOptions extends Omit<DownloadOptions, 'version'> {
    version: VSCodeChannel
}

/**
 * wdio-vscode-service options
 */
export interface ServiceOptions extends ChromedriverServiceOptions {
    /**
     * Define which VSCode application should be used for testing
     */
    vscode?: ServiceDownloadOptions
    /**
     * Define a cache path to avoid re-downloading all bundles
     */
    cachePath?: string
    /**
     * Define the directory to the extension you want to test
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
     * Additional start-up arguments
     */
    args?: string[]
    /**
     * If set to true, service logs VSCode output from the extension host
     * and console API
     *
     * @default `true`
     */
    verboseLogging?: boolean
}

export interface BundleInformation {
    version: string
    path: string
}

export interface ServiceCapability {
    vscode: BundleInformation
    chromedriver: BundleInformation
}

export interface ServiceCapabilities extends Capabilities.Capabilities {
    'wdio:vscodeService': ServiceCapability
}

export interface WDIOLogs {
    level: string
    message: string
    source: string
    timestamp: number
}
