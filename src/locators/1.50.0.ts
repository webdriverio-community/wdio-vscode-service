import { EditorView as EditorViewImport } from './1.49.0'

export * from './1.49.0'
export const locatorVersion = '1.50.0'
export const EditorView = {
    ...EditorViewImport,
    closeTab: '.codicon-close'
}
