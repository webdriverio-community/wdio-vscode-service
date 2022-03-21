import { TreeSection } from '../TreeSection'
import { TreeItem, AllViewSectionLocators } from '../../..'
import { DefaultTreeItem } from './DefaultTreeItem'

import { PluginDecorator, IPluginDecorator } from '../../../utils'
import { DefaultTreeSection as DefaultTreeSectionLocators } from '../../../../locators/1.61.0'

export interface DefaultTreeSection extends IPluginDecorator<AllViewSectionLocators> { }
/**
 * Default view section
 *
 * @category Sidebar
 */
@PluginDecorator(DefaultTreeSectionLocators)
export class DefaultTreeSection extends TreeSection {
    /**
     * @private
     */
    public locatorKey = 'DefaultTreeSection' as const

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
        await container.addValue(['Home'])
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
                await container.addValue(['Page Down'])
            }
        } while (!item)

        return item
    }
}
