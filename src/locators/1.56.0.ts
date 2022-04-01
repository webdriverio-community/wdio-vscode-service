import {
    TerminalView as TerminalViewImport,
    EditorView as EditorViewImport
} from './1.54.0'

export * from './1.54.0'
export const locatorVersion = '1.56.0'
export const TerminalView = {
    ...TerminalViewImport,
    newTerminal: './/a[@title=\'New Terminal\']'
}
export const EditorView = {
    ...EditorViewImport,
    webView: './/div[starts-with(@id, \'webview-editor\')]'
}
