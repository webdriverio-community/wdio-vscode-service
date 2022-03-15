import { bottomBar as bottomBarImport } from './1.47.0'

export * from './1.47.0'
export const bottomBar = {
    ...bottomBarImport,
    TerminalView: {
        ...bottomBarImport.TerminalView,
        elem: '.terminal-outer-container'
    }
} as const