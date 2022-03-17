import { bottomBar as bottomBarImport } from './1.59.0'

export * from './1.59.0'
export const bottomBar = {
    ...bottomBarImport,
    TerminalView: {
        ...bottomBarImport.TerminalView,
        newCommand: 'terminal: create new terminal'
    }
}