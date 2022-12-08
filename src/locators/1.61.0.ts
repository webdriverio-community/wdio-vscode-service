import {
    DefaultTreeItem as DefaultTreeItemImport,
    BottomBarPanel as BottomBarPanelImport
} from './1.60.0.js'

export * from './1.60.0.js'
export const locatorVersion = '1.61.0'
export const DefaultTreeItem = {
    ...DefaultTreeItemImport,
    tooltip: '.monaco-icon-label'
}
export const BottomBarPanel = {
    ...BottomBarPanelImport,
    globalActions: '.global-actions'
}
