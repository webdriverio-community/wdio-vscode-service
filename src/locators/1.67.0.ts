import {
    BottomBarPanel as BottomBarPanelImport,
    ViewSection as ViewSectionImport,
    ViewTitlePart as ViewTitlePartImport,
    ScmView as ScmViewImport,
    TreeItem as TreeItemImport
} from './1.66.0'

export * from './1.66.0'
export const locatorVersion = '1.70.0'
export const BottomBarPanel = {
    ...BottomBarPanelImport,
    action: (label: string) => `.//li[starts-with(@title, '${label}')]`
}
export const ViewSection = {
    ...ViewSectionImport,
    buttonLabel: 'aria-label',
    actionConstructor: () => './/a[contains(@class, \'action-label\') and @role=\'button\']'
}
export const ViewTitlePart = {
    ...ViewTitlePartImport,
    action: '.action-label',
    actionContstructor: (title: string) => `.//a[@title='${title}']`
}
export const ScmView = {
    ...ScmViewImport,
    action: '.action-item.menu-entry',
    actionConstructor: (title: string) => `.//li[@title='${title}']`
}
export const TreeItem = {
    ...TreeItemImport,
    actionLabel: '.action-item'
}
