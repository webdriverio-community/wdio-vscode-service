import {
    TerminalView as TerminalViewImport,
    EditorView as EditorViewImport
} from './1.56.0'

export * from './1.56.0'
export const TerminalView = {
    ...TerminalViewImport,
    elem: '.integrated-terminal'
}
export const editor = {
    ...EditorViewImport,
    settingsEditor: '.settings-editor'
}