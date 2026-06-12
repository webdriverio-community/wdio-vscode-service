import {
    BottomBarPanel as BottomBarPanelImport,
    EditorView as EditorViewImport,
    SettingsEditor as SettingsEditorImport
} from './1.87.0.js'

export * from './1.87.0.js'
export const locatorVersion = '1.123.0'

export const BottomBarPanel = {
    ...BottomBarPanelImport,
    tabContainer: '.composite-bar-container .composite-bar .monaco-action-bar',
    tab: (title: string) => `.//li[.//a[starts-with(@aria-label, '${title}')]]`
}

export const EditorView = {
    ...EditorViewImport,
    closeTab: '.tab-actions .action-label'
}

export const SettingsEditor = {
    ...SettingsEditorImport,
    searchInput: '.settings-search-input input'
}
