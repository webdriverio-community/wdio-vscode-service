import type { ChromedriverServiceOptions } from 'wdio-chromedriver-service'
import type { DownloadOptions } from '@vscode/test-electron/out/download'
import type { Capabilities } from '@wdio/types'

export type VSCodeChannel = 'stable' | 'insiders'

export interface ServiceDownloadOptions extends Omit<DownloadOptions, 'version'> {
    version: VSCodeChannel
}

export interface ServiceOptions extends ChromedriverServiceOptions {
    vscode?: ServiceDownloadOptions
    extensionPath: string
    userSettings?: Record<string, any>
}

export interface ServiceCapabilities extends Capabilities.Capabilities {
    'wdio:vscodeService': {
        vscodePath: string
    }
}

export type Locators = Record<string | symbol, string | Function>
/**
 * Available types of notifications
 */
export enum NotificationType {
    Info = 'info',
    Warning = 'warning',
    Error = 'error',
    Any = 'any'
}