import {
    NotificationsCenter as NotificationsCenterImport,
    Notification as NotificationImport,
    BottomBarViews as BottomBarViewsImport,
    ScmView as ScmViewImport
} from './1.38.0.js'

export * from './1.38.0.js'
export const locatorVersion = '1.39.0'
export const NotificationsCenter = {
    ...NotificationsCenterImport,
    closeBtn: '.codicon-chevron-down',
    clear: '.codicon-close-all'
}
export const Notification = {
    ...NotificationImport,
    dismiss: '.codicon-close'
}
export const BottomBarViews = {
    ...BottomBarViewsImport,
    clearText: '.codicon-clear-all'
}
export const ScmView = {
    ...ScmViewImport,
    more: '.codicon-more'
}
