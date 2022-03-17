import {
    sideBar as sideBarImport,
    bottomBar as bottomBarImport
} from './1.60.0'

export * from './1.60.0'
export const sideBar = {
    ...sideBarImport,
    DefaultTreeItem: {
        ...sideBarImport.DefaultTreeItem,
        tooltip: '.monaco-icon-label'
    }
}
export const bottomBar = {
    ...bottomBarImport,
    BottomBarPanel: {
        ...bottomBarImport.BottomBarPanel,
        globalActions: '.global-actions'
    }
}