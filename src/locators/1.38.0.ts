import { editor as editorImport } from './1.37.0'

export * from './1.37.0'
export const editor = {
    ...editorImport,
    EditorView: {
        ...editorImport.EditorView,
        settingsEditor: './/div[@data-editor-id=\'workbench.editor.settings2\']',
        webView: './/div[@data-editor-id=\'WebviewEditor\']'
    }
} as const