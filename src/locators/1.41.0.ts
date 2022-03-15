import { sideBar as sideBarImport } from './1.40.0'

export * from './1.40.0'
export const sideBar = {
    ...sideBarImport,
    ViewSection: {
        ...sideBarImport.ViewSection,
        header: '.pane-header'
    },
    ScmView: {
        ...sideBarImport.ScmView,
        providerHeader: `.div[class*='pane-header scm-provider']`
    }
} as const