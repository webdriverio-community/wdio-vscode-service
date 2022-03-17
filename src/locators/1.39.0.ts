import {
    workbench as workbenchImport,
    bottomBar as bottomBarImport,
    sideBar as sideBarImport
} from './1.38.0'

export * from './1.38.0'
export const workbench = {
    ...workbenchImport,
    NotificationsCenter: {
        ...workbenchImport.NotificationsCenter,
        closeBtn: '.codicon-chevron-down',
        clear: '.codicon-close-all'
    },
    Notification: {
        ...workbenchImport.Notification,
        dismiss: '.codicon-close'
    }
}
export const bottomBar = {
    ...bottomBarImport,
    BottomBarViews: {
        ...bottomBarImport.BottomBarViews,
        clearText: '.codicon-clear-all'
    }
}
export const sideBar = {
    ...sideBarImport,
    ScmView: {
        ...sideBarImport.ScmView,
        more: '.codicon-more'
    }
}