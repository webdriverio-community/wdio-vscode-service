import { CustomTreeItem as CustomTreeItemImport } from './1.45.0'

export * from './1.45.0'
export const CustomTreeItem = {
    ...CustomTreeItemImport,
    elem: (label: string) => `.//div[@role='listitem' and .//span[text()='${label}']]`
}