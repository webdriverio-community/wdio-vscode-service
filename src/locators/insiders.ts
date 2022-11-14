import {
    QuickOpenBox as QuickOpenBoxImport
} from './1.73.0'

export * from './1.73.0'
export const locatorVersion = 'insiders'
export const QuickOpenBox = {
    ...QuickOpenBoxImport,
    elem: '.quick-input-widget'
}
