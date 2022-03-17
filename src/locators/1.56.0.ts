import {
    bottomBar as bottomBarImport,
    editor as editorImport
} from './1.54.0'

export * from './1.54.0'
export const bottomBar = {
    ...bottomBarImport,
    TerminalView: {
        ...bottomBarImport.TerminalView,
        newTerminal: `.//a[@title='New Terminal']`
    }
}
export const editor = {
    ...editorImport,
    EditorView: {
        ...editorImport.EditorView,
        webView: `.//div[starts-with(@id, 'webview-editor')]`
    }
}