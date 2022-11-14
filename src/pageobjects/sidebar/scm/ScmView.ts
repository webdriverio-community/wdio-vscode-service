import type { ChainablePromiseElement } from 'webdriverio'

import { SideBarView } from '../SideBarView'
import { ContextMenu } from '../..'
import {
    ElementWithContextMenu, VSCodeLocatorMap, PageDecorator, IPageDecorator, BasePage
} from '../../utils'
import { ScmView as ScmViewLocators } from '../../../locators/1.73.0'
import { CMD_KEY } from '../../../constants'

export interface ScmView extends IPageDecorator<typeof ScmViewLocators> { }
/**
 * Page object representing the Source Control view
 *
 * @category Sidebar
 */
@PageDecorator(ScmViewLocators)
export class ScmView extends SideBarView<typeof ScmViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ScmView' as const

    /**
     * Get SCM provider (repository) by title
     * @param title name of the repository
     * @returns promise resolving to ScmProvider object
     */
    async getProvider (title?: string): Promise<ScmProvider | undefined> {
        const providers = await this.getProviders()
        if (!title || providers.length === 1) {
            return providers[0]
        }
        const names = await Promise.all(providers.map(async (item) => item.getTitle()))
        const index = names.findIndex((name) => name === title)

        return index > -1 ? providers[index] : undefined
    }

    /**
     * Get all SCM providers
     * @returns promise resolving to ScmProvider array
     */
    async getProviders (): Promise<ScmProvider[]> {
        const headers = await this.providerHeader$$
        const sections = await Promise.all(headers.map(async (header) => header.$(this.locators.providerRelative)))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return Promise.all(sections.map((section) => new ScmProvider(this.locatorMap, section as any, this)))
    }

    /**
     * Initialize repository in the current folder if no SCM provider is found
     * @returns true if the action was completed succesfully, false if a provider already exists
     */
    async initializeRepository (): Promise<boolean> {
        const buttons = await this.initButton$$
        if (buttons.length > 0) {
            await buttons[0].click()
            return true
        }
        return false
    }
}

export interface ScmProvider extends IPageDecorator<typeof ScmViewLocators> { }
/**
 * Page object representing a repository in the source control view
 * Maps roughly to a view section of the source control view
 *
 * @category Sidebar
 */
@PageDecorator(ScmViewLocators)
export class ScmProvider extends BasePage<typeof ScmViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ScmView' as const
    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public view: ScmView
    ) {
        super(locators, element, view.elem)
    }

    /**
     * Get title of the scm provider
     */
    async getTitle (): Promise<string> {
        return this.providerTitle$.getAttribute('innerHTML')
    }

    /**
     * Get type of the scm provider (e.g. Git)
     */
    async getType (): Promise<string> {
        return this.providerType$.getAttribute('innerHTML')
    }

    /**
     * Find an action button for the SCM provider by title and click it. (e.g 'Commit')
     * @param title Title of the action button to click
     * @returns true if the given action could be performed, false if the button doesn't exist
     */
    async takeAction (title: string): Promise<boolean> {
        const header = await this.providerHeader$
        let actions: ChainablePromiseElement<WebdriverIO.Element>[] = []
        if ((await header.getAttribute('class')).indexOf('hidden') > -1) {
            actions = (await this.view.getTitlePart().getActions()).map((action) => action.elem)
        } else {
            await this.elem.moveTo()
            actions = await header.$$(this.locators.action) as any as ChainablePromiseElement<WebdriverIO.Element>[]
        }
        const names = await Promise.all(actions.map((action) => action.getAttribute('title')))
        const index = names.findIndex((item) => item === title)

        if (index > -1) {
            await actions[index].click()
            return true
        }
        return false
    }

    /**
     * Open a context menu using the 'More Actions...' button
     * @returns Promise resolving to a ContextMenu object
     */
    async openMoreActions (): Promise<ContextMenu> {
        const header = await this.providerHeader$
        if ((await header.getAttribute('class')).indexOf('hidden') > -1) {
            return new MoreAction(this.locatorMap, this.view).openContextMenu()
        }
        await this.elem.moveTo()
        return new MoreAction(this.locatorMap, this).openContextMenu()
    }

    /**
     * Fill in the message field and send ctrl/cmd + enter to commit the changes
     * @param message the commit message to use
     * @returns promise resolving once the keypresses are sent
     */
    async commitChanges (message: string): Promise<void> {
        const input = await this.inputField$
        await input.clearValue()
        await input.addValue(message)
        await input.addValue([CMD_KEY, 'Enter'])
    }

    /**
     * Get page objects for all tree items representing individual changes
     * @param staged when true, finds staged changes otherwise finds unstaged changes
     * @returns promise resolving to ScmChange object array
     */
    async getChanges (staged = false): Promise<ScmChange[]> {
        const changes = await this.getChangeCount(staged)
        const label = staged ? 'STAGED CHANGES' : 'CHANGES'

        let elements: ChainablePromiseElement<WebdriverIO.Element>[] = []
        if (changes > 0) {
            let i = -1
            elements = await this.changeItem$$ as any
            for (const [index, item] of elements.entries()) {
                const name = await item.$(this.locators.changeName)
                if (await name.getText() === label) {
                    i = index + 1
                    break
                }
            }
            if (i < 0) {
                return []
            }
            elements = elements.slice(i, i + changes)
        }
        return Promise.all(
            elements.map((element) => (
                new ScmChange(this.locatorMap, element, this).wait()
            ))
        )
    }

    /**
     * Get the number of changes for a given section
     * @param staged when true, counts the staged changes, unstaged otherwise
     * @returns promise resolving to number of changes in the given subsection
     */
    async getChangeCount (staged = false): Promise<number> {
        const rows = staged
            ? await this.stagedChanges$$
            : await this.changes$$

        if (rows.length < 1) {
            return 0
        }
        const count = await rows[0].$(this.locators.changeCount)
        return +await count.getText()
    }
}

