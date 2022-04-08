import {
    ElementWithContextMenu, PluginDecorator, IPluginDecorator, BasePage, VSCodeLocatorMap
} from '../utils'
import { SideBarView } from '..'
import { ViewTitlePart as ViewTitlePartLocators } from '../../locators/1.61.0'

export interface ViewTitlePart extends IPluginDecorator<typeof ViewTitlePartLocators> { }
/**
 * Page object representing the top (title) part of a side bar view
 *
 * @category Sidebar
 */
@PluginDecorator(ViewTitlePartLocators)
export class ViewTitlePart extends ElementWithContextMenu<typeof ViewTitlePartLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewTitlePart' as const

    constructor (
        locators: VSCodeLocatorMap,
        driver: WebdriverIO.Browser,
        public view: SideBarView<any> = new SideBarView(locators, driver)
    ) {
        super(locators, driver)
    }

    /**
     * Returns the displayed title of the view
     * @returns Promise resolving to displayed title
     */
    async getTitle (): Promise<string> {
        return this.title$.getText()
    }

    /**
     * Finds action buttons inside the view title part
     * @returns Promise resolving to array of TitleActionButton objects
     */
    async getActions (): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = []
        const elements = await this.action$$
        for (const element of elements) {
            const title = await element.getAttribute(this.locators.actionLabel)
            actions.push(await this.load(TitleActionButton, title, this).wait())
        }
        return actions
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     * @returns Promise resolving to TitleActionButton object
     */
    async getAction (title: string): Promise<TitleActionButton> {
        return this.load(TitleActionButton, title, this).wait()
    }
}

export interface ViewTitlePart extends IPluginDecorator<typeof ViewTitlePartLocators> { }
/**
 * Page object representing a button inside the view title part
 *
 * @category Sidebar
 */
@PluginDecorator(ViewTitlePartLocators)
export class TitleActionButton extends BasePage<typeof ViewTitlePartLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewTitlePart' as const

    constructor (
        locators: VSCodeLocatorMap,
        driver: WebdriverIO.Browser,
        private title: string,
        viewTitle: ViewTitlePart
    ) {
        super(
            locators,
            driver,
            (locators.ViewTitlePart.actionContstructor as Function)(title) as string,
            viewTitle.elem
        )
        this.title = title
    }

    /**
     * Get title of the button
     */
    getTitle (): string {
        return this.title
    }
}
