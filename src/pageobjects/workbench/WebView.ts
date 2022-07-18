import { ChainablePromiseElement } from 'webdriverio'
import { BasePage, PageDecorator, IPageDecorator } from '../utils'
import { WebView as WebViewLocators } from '../../locators/1.66.0'
import type { VSCodeLocatorMap } from '../utils'

export interface WebView extends IPageDecorator<typeof WebViewLocators> { }
// @ts-expect-error `PageDecorator` doesn't allow static methods
@PageDecorator(WebViewLocators)
export class WebView extends BasePage<typeof WebViewLocators> {
    /**
     * @private locator key to identify locator map (see locators.ts)
     */
    public locatorKey = 'WebView' as const

    get activeFrame () {
        return $(this._locators.WebView.activeFrame as string)
    }

    /**
     * Switch WebDriver context to given webview so subsequent element
     * calls are targeting elements within the webview.
     *
     * __Note:__ ensure to call `webview.close()` to leave the webview
     * context before using other page objects.
     */
    public async open () {
        await browser.switchToFrame(this.elem)
        await this.activeFrame.waitForExist()
        await browser.switchToFrame(this.activeFrame)
    }

    /**
     * Switch from the webview context back to the VSCode context.
     */
    public async close () {
        await browser.switchToFrame(null)
        await browser.switchToFrame(null)
    }

    /**
     * Get all available WebViews (including the once in the sidebar or from the editor)
     * @param locators locator map
     * @returns a list of webview objects
     */
    static async getAllWebViews (locators: VSCodeLocatorMap) {
        const frames = await browser.$$(locators.WebView.outerFrame as string)
        return frames.map((f) => (
            new WebView(locators, f as any as ChainablePromiseElement<WebdriverIO.Element>)
        ))
    }
}
