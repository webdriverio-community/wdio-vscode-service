import path from 'path'
import type { ArgsParams } from './types'

export const DEFAULT_CHANNEL = 'stable'
export const VSCODE_APPLICATION_ARGS: ArgsParams = {
    // https://github.com/microsoft/vscode/issues/84238
    noSandbox: true,
    // https://github.com/microsoft/vscode-test/issues/120
    disableUpdates: true,
    skipWelcome: true,
    skipReleaseNotes: true,
    disableWorkspaceTrust: true,
    disableExtensions: true
}
export const DEFAULT_VSCODE_SETTINGS = {
    'window.titleBarStyle': 'custom',
    'workbench.editor.enablePreview': false,
    'window.restoreFullscreen': true,
    'window.newWindowDimensions': 'maximized',
    'security.workspace.trust.enabled': false,
    'window.dialogStyle': 'custom',
    'files.simpleDialog.enable': true
}
export const VSCODE_RELEASES = 'https://update.code.visualstudio.com/api/releases/stable'
export const VSCODE_MANIFEST_URL = 'https://raw.githubusercontent.com/microsoft/vscode/%s/cgmanifest.json'
export const CHROMEDRIVER_RELEASES = 'https://chromedriver.storage.googleapis.com/LATEST_RELEASE_%s'
export const CHROMEDRIVER_DOWNLOAD_PATH = 'https://chromedriver.storage.googleapis.com/%s/chromedriver_%s.zip'

export const DEFAULT_CACHE_PATH = path.join(process.cwd(), '.wdio-vscode-service')
export const CMD_KEY = process.platform === 'win32' ? 'Control' : 'Meta'
