import type { ChainablePromiseElement } from 'webdriverio'

import { ViewItem, ViewItemLocators } from '../ViewItem'
import { ContextMenu } from '../../menu/ContextMenu'
import { ExtensionsViewSection } from './ExtensionsViewSection'

import { PageDecorator, IPageDecorator, VSCodeLocatorMap } from '../../utils'
import {
    TreeItem as TreeItemLocators,
    ExtensionsViewItem as ExtensionsViewItemLocators
} from '../../../locators/1.70.0'

export interface ExtensionsViewItem extends IPageDecorator<ViewItemLocators> { }
/**
 * Page object representing an extension in the extensions view
 *
 * @category Sidebar
 */
@PageDecorator({ ...TreeItemLocators, ...ExtensionsViewItemLocators })
export class ExtensionsViewItem extends ViewItem {
    /**
     * @private
     */
    public locatorKey = ['TreeItem' as const, 'ExtensionsViewItem' as const]

    constructor (
        locators: VSCodeLocatorMap,
        extensionElement: ChainablePromiseElement<WebdriverIO.Element>,
        public section: ExtensionsViewSection
    ) {
        super(locators, extensionElement, section.elem)
    }

    /**
     * Get title of the extension
     */
    async getTitle (): Promise<string> {
        return this.itemTitle$.getText()
    }

    /**
     * Get version of the extension
     * @returns Promise resolving to version string
     */
    async getVersion (): Promise<string> {
        const version = await this.version$$
        if (version.length > 0) {
            return version[0].getText()
        }
        const label = await this.elem.getAttribute('aria-label')
        const ver = label.split(',')[1].trim()

        return ver
    }

    /**
     * Get the author of the extension
     * @returns Promise resolving to displayed author
     */
    async getAuthor (): Promise<string> {
        const author = await this.author$
        return author.getText()
    }

    /**
     * Get the description of the extension
     * @returns Promise resolving to description
     */
    async getDescription (): Promise<string> {
        return this.description$.getText()
    }

    /**
     * Find if the extension is installed
     * @returns Promise resolving to true/false
     */
    async isInstalled (): Promise<boolean> {
        if ((await this.install$.getAttribute('class')).indexOf('disabled') > -1) {
            return true
        }
        return false
    }

    /**
     * Open the management context menu if the extension is installed
     * @returns Promise resolving to ContextMenu object
     */
    async manage (): Promise<ContextMenu> {
        if ((await this.manage$.getAttribute('class')).indexOf('disabled') > -1) {
            throw new Error(`Extension '${await this.getTitle()}' is not installed`)
        }
        return this.openContextMenu()
    }

    /**
     * Install the extension if not installed already.
     *
     * Will wait for the extension to finish installing. To skip the wait, set timeout to 0.
     *
     * @param timeout timeout to wait for the installation in milliseconds, default unlimited, set to 0 to skip waiting
     * @returns Promise resolving when the installation finishes or is skipped
     */
    async install (timeout = 300000): Promise<void> {
        if (await this.isInstalled()) {
            return
        }
        const button = await this.install$
        await button.click()

        if (timeout > 0) {
            await this.manage$.waitForDisplayed({ timeout })
        }
    }
}
