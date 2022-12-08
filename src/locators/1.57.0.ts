import {
    TerminalView as TerminalViewImport,
    EditorView as EditorViewImport
} from './1.56.0.js'

export * from './1.56.0.js'
export const locatorVersion = '1.57.0'
export const TerminalView = {
    ...TerminalViewImport,
    elem: '.integrated-terminal'
}
export const EditorView = {
    ...EditorViewImport,
    settingsEditor: '.settings-editor'
}
