import { sideBar as sideBarImport } from './1.45.0'

export * from './1.45.0'
export const sideBar = {
    ...sideBarImport,
    CustomTreeItem: {
        ...sideBarImport.CustomTreeItem,
        elem: (label: string) => `.//div[@role='listitem' and .//span[text()='${label}']]`
    }
}