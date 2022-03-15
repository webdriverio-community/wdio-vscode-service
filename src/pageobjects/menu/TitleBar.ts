import { PluginDecorator, IPluginDecorator } from '../utils'
import { WindowControls } from "./WindowControls";
import { ContextMenu } from './ContextMenu'
import { Menu } from "./Menu";
import { MenuItem } from "./MenuItem";
import { menu } from '../../locators/1.61.0'

/**
 * Page object representing the custom VSCode title bar
 */
export interface TitleBar extends IPluginDecorator<typeof menu.TitleBar> {}
@PluginDecorator(menu.TitleBar)
export class TitleBar extends Menu {
    /**
     * Get title bar item by name
     * @param name name of the item to search by
     * @returns Promise resolving to TitleBarItem object
     */
    async getItem(name: string): Promise<TitleBarItem | undefined> {
        try {
            const titleBar = new TitleBarItem(
                this.locatorMap.menu.TitleBar,
                this.locators.itemConstructor(name),
                this
            )
            await titleBar.wait();
            return titleBar
        } catch (err) {
            return undefined;
        }
    }

    /**
     * Get all title bar items
     * @returns Promise resolving to array of TitleBarItem objects
     */
    async getItems(): Promise<TitleBarItem[]> {
        const items: TitleBarItem[] = [];
        const elements = await this.itemElement$$;

        for (const element of elements) {
            const isDisplayed = await element.isDisplayed()
            if (!isDisplayed) {
                continue
            }

            const item = new TitleBarItem(
                this.locatorMap.menu.TitleBar,
                await element.getAttribute(this.locators.itemLabel),
                this
            )
            await item.wait()
            items.push(item);
        }
        return items;
    }

    /**
     * Get the window title
     * @returns Promise resolving to the window title
     */
    async getTitle(): Promise<string> {
        return this.title$.getText();
    }

    /**
     * Get a reference to the WindowControls
     */
    getWindowControls(): WindowControls {
        return new WindowControls(this.locatorMap.menu.WindowControls, this.elem);
    }
}

/**
 * Page object representing an item of the custom VSCode title bar
 */
export interface TitleBarItem extends IPluginDecorator<typeof menu.TitleBar> {}
@PluginDecorator(menu.TitleBar)
export class TitleBarItem extends MenuItem {
    constructor(
        locators: typeof menu.TitleBar,
        public label: string,
        public parentMenu: Menu
    ) {
        super(locators, locators.itemConstructor(label));
        this.parentMenu = parentMenu;
        this.label = label;
    }

    async select(): Promise<ContextMenu> {
        const openMenus = await browser.$$(this.locatorMap.menu.ContextMenu.elem)
        if (openMenus.length > 0 && await openMenus[0].isDisplayed()) {
            await browser.keys('Escape');
        }
        await this.elem.click();

        const menu = new ContextMenu(this.locatorMap.menu.ContextMenu, this.elem)
        await menu.wait()
        return menu;
    }
}
