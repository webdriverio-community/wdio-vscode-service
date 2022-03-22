import type { ChainablePromiseElement } from 'webdriverio'

import { TreeSection } from '../TreeSection'
import { TreeItem, ViewItemLocators } from '../../ViewItem'
import { PluginDecorator, IPluginDecorator, VSCodeLocatorMap } from '../../../utils'
import { CustomTreeItem as CustomTreeItemLocator } from '../../../../locators/1.61.0'

export interface CustomTreeItem extends IPluginDecorator<ViewItemLocators> { }
/**
 * View item in a custom-made content section (e.g. an extension tree view)
 *
 * @category Sidebar
 */
@PluginDecorator(CustomTreeItemLocator)
export class CustomTreeItem extends TreeItem {
    /**
     * @private
     */
    public locatorKey = 'CustomTreeItem' as const

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public viewPart: TreeSection
    ) {
        super(locators, element, viewPart.elem)
    }

    async getLabel (): Promise<string> {
        return this.elem.$(this.locatorMap.CustomTreeSection.itemLabel as string).getText()
    }

    async getTooltip (): Promise<string> {
        return this.elem.getAttribute(this.locators.tooltipAttribute)
    }

    async getDescription (): Promise<string> {
        return this.description$.getText()
    }

    async isExpanded (): Promise<boolean> {
        const attr = await this.elem.getAttribute(this.locators.expandedAttr)
        return attr === this.locators.expandedValue
    }

    async getChildren (): Promise<TreeItem[]> {
        const rows = await this.getChildItems(this.locatorMap.DefaultTreeSection.itemRow as string)
        const items = await Promise.all(
            rows.map(async (row) => (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                new CustomTreeItem(this.locatorMap, row as any, this.viewPart).wait()
            ))
        )
        return items
    }

    async isExpandable (): Promise<boolean> {
        const attr = await this.elem.getAttribute(this.locators.expandedAttr)
        return attr !== null
    }
}
