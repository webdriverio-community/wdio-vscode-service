import type { ChainablePromiseElement } from 'webdriverio';

import { PluginDecorator, IPluginDecorator, BasePage, LocatorMap } from '../utils'
import { TitleBar } from "../..";
import { WindowControls as WindowControlsLocators } from '../../locators/1.61.0'

export interface WindowControls extends IPluginDecorator<typeof WindowControlsLocators> {}
/**
 * Page object for the windows controls part of the title bar
 *
 * @category Menu
 */
@PluginDecorator(WindowControlsLocators)
export class WindowControls extends BasePage<typeof WindowControlsLocators> {
    /**
     * @private
     */
    public locatorKey = 'WindowControls' as const

    constructor(
        locators: LocatorMap,
        element?: ChainablePromiseElement<WebdriverIO.Element> | string,
        public bar: TitleBar = new TitleBar(locators)
    ) {
        super(locators, element);
        this.setParentElement(this.bar.elem)
    }

    /**
     * Use the minimize window button
     * @returns Promise resolving when minimize button is pressed
     */
    async minimize(): Promise<void> {
        await this.minimize$.click();
    }

    /**
     * Use the maximize window button if the window is not maximized
     * @returns Promise resolving when maximize button is pressed
     */
    async maximize(): Promise<void> {
        try {
            await this.maximize$.click();
        } catch (err) {
            console.log('Window is already maximized');
        }
    }

    /**
     * Use the restore window button if the window is maximized
     * @returns Promise resolving when restore button is pressed
     */
    async restore(): Promise<void> {
        try {
            await this.restore$.click();
        } catch (err) {
            console.log('Window is not maximized');
        }
    }

    /**
     * Use the window close button. Use at your own risk.
     * @returns Promise resolving when close button is pressed
     */
    async close(): Promise<void> {
        await this.close$.click();
    }
}