import { DefaultTreeItem as DefaultTreeItemImport } from './1.50.0'

export * from './1.50.0'
export const locatorVersion = '1.52.0'
export const DefaultTreeItem = {
    ...DefaultTreeItemImport,
    tooltip: '.monaco-icon-label-container'
}
