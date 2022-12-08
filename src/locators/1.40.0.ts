import { NotificationsCenter as NotificationsCenterImport } from './1.39.0.js'

export * from './1.39.0.js'
export const locatorVersion = '1.40.0'
export const NotificationsCenter = {
    ...NotificationsCenterImport,
    closeBtn: '.codicon-close',
    clear: '.codicon-clear-all'
}
