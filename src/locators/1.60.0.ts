import { TerminalView as TerminalViewImport } from './1.59.0'

export * from './1.59.0'
export const bottomBar = {
    ...TerminalViewImport,
    newCommand: 'terminal: create new terminal'
}