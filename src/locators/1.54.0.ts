import { TerminalView as TerminalViewImport } from './1.52.0'

export * from './1.52.0'
export const locatorVersion = '1.54.0'
export const TerminalView = {
    ...TerminalViewImport,
    newTerminal: './/a[starts-with(@title, \'Create New Integrated Terminal\')]',
    killTerminal: './/a[@title=\'Kill the Active Terminal Instance\']'
}
