import { TerminalView as TerminalViewImport } from './1.47.0.js'

export * from './1.47.0.js'
export const locatorVersion = '1.49.0'
export const TerminalView = {
    ...TerminalViewImport,
    elem: '.terminal-outer-container'
}
