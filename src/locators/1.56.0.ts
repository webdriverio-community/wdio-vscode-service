import {
    TerminalView as TerminalViewImport,
    EditorView as EditorViewImport
} from './1.54.0.js'

export * from './1.54.0.js'
export const locatorVersion = '1.56.0'
export const TerminalView = {
    ...TerminalViewImport,
    newTerminal: './/a[@title=\'New Terminal\']'
}
export const EditorView = {
    ...EditorViewImport,
    webView: './/div[starts-with(@id, \'webview-editor\')]'
}
