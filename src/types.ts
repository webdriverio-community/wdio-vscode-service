import type { ChromedriverServiceOptions } from 'wdio-chromedriver-service'
import type { DownloadOptions } from '@vscode/test-electron/out/download'
import type { Capabilities } from '@wdio/types'

export type VSCodeChannel = 'stable' | 'insiders'

export interface ServiceDownloadOptions extends Omit<DownloadOptions, 'version'> {
    version: VSCodeChannel
}

export interface ServiceOptions extends ChromedriverServiceOptions {
    vscode?: ServiceDownloadOptions
    cachePath?: string
    extensionPath: string
    userSettings?: Record<string, any>
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
