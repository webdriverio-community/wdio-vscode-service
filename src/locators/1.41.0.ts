import {
    ViewSection as ViewSectionImport,
    ScmView as ScmViewImport
} from './1.40.0.js'

export * from './1.40.0.js'
export const locatorVersion = '1.41.0'
export const ViewSection = {
    ...ViewSectionImport,
    header: '.pane-header'
}
export const ScmView = {
    ...ScmViewImport,
    providerHeader: '.div[class*=\'pane-header scm-provider\']'
}
