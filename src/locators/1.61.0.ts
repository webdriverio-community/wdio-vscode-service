import {
    DefaultTreeItem as DefaultTreeItemImport,
    BottomBarPanel as BottomBarPanelImport
} from './1.60.0'

export * from './1.60.0'
export const sideBar = {
    ...DefaultTreeItemImport,
    tooltip: '.monaco-icon-label'
}
export const bottomBar = {
    ...BottomBarPanelImport,
    globalActions: '.global-actions'
}
