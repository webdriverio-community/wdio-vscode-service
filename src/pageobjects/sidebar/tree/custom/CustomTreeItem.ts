import type { ChainablePromiseElement } from 'webdriverio'

import { TreeSection } from '../TreeSection.js'
import { TreeItem, ViewItemLocators } from '../../ViewItem.js'
import { PageDecorator, IPageDecorator, VSCodeLocatorMap } from '../../../utils.js'
import {
    TreeItem as TreeItemLocators,
    CustomTreeItem as CustomTreeItemLocators
} from '../../../../locators/1.73.0.js'

export interface CustomTreeItem extends IPageDecorator<ViewItemLocators> { }
/**
 * View item in a custom-made content section (e.g. an extension tree view)
 *
 * @category Sidebar
 */
@PageDecorator({ ...TreeItemLocators, ...CustomTreeItemLocators })
export class CustomTreeItem extends TreeItem {
    /**
     * @private
     */
    public locatorKey = ['TreeItem' as const, 'CustomTreeItem' as const]

    constructor (
        locators: VSCodeLocatorMap,
        element: WebdriverIO.Element,
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
