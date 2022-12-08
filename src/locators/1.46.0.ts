import { CustomTreeItem as CustomTreeItemImport } from './1.45.0.js'

export * from './1.45.0.js'
export const locatorVersion = '1.46.0'
export const CustomTreeItem = {
    ...CustomTreeItemImport,
    elem: (label: string) => `.//div[@role='listitem' and .//span[text()='${label}']]`
}
