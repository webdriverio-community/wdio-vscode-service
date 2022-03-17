import {
    NotificationsCenter as NotificationsCenterImport,
    Notification as NotificationImport,
    EditorView as EditorViewImport,
    ScmView as ScmViewImport
} from './1.44.0'

export * from './1.44.0'
export const NotificationsCenter = {
    ...NotificationsCenterImport,
    closeBtn: '.codicon-notifications-hide',
    clear: '.codicon-notifications-clear-all'
}
export const Notification = {
    ...NotificationImport,
    dismiss: '.codicon-notifications-clear'
}
export const EditorView = {
    ...EditorViewImport,
    tabSeparator: ''
}
export const ScmView = {
    ...ScmViewImport,
    more: '.codicon-toolbar-more'
}