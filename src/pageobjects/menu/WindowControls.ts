import type { ChainablePromiseElement } from 'webdriverio'

import logger from '@wdio/logger'
import {
    PageDecorator, IPageDecorator, BasePage, VSCodeLocatorMap
} from '../utils.js'
import { TitleBar } from '../../index.js'
import { WindowControls as WindowControlsLocators } from '../../locators/1.73.0.js'

const log = logger('wdio-vscode-service')

export interface WindowControls extends IPageDecorator<typeof WindowControlsLocators> {}
/**
 * Page object for the windows controls part of the title bar
 *
 * @category Menu
 */
@PageDecorator(WindowControlsLocators)
export class WindowControls extends BasePage<typeof WindowControlsLocators> {
    /**
     * @private
     */
    public locatorKey = 'WindowControls' as const

    constructor (
        locators: VSCodeLocatorMap,
        element?: WebdriverIO.Element | string,
        public bar: TitleBar = new TitleBar(locators)
    ) {
        super(locators, element)
        this.setParentElement(this.bar.elem)
    }

    /**
     * Use the minimize window button
     * @returns Promise resolving when minimize button is pressed
     */
    async minimize (): Promise<void> {
        await this.minimize$.click()
    }

    /**
     * Use the maximize window button if the window is not maximized
     * @returns Promise resolving when maximize button is pressed
     */
    async maximize (): Promise<void> {
        try {
            await this.maximize$.click()
        } catch (err) {
            log.error('Window is already maximized', err)
        }
    }

    /**
     * Use the restore window button if the window is maximized
     * @returns Promise resolving when restore button is pressed
     */
    async restore (): Promise<void> {
        try {
            await this.restore$.click()
        } catch (err) {
            log.error('Window is not maximized', err)
        }
    }

    /**
     * Use the window close button. Use at your own risk.
     * @returns Promise resolving when close button is pressed
     */
    async close (): Promise<void> {
        await this.close$.click()
    }
}
