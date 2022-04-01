import { FindWidget as FindWidgetImport } from './1.57.0'

export * from './1.57.0'
export const locatorVersion = '1.59.0'
export const FindWidget = {
    ...FindWidgetImport,
    toggleReplace: './/div[@title="Toggle Replace"]'
}
