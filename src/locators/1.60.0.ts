import { TerminalView as TerminalViewImport } from './1.59.0'

export * from './1.59.0'
export const locatorVersion = '1.60.0'
export const TerminalView = {
    ...TerminalViewImport,
    newCommand: 'terminal: create new terminal'
}
