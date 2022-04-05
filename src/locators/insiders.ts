import {
    QuickOpenBox as QuickOpenBoxImport
} from './1.66.0'

export * from './1.66.0'
export const locatorVersion = 'insiders'
export const QuickOpenBox = {
    ...QuickOpenBoxImport,
    elem: '.quick-input-widget'
}
