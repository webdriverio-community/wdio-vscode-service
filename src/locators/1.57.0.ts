import {
    bottomBar as bottomBarImport,
    editor as editorImport
} from './1.56.0'

export * from './1.56.0'
export const bottomBar = {
    ...bottomBarImport,
    TerminalView: {
        ...bottomBarImport.TerminalView,
        elem: '.integrated-terminal'
    }
} as const
export const editor = {
    ...editorImport,
    EditorView: {
        ...editorImport.EditorView,
        settingsEditor: '.settings-editor'
    }
} as const