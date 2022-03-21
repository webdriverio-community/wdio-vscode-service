import {
    TerminalView as TerminalViewImport,
    EditorView as EditorViewImport
} from './1.54.0'

export * from './1.54.0'
export const bottomBar = {
    ...TerminalViewImport,
    newTerminal: './/a[@title=\'New Terminal\']'
}
export const editor = {
    ...EditorViewImport,
    webView: './/div[starts-with(@id, \'webview-editor\')]'
}
