import { editor as editorImport } from './1.49.0'

export * from './1.49.0'
export const editor = {
    ...editorImport,
    EditorView: {
        ...editorImport.EditorView,
        closeTab: '.codicon-close'
    }
} as const