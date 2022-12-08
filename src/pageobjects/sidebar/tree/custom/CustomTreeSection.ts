import { Key } from 'webdriverio'

import { TreeSection } from '../TreeSection.js'
import { TreeItem } from '../../ViewItem.js'
import { CustomTreeItem } from './CustomTreeItem.js'
import { AllViewSectionLocators } from '../../ViewSection.js'

import { PageDecorator, IPageDecorator } from '../../../utils.js'
import {
    ViewSection as ViewSectionLocators,
    CustomTreeSection as CustomTreeSectionLocators
} from '../../../../locators/1.73.0.js'

export interface CustomTreeSection extends IPageDecorator<AllViewSectionLocators> { }
/**
 * Custom tree view, e.g. contributed by an extension
 *
 * @category Sidebar
 */
@PageDecorator({ ...ViewSectionLocators, ...CustomTreeSectionLocators })
export class CustomTreeSection extends TreeSection {
    /**
     * @private
     */
    public locatorKey = ['ViewSection' as const, 'CustomTreeSection' as const]

    async getVisibleItems (): Promise<TreeItem[]> {
        const items: TreeItem[] = []
        const elements = await this.itemRow$$
        for (const element of elements) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            items.push(await new CustomTreeItem(this.locatorMap, element as any, this).wait())
        }
        return items
    }

    async findItem (label: string, maxLevel = 0): Promise<TreeItem | undefined> {
        await this.expand()

        const container = await this.rowContainer$
        await container.waitForExist({ timeout: 5000 })
        await browser.action('key').down(Key.Home).up(Key.Home).perform()
        let item: TreeItem | undefined

        const elements = await container.$$(this.locators.itemRow)
        for (const element of elements) {
            const temp = await element.$$(this.locators.rowWithLabel(label))
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(this.locatorMap.ViewSection.level as string)
                if (maxLevel < 1 || level <= maxLevel) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    item = await new CustomTreeItem(this.locatorMap, element as any, this).wait()
                }
            }
        }
        return item
    }
}
