import { sideBar as sideBarImport } from './1.46.0'

export * from './1.46.0'
export const sideBar = {
    ...sideBarImport,
    CustomTreeItem: {
        ...sideBarImport.CustomTreeItem,
        elem: (label: string) => `.//div[@role='treeitem' and .//span[text()='${label}']]`
    },
    ScmView: {
        ...sideBarImport.ScmView,
        changes: './/div[@role="treeitem" and .//div/text()="Changes"]',
        stagedChanges: './/div[@role="treeitem" and .//div/text()="Staged Changes"]',
        providerTitle: 'name',
        providerType: 'description'
    }
} as const
