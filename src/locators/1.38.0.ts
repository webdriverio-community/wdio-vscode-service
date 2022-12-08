import { EditorView as EditorViewImport } from './1.37.0.js'

export * from './1.37.0.js'
export const locatorVersion = '1.38.0'
export const EditorView = {
    ...EditorViewImport,
    settingsEditor: './/div[@data-editor-id=\'workbench.editor.settings2\']',
    webView: './/div[@data-editor-id=\'WebviewEditor\']'
}
