import {
    NotificationsCenter as NotificationsCenterImport,
    Input as InputImport
} from './1.41.0'

export * from './1.41.0'
export const NotificationsCenter = {
    ...NotificationsCenterImport,
    closeBtn: '.codicon-chevron-down'
}
export const Input = {
    ...InputImport,
    quickPickIndex: (index: number) => `.//div[@role='listitem' and @data-index='${index}']`
}
