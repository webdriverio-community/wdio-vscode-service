import type { ChainablePromiseElement } from 'webdriverio'

import { Menu, MenuItem } from '..'
import {
    PageDecorator, IPageDecorator, VSCodeLocatorMap, sleep
} from '../utils'
import { ContextMenu as ContextMenuLocators } from '../../locators/1.70.0'

export interface ContextMenu extends IPageDecorator<typeof ContextMenuLocators> {}
/**
 * Object representing a context menu
 *
 * @category Menu
 */
@PageDecorator(ContextMenuLocators)
export class ContextMenu extends Menu<typeof ContextMenuLocators> {
    /**
     * @private
     */
    public locatorKey = 'ContextMenu' as const

    /**
     * Get context menu item by name
     * @param name name of the item to search by
     * @returns Promise resolving to ContextMenuItem object
     */
    async getItem (name: string): Promise<MenuItem<typeof ContextMenuLocators> | undefined> {
        try {
            const items = await this.getItems()
            for (const item of items) {
                if (await item.getLabel() === name) {
                    return item
                }
            }

            return undefined
        } catch (err) {
            return undefined
        }
    }

    /**
     * Get all context menu items
     * @returns Promise resolving to array of ContextMenuItem objects
     */
    async getItems (): Promise<ContextMenuItem[]> {
        const items: ContextMenuItem[] = []
        const elements = await this.itemElement$$

        for (const element of elements) {
            const classProperty = await element.getAttribute('class')
            if (classProperty.indexOf('disabled') < 0) {
                const item = new ContextMenuItem(
                    this.locatorMap,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    element as any,
                    this
                )
                await item.wait()
                items.push(item)
            }
        }
        return items
    }

    /**
     * Close the context menu
     * @returns Promise resolving when the menu is closed
     */
    async close (): Promise<void> {
        await browser.keys('Escape')
        await this.elem.waitForDisplayed({ reverse: true })
        // Todo(Christian): maybe handle stale element exception
    }

    /**
     * Wait for the menu to appear and load all its items
     */
    async wait (timeout = 5000): Promise<this> {
        await (await this.elem).waitForDisplayed({ timeout })
        let items = (await this.getItems()).length
        await browser.waitUntil(async () => {
            const temp = (await this.getItems()).length
            if (temp === items) {
                return true
            }
            items = temp
            return false
        }, { timeout: 1000 })
        return this
    }
}

export interface ContextMenuItem extends IPageDecorator<typeof ContextMenuLocators> {}
/**
 * Object representing an item of a context menu
 *
 * @category Menu
 */
@PageDecorator(ContextMenuLocators)
export class ContextMenuItem extends MenuItem<typeof ContextMenuLocators> {
    /**
     * @private
     */
    public locatorKey = 'ContextMenu' as const
    public label = ''

    constructor (
        locators: VSCodeLocatorMap,
        base: ChainablePromiseElement<WebdriverIO.Element>,
        public parentMenu: Menu<typeof ContextMenuLocators>
    ) {
        super(locators, base, parentMenu.elem)
    }

    async select () {
        await this.elem.click()
        await sleep(500)
        if (await this.isNesting()) {
            await new ContextMenu(this.locatorMap, this.elem).wait()
        }
        return undefined
    }

    async getLabel (): Promise<string> {
        const labelItem = await this.itemLabel$
        return labelItem.getAttribute(this.locators.itemText)
    }

    private async isNesting (): Promise<boolean> {
        try {
            await this.itemNesting$.waitForDisplayed()
            return true
        } catch (err) {
            return false
        }
    }
}
