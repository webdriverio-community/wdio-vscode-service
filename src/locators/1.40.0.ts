import { NotificationsCenter as NotificationsCenterImport } from './1.39.0'

export * from './1.39.0'
export const locatorVersion = '1.40.0'
export const NotificationsCenter = {
    ...NotificationsCenterImport,
    closeBtn: '.codicon-close',
    clear: '.codicon-clear-all'
}
