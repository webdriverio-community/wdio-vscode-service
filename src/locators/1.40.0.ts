import { workbench as workbenchImport } from './1.39.0'

export * from './1.39.0'
export const workbench = {
    ...workbenchImport,
    NotificationsCenter: {
        ...workbenchImport.NotificationsCenter,
        closeBtn: '.codicon-close',
        clear: '.codicon-clear-all'
    }
} as const