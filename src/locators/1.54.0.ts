import { bottomBar as bottomBarImport } from './1.52.0'

export * from './1.52.0'
export const bottomBar = {
    ...bottomBarImport,
    TerminalView: {
        ...bottomBarImport.TerminalView,
        newTerminal: `.//a[starts-with(@title, 'Create New Integrated Terminal')]`,
        killTerminal: `.//a[@title='Kill the Active Terminal Instance']`
    }
}