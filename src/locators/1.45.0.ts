import {
    workbench as workbenchImport,
    editor as editorImport,
    sideBar as sideBarImport
} from './1.44.0'

export * from './1.44.0'
export const workbench = {
    ...workbenchImport,
    NotificationsCenter: {
        ...workbenchImport.NotificationsCenter,
        closeBtn: '.codicon-notifications-hide',
        clear: '.codicon-notifications-clear-all'
    },
    Notification: {
        ...workbenchImport.Notification,
        dismiss: '.codicon-notifications-clear'
    }
} as const
export const editor = {
    ...editorImport,
    EditorView: {
        ...editorImport.EditorView,
        tabSeparator: ''
    }
} as const
export const sideBar = {
    ...sideBarImport,
    ScmView: {
        ...sideBarImport.ScmView,
        more: '.codicon-toolbar-more'
    }
} as const