import { PageDecorator, IPageDecorator, VSCodeLocatorMap } from '../utils.js'
import { WindowControls, ContextMenu } from '../index.js'
import { Menu } from './Menu.js'
import { MenuItem } from './MenuItem.js'
import { TitleBar as TitleBarLocators } from '../../locators/1.73.0.js'

export interface TitleBar extends IPageDecorator<typeof TitleBarLocators> {}
/**
 * Page object representing the custom VSCode title bar
 *
 * @category Menu
 */
@PageDecorator(TitleBarLocators)
export class TitleBar extends Menu<typeof TitleBarLocators> {
    /**
     * @private
     */
    public locatorKey = 'TitleBar' as const

    /**
     * Get title bar item by name
     * @param name name of the item to search by
     * @returns Promise resolving to TitleBarItem object
     */
    async getItem (name: string): Promise<TitleBarItem | undefined> {
        try {
            const titleBar = new TitleBarItem(
                this.locatorMap,
                name,
                this
            )
            await titleBar.wait()
            return titleBar
        } catch (err) {
            return undefined
        }
    }

    /**
     * Get all title bar items
     * @returns Promise resolving to array of TitleBarItem objects
     */
    async getItems (): Promise<TitleBarItem[]> {
        const items: TitleBarItem[] = []
        const elements = await this.itemElement$$

        for (const element of elements) {
            const isDisplayed = await element.isDisplayed()
            if (!isDisplayed) {
                continue
            }

            const item = new TitleBarItem(
                this.locatorMap,
                await element.getAttribute(this.locators.itemLabel),
                this
            )
            await item.wait()
            items.push(item)
        }
        return items
    }

    /**
     * Get the window title
     * @returns Promise resolving to the window title
     */
    async getTitle (): Promise<string> {
        const title = await this.title$.getText()

        /**
         * when testing VSCode on the web the element is not
         * visible and the text will be "", therefor we need
         * to fetch the HTML
         */
        if (title.length === 0) {
            return this.title$.getHTML(false)
        }

        return title
    }

    /**
     * Get a reference to the WindowControls
     */
    getWindowControls (): WindowControls {
        return new WindowControls(this.locatorMap, this.elem)
    }
}

export interface TitleBarItem extends IPageDecorator<typeof TitleBarLocators> {}
/**
 * Page object representing an item of the custom VSCode title bar
 *
 * @category Menu
 */
@PageDecorator(TitleBarLocators)
export class TitleBarItem extends MenuItem<typeof TitleBarLocators> {
    /**
     * @private
     */
    public locatorKey = 'TitleBar' as const

    constructor (
        locators: VSCodeLocatorMap,
        public label: string,
        public parentMenu: Menu<typeof TitleBarLocators>
    ) {
        super(locators, (locators.TitleBar.itemConstructor as Function)(label) as string)
        this.parentMenu = parentMenu
        this.label = label
    }

    async select () {
        const openMenus = await browser.$$(this.locatorMap.ContextMenu.elem as string)
        if (openMenus.length > 0 && await openMenus[0].isDisplayed()) {
            await browser.keys('Escape')
        }
        await this.elem.click()

        const menu = new ContextMenu(this.locatorMap, this.elem)
        await menu.wait()
        return menu
    }
}
