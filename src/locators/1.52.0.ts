import { sideBar as sideBarImport } from './1.50.0'

export * from './1.50.0'
export const sideBar = {
    ...sideBarImport,
    DefaultTreeItem: {
        ...sideBarImport.DefaultTreeItem,
        tooltip: '.monaco-icon-label-container'
    }
} as const