import type { ChainablePromiseElement } from 'webdriverio'

import {
    ContextMenu, ViewContent, ViewItem, WelcomeContentSection
} from '../index.js'
import {
    PageDecorator, IPageDecorator, BasePage, ElementWithContextMenu, VSCodeLocatorMap
} from '../utils.js'
import {
    ViewSection as ViewSectionLocators,
    ExtensionsViewSection as ExtensionsViewSectionLocators,
    CustomTreeSection as CustomTreeSectionLocators,
    DefaultTreeSection as DefaultTreeSectionLocators
} from '../../locators/1.73.0.js'

/**
 * @hidden
 */
export type AllViewSectionLocators = (
    typeof ViewSectionLocators &
    typeof ExtensionsViewSectionLocators &
    typeof CustomTreeSectionLocators &
    typeof DefaultTreeSectionLocators
)

export interface ViewSection extends IPageDecorator<AllViewSectionLocators> { }
/**
 * Page object representing a collapsible content section of the side bar view
 *
 * @category Sidebar
 */
export abstract class ViewSection extends BasePage<AllViewSectionLocators> {
    constructor (
        locators: VSCodeLocatorMap,
        panel: WebdriverIO.Element,
        public content: ViewContent
    ) {
        super(locators, panel)
    }

    /**
     * Get the title of the section as string
     * @returns Promise resolving to section title
     */
    async getTitle (): Promise<string> {
        return this.title$.getAttribute(this.locators.titleText)
    }

    /**
     * Expand the section if collapsed
     * @returns Promise resolving when the section is expanded
     */
    async expand (): Promise<void> {
        if (await this.isHeaderHidden()) {
            return
        }
        if (!await this.isExpanded()) {
            const panel = await this.header$
            await panel.click()
            await browser.waitUntil(async () => (
                await panel.getAttribute(this.locators.headerExpanded) === 'true'
            ), { timeout: 1000 })
        }
    }

    /**
     * Collapse the section if expanded
     * @returns Promise resolving when the section is collapsed
     */
    async collapse (): Promise<void> {
        if (await this.isHeaderHidden()) {
            return
        }
        if (await this.isExpanded()) {
            const panel = await this.header$
            await panel.click()
            await browser.waitUntil(async () => (
                await panel.getAttribute(this.locators.headerExpanded) === 'false'
            ), { timeout: 1000 })
        }
    }

    /**
     * Finds whether the section is expanded
     * @returns Promise resolving to true/false
     */
    async isExpanded (): Promise<boolean> {
        const expanded = await this.header$.getAttribute(this.locators.headerExpanded)
        return expanded === 'true'
    }

    /**
     * Finds [Welcome Content](https://code.visualstudio.com/api/extension-guides/tree-view#welcome-content)
     * present in this ViewSection and returns it. If none is found, then `undefined` is returned
     *
     */
    public async findWelcomeContent (): Promise<WelcomeContentSection | undefined> {
        try {
            const res = await this.welcomeContent$
            if (!await res.isDisplayed()) {
                return undefined
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new WelcomeContentSection(this.locatorMap, res as any, this)
        } catch (_err) {
            return undefined
        }
    }

    /**
     * Retrieve all items currently visible in the view section.
     * Note that any item currently beyond the visible list, i.e. not scrolled to, will not be retrieved.
     * @returns Promise resolving to array of ViewItem objects
     */
    abstract getVisibleItems (): Promise<ViewItem[]>

    /**
     * Find an item in this view section by label. Does not perform recursive search through the whole tree.
     * Does however scroll through all the expanded content. Will find items beyond the current scroll range.
     * @param label Label of the item to search for.
     * @param maxLevel Limit how deep the algorithm should look into any expanded items, default unlimited (0)
     * @returns Promise resolving to ViewItem object is such item exists, undefined otherwise
     */
    abstract findItem (label: string, maxLevel?: number): Promise<ViewItem | undefined>

    /**
     * Open an item with a given path represented by a sequence of labels
     *
     * e.g to open 'file' inside 'folder', call
     * openItem('folder', 'file')
     *
     * The first item is only searched for directly within the root element (depth 1).
     * The label sequence is handled in order. If a leaf item (a file for example) is found in the middle
     * of the sequence, the rest is ignored.
     *
     * If the item structure is flat, use the item's title to search by.
     *
     * @param path Sequence of labels that make up the path to a given item.
     * @returns Promise resolving to array of ViewItem objects representing the last item's children.
     * If the last item is a leaf, empty array is returned.
     */
    abstract openItem (...path: string[]): Promise<ViewItem[]>

    /**
     * Retrieve the action buttons on the section's header
     * @returns Promise resolving to array of ViewPanelAction objects
     */
    async getActions (): Promise<ViewPanelAction[]> {
        const actions: ViewPanelAction[] = []

        if (!await this.isHeaderHidden()) {
            const elements = await this
                .header$
                .$(this.locators.actions)
                .$$(this.locators.button)

            for (const element of elements) {
                actions.push(
                    await new ViewPanelAction(
                        this.locatorMap,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        element as any,
                        this
                    ).wait()
                )
            }
        }
        return actions
    }

    /**
     * Retrieve an action button on the sections's header by its label
     * @param label label/title of the button
     * @returns ViewPanelAction object if found, undefined otherwise
     */
    async getAction (label: string): Promise<ViewPanelAction | undefined> {
        const actions = await this.getActions()
        for (const action of actions) {
            if (await action.getLabel() === label) {
                return action
            }
        }
        return undefined
    }

    /**
     * Click on the More Actions... item if it exists
     *
     * @returns ContextMenu page object if the action succeeds, undefined otherwise
     */
    async moreActions (): Promise<ContextMenu | undefined> {
        const more = await this.getAction('More Actions...')
        if (!more) {
            return undefined
        }
        const section = this
        const self = this
        const btn = new class extends ElementWithContextMenu<typeof ViewSectionLocators> {
            locatorKey = 'ViewSection' as const

            async openContextMenu () {
                await this.elem.click()
                const shadowRootHost = await section.elem.$$('.shadow-root-host')
                if (shadowRootHost.length > 0) {
                    const shadowRoot = $(await browser.execute('return arguments[0].shadowRoot', shadowRootHost[0]))
                    return new ContextMenu(self.locatorMap, shadowRoot).wait()
                }
                return super.openContextMenu()
            }
        }(this.locatorMap, more.elem, this.elem)
        return btn.openContextMenu()
    }

    private async isHeaderHidden (): Promise<boolean> {
        return (await this.header$.getAttribute('class')).indexOf('hidden') > -1
    }
}

export interface ViewPanelAction extends IPageDecorator<typeof ViewSectionLocators> { }
/**
 * Action button on the header of a view section
 *
 * @category Sidebar
 */
@PageDecorator(ViewSectionLocators)
export class ViewPanelAction extends BasePage<typeof ViewSectionLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewSection' as const

    constructor (
        locators: VSCodeLocatorMap,
        element: WebdriverIO.Element,
        viewPart: ViewSection
    ) {
        super(locators, element, viewPart.elem)
    }

    /**
     * Get label of the action button
     */
    async getLabel (): Promise<string> {
        return this.elem.getAttribute(this.locators.buttonLabel)
    }

    async wait (timeout = 1000): Promise<this> {
        await this.elem.waitForEnabled({ timeout })
        return this
    }
}
