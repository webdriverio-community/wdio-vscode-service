import {
    workbench as workbenchImport,
    input as inputImport
} from './1.41.0'

export * from './1.41.0'
export const workbench = {
    ...workbenchImport,
    NotificationsCenter: {
        ...workbenchImport.NotificationsCenter,
        closeBtn: '.codicon-chevron-down'
    }
} as const
export const input = {
    ...inputImport,
    Input: {
        ...inputImport.Input,
        quickPickIndex: (index: number) => `.//div[@role='listitem' and @data-index='${index}']`
    }
} as const