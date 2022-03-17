import {
    ViewSection as ViewSectionImport,
    ScmView as ScmViewImport
} from './1.40.0'

export * from './1.40.0'
export const ViewSection = {
    ...ViewSectionImport,
    header: '.pane-header'
}
export const ScmView = {
    ...ScmViewImport,
    providerHeader: `.div[class*='pane-header scm-provider']`
}