export interface ScmChange extends IPageDecorator<typeof ScmViewLocators> { }
/**
 * Page object representing a SCM change tree item
 *
 * @category Sidebar
 */
@PageDecorator(ScmViewLocators)
export class ScmChange extends ElementWithContextMenu<typeof ScmViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ScmView' as const

    constructor (
        locators: VSCodeLocatorMap,
        row: ChainablePromiseElement<WebdriverIO.Element>,
        public provider: ScmProvider
    ) {
        super(locators, row, provider.elem)
    }

    /**
     * Get label as a string
     */
    async getLabel (): Promise<string> {
        return this.changeLabel$.getText()
    }

    /**
     * Get description as a string
     */
    async getDescription (): Promise<string> {
        const desc = await this.changeDesc$$
        if (desc.length < 1) {
            return ''
        }
        return desc[0].getText()
    }

    /**
     * Get the status string (e.g. 'Modified')
     */
    async getStatus (): Promise<string> {
        const res = await this.resource$
        const status = await res.getAttribute('data-tooltip')

        if (status && status.length > 0) {
            return status
        }
        return 'folder'
    }

    /**
     * Find if the item is expanded
     * @returns promise resolving to true if change is expanded, to false otherwise
     */
    async isExpanded (): Promise<boolean> {
        const twisties = await this.expand$$
        if (twisties.length < 1) {
            return true
        }
        return (await twisties[0].getAttribute('class')).indexOf('collapsed') < 0
    }

    /**
     * Expand or collapse a change item if possible, only works for folders in hierarchical view mode
     * @param expand true to expand the item, false to collapse
     * @returns promise resolving to true if the item changed state, to false otherwise
     */
    async toggleExpand (expand: boolean): Promise<boolean> {
        if (await this.isExpanded() !== expand) {
            await this.elem.click()
            return true
        }
        return false
    }

    /**
     * Find and click an action button available to a given change tree item
     * @param title title of the action button (e.g 'Stage Changes')
     * @returns promise resolving to true if the action was performed successfully,
     * false if the given button does not exist
     */
    async takeAction (title: string): Promise<boolean> {
        await this.elem.moveTo()
        const actions = await this.action$$
        const names = await Promise.all(actions.map((action) => action.getAttribute('title')))
        const index = names.findIndex((item) => item === title)

        if (index > -1) {
            await actions[index].click()
            return true
        }
        return false
    }
}

export interface MoreAction extends IPageDecorator<typeof ScmViewLocators> { }
/**
 * More Action
 *
 * @category Sidebar
 */
@PageDecorator(ScmViewLocators)
export class MoreAction extends ElementWithContextMenu<typeof ScmViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ScmView' as const

    constructor (
        locators: VSCodeLocatorMap,
        public scm: ScmProvider | ScmView
    ) {
        super(locators, locators.ScmView.more as string, scm.elem)
    }

    async openContextMenu (): Promise<ContextMenu> {
        await this.elem.click()
        const shadowRootHost = await this.scm.elem.$$('shadow-root-host')
        await browser.keys('Escape')

        if (shadowRootHost.length > 0) {
            if (await this.elem.getAttribute('aria-expanded') !== 'true') {
                await this.elem.click()
            }
            const shadowRoot = $(await browser.execute('return arguments[0].shadowRoot', shadowRootHost[0]))
            return new ContextMenu(this.locatorMap, shadowRoot).wait()
        }
        return super.openContextMenu()
    }
}
