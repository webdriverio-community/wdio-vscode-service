import { TreeSection } from '../TreeSection'
import { TreeItem } from '../../ViewItem'
import { CustomTreeItem } from './CustomTreeItem'
import { AllViewSectionLocators } from '../../ViewSection'

import { PageDecorator, IPageDecorator } from '../../../utils'
import {
    ViewSection as ViewSectionLocators,
    CustomTreeSection as CustomTreeSectionLocators
} from '../../../../locators/1.73.0'

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

        await container.addValue(['Home'])
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
