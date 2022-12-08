import { Key } from 'webdriverio'

import { TreeSection } from '../TreeSection.js'
import { TreeItem, AllViewSectionLocators } from '../../../index.js'
import { DefaultTreeItem } from './DefaultTreeItem.js'

import { PageDecorator, IPageDecorator } from '../../../utils.js'
import {
    ViewSection as ViewSectionLocators,
    DefaultTreeSection as DefaultTreeSectionLocators
} from '../../../../locators/1.73.0.js'

export interface DefaultTreeSection extends IPageDecorator<AllViewSectionLocators> { }
/**
 * Default view section
 *
 * @category Sidebar
 */
@PageDecorator({ ...ViewSectionLocators, ...DefaultTreeSectionLocators })
export class DefaultTreeSection extends TreeSection {
    /**
     * @private
     */
    public locatorKey = ['ViewSection' as const, 'DefaultTreeSection' as const]

    async getVisibleItems (): Promise<TreeItem[]> {
        const items: TreeItem[] = []
        const elements = await this.itemRow$$
        for (const element of elements) {
            items.push(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                await new DefaultTreeItem(this.locatorMap, element as any, this).wait()
            )
        }
        return items
    }

    async findItem (label: string, maxLevel = 0): Promise<TreeItem | undefined> {
        await this.expand()
        const container = await this.rowContainer$
        await browser.action('key').down(Key.Home).up(Key.Home).perform()
        let item: TreeItem | undefined
        do {
            const temp = await container.$$((this.locatorMap.DefaultTreeItem.ctor as Function)(label) as string)
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(this.locators.level)
                if (maxLevel < 1 || level <= maxLevel) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    item = await new DefaultTreeItem(this.locatorMap, temp[0] as any, this).wait()
                }
            }
            if (!item) {
                const lastrow = await container.$$(this.locators.lastRow)
                if (lastrow.length > 0) {
                    break
                }
                await browser.action('key').down(Key.PageDown).up(Key.PageDown).perform()
            }
        } while (!item)

        return item
    }
}
