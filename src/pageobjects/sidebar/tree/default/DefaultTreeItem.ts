import { ChainablePromiseElement } from 'webdriverio'

import { TreeItem, ViewItemLocators } from '../../ViewItem'
import { TreeSection } from '../TreeSection'
import { PageDecorator, IPageDecorator, VSCodeLocatorMap } from '../../../utils'
import {
    TreeItem as TreeItemLocators,
    DefaultTreeItem as DefaultTreeItemLocators
} from '../../../../locators/1.70.0'

export interface DefaultTreeItem extends IPageDecorator<ViewItemLocators> { }
/**
 * Default tree item base on the items in explorer view
 *
 * @category Sidebar
 */
@PageDecorator({ ...TreeItemLocators, ...DefaultTreeItemLocators })
export class DefaultTreeItem extends TreeItem {
    /**
     * @private
     */
    public locatorKey = ['TreeItem' as const, 'DefaultTreeItem' as const]

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public viewPart: TreeSection
    ) {
        super(locators, element, viewPart.elem)
    }

    getDescription () {
        return Promise.resolve(undefined)
    }

    async getLabel (): Promise<string> {
        return this.elem.getAttribute(this.locatorMap.DefaultTreeSection.itemLabel as string)
    }

    async getTooltip (): Promise<string> {
        return this.tooltip$.getAttribute('title')
    }

    async isExpanded (): Promise<boolean> {
        const twistieClass = await this.twistie$.getAttribute('class')
        return twistieClass.indexOf('collapsed') < 0
    }

    async getChildren (): Promise<TreeItem[]> {
        const rows = await this.getChildItems(this.locatorMap.DefaultTreeSection.itemRow as string)
        const items = await Promise.all(
            rows.map(async (row) => (
                new DefaultTreeItem(
                    this.locatorMap,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    row as any,
                    this.viewPart
                ).wait()
            ))
        )
        return items
    }

    async isExpandable (): Promise<boolean> {
        const twistieClass = await this.twistie$.getAttribute('class')
        return twistieClass.indexOf('collapsible') > -1
    }
}
