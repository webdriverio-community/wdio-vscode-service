import type { ChainablePromiseElement } from 'webdriverio'
import {
    ElementWithContextMenu, PageDecorator, IPageDecorator, BasePage, VSCodeLocatorMap
} from '../utils'
import { SideBarView } from '..'
import { ViewTitlePart as ViewTitlePartLocators } from '../../locators/1.73.0'

export interface ViewTitlePart extends IPageDecorator<typeof ViewTitlePartLocators> { }
/**
 * Page object representing the top (title) part of a side bar view
 *
 * @category Sidebar
 */
@PageDecorator(ViewTitlePartLocators)
export class ViewTitlePart extends ElementWithContextMenu<typeof ViewTitlePartLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewTitlePart' as const

    constructor (
        locators: VSCodeLocatorMap,
        public view: SideBarView<any> = new SideBarView(locators)
    ) {
        super(locators)
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
            const link = element.$(this.locators.actionContstructor(title))
            actions.push(await new TitleActionButton(this.locatorMap, link, title, this).wait())
        }
        return actions
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     * @returns Promise resolving to TitleActionButton object
     */
    async getAction (title: string): Promise<TitleActionButton> {
        const link = this.elem.$(this.locators.actionContstructor(title))
        return new TitleActionButton(this.locatorMap, link, title, this).wait()
    }
}

export interface ViewTitlePart extends IPageDecorator<typeof ViewTitlePartLocators> { }
/**
 * Page object representing a button inside the view title part
 *
 * @category Sidebar
 */
@PageDecorator(ViewTitlePartLocators)
export class TitleActionButton extends BasePage<typeof ViewTitlePartLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewTitlePart' as const

    constructor (
        locators: VSCodeLocatorMap,
        elem: ChainablePromiseElement<WebdriverIO.Element>,
        private title: string,
        viewTitle: ViewTitlePart
    ) {
        super(locators, elem, viewTitle.elem)
        this.title = title
    }

    /**
     * Get title of the button
     */
    getTitle (): string {
        return this.title
    }
}
