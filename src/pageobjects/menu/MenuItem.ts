import { BasePage } from '../utils'
import type { Menu } from "./Menu";

/**
 * Abstract element representing a menu item
 */
export abstract class MenuItem extends BasePage {
    abstract parentMenu: Menu;
    abstract label: string;

    /**
     * Use the given menu item: Opens the submenu if the item has children,
     * otherwise simply click the item.
     * 
     * @returns Menu object representing the submenu if the item has children, void otherwise.
     */
    async select(): Promise<Menu | undefined> {
        await this.elem.click();
        return undefined;
    }

    /**
     * Return the Menu object representing the menu this item belongs to
     */
    getParent(): Menu {
        return this.parentMenu;
    }

    /**
     * Returns the label of the menu item
     */
    getLabel(): string | Promise<string> {
        return this.label;
    }
}