import { BasePage } from '../utils.js'
import type { Menu } from './Menu'

/**
 * Abstract element representing a menu item
 *
 * @category Menu
 */
export abstract class MenuItem<T> extends BasePage<T> {
    abstract parentMenu: Menu<T>
    abstract label: string

    /**
     * Use the given menu item: Opens the submenu if the item has children,
     * otherwise simply click the item.
     *
     * @returns Menu object representing the submenu if the item has children, void otherwise.
     */
    async select (): Promise<Menu<any> | undefined> {
        await this.elem.click()
        return undefined
    }

    /**
     * Return the Menu object representing the menu this item belongs to
     * Todo: fix this
     */
    getParent (): Menu<T> {
        return this.parentMenu
    }

    /**
     * Returns the label of the menu item
     */
    getLabel (): string | Promise<string> {
        return this.label
    }
}
