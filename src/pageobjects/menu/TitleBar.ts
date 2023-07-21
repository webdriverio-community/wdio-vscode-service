import {
    PageDecorator, IPageDecorator, VSCodeLocatorMap, sleep
} from '../utils.js'
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
        const all = await this.getItems()
        for (const item of all) {
            if (item.label === name) {
                return item
            }
        }
        return undefined
    }

    /**
     * Get all title bar items
     * @returns Promise resolving to array of TitleBarItem objects
     */
    async getItems (): Promise<TitleBarItem[]> {
        // can't search in this. because in web version the overflow menu is in activity bar
        const menubar = await browser.$(this.locators.menubar)
        if (!(await menubar.isExisting())) {
            throw new Error(
                'Menubar not found in TitleBar, this probably means you are using "native" Title Bar Style. '
                + 'Title Items can only be found when using "custom" style.'
            )
        }

        const items: TitleBarItem[] = []
        for (const element of await menubar.$$(this.locators.itemElement)) {
            const isDisplayed = await element.isDisplayed()
            if (!isDisplayed) {
                continue
            }
            const label = await element.getAttribute(this.locators.itemLabel)
            if (
                label === 'More' // electron
                || label === 'Application Menu' // web
            ) {
                await element.click()
                const overflow = await new ContextMenu(this.locatorMap).wait()
                for (const overflowItem of await overflow.getItems()) {
                    const item = new TitleBarItem(
                        this.locatorMap,
                        (this.locators.overflowItemConstructor as Function),
                        async (self) => {
                            await element.click() // make sure the overflow menu is open
                            await self.elem.click()
                        },
                        await overflowItem.getLabel(),
                        this
                    )
                    await item.wait()
                    items.push(item)
                }
                await browser.keys('Escape')
            } else {
                const item = new TitleBarItem(
                    this.locatorMap,
                    (this.locators.topLevelItemConstructor as Function),
                    async (self) => {
                        await self.elem.click()
                    },
                    label,
                    this
                )
                await item.wait()
                items.push(item)
            }
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
        ctor: Function,
        private openMenu: (self: TitleBarItem) => Promise<void>,
        public label: string,
        public parentMenu: Menu<typeof TitleBarLocators>
    ) {
        super(locators, ctor(label) as string)
    }

    async select () {
        const openMenus = await browser.$$(this.locatorMap.ContextMenu.elem as string)
        if (openMenus.length > 0 && await openMenus[0].isDisplayed()) {
            await browser.keys('Escape')
        }
        await this.openMenu(this)
        await sleep(500)

        const menu = new ContextMenu(this.locatorMap, this.elem)
        await menu.wait()
        return menu
    }
}
