import {
    CustomTreeItem as CustomTreeItemImport,
    ScmView as ScmViewImport
} from './1.46.0.js'

export * from './1.46.0.js'
export const locatorVersion = '1.47.0'
export const CustomTreeItem = {
    ...CustomTreeItemImport,
    elem: (label: string) => `.//div[@role='treeitem' and .//span[text()='${label}']]`
}
export const ScmView = {
    ...ScmViewImport,
    changes: './/div[@role="treeitem" and .//div/text()="Changes"]',
    stagedChanges: './/div[@role="treeitem" and .//div/text()="Staged Changes"]',
    providerTitle: 'name',
    providerType: 'description'
}
