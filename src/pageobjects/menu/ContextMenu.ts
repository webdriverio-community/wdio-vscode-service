import { PluginDecorator, IPluginDecorator } from '../utils'

import { Menu } from "./Menu";
import { MenuItem } from './MenuItem'
import { menu } from '../../locators/1.61.0'
import { ChainablePromiseElement } from 'webdriverio';


/**
 * Object representing a context menu
 */
export interface ContextMenu extends IPluginDecorator<typeof menu.ContextMenu> {}
@PluginDecorator(menu.ContextMenu)
export class ContextMenu extends Menu {
    /**
     * Get context menu item by name
     * @param name name of the item to search by
     * @returns Promise resolving to ContextMenuItem object
     */
    async getItem(name: string): Promise<ContextMenuItem | undefined> {
        try {
            const items = await this.getItems();
            for (const item of items) {
                if (await item.getLabel() === name) {
                    return item;
                }
            }

            return undefined
        } catch (err) {
            return undefined;
        }
    }

    /**
     * Get all context menu items
     * @returns Promise resolving to array of ContextMenuItem objects
     */
    async getItems(): Promise<ContextMenuItem[]> {
        const items: ContextMenuItem[] = [];
        const elements = await this.itemElement$$

        for (const element of elements) {
            const classProperty = await element.getAttribute('class');
            if (classProperty.indexOf('disabled') < 0) {
                const item = new ContextMenuItem(
                    this.locatorMap.menu.ContextMenu,
                    element as any,
                    this
                )
                await item.wait()
                items.push(item);
            }
        }
        return items;
    }

    /**
     * Close the context menu
     * @returns Promise resolving when the menu is closed
     */
    async close(): Promise<void> {
        await browser.keys('Escape');
        await this.elem.waitForDisplayed({ reverse: true })
        // Todo(Christian): maybe handle stale element exception
    }

    /**
     * Wait for the menu to appear and load all its items
     */
    async wait(timeout: number = 5000): Promise<this> {
        await (await this.elem).waitForDisplayed({ timeout })
        let items = (await this.getItems()).length;
        await browser.waitUntil(async () => {
            const temp = (await this.getItems()).length;
            if (temp === items) {
                return true;
            } else {
                items = temp;
                return false;
            }
        }, { timeout: 1000 });
        return this;
    }
}

/**
 * Object representing an item of a context menu
 */
export interface ContextMenuItem extends IPluginDecorator<typeof menu.ContextMenu> {}
@PluginDecorator(menu.ContextMenu)
export class ContextMenuItem extends MenuItem {
    public label = ''

    constructor(
        locators: typeof menu.ContextMenu,
        base: ChainablePromiseElement<WebdriverIO.Element>,
        public parentMenu: Menu
    ) {
        super(locators, base, parentMenu.elem);
    }

    async select(): Promise<Menu | undefined> {
        await this.elem.click();
        await new Promise(res => setTimeout(res, 500));
        if (await this.isNesting()) {
            await new ContextMenu(this.locators, this.elem).wait();
        }
        return undefined;
    }

    async getLabel(): Promise<string> {
        const labelItem = await this.itemLabel$;
        return labelItem.getAttribute(this.locators.itemText as string);
    }

    private async isNesting(): Promise<boolean> {
        try {
            await this.itemNesting$.waitForDisplayed()
            return true
        } catch (err) {
            return false;
        }
    }
}