import { Editor, EditorLocators } from "./Editor";
import { PluginDecorator, IPluginDecorator } from "../utils";
import { WebView as WebViewLocators } from '../../locators/1.61.0'

let handle: string | undefined;

/**
 * Page object representing an open editor containing a web view
 */
export interface WebView extends IPluginDecorator<EditorLocators> {}
@PluginDecorator(WebViewLocators)
export class WebView extends Editor<EditorLocators> {
    public locatorKey = 'WebView' as const

    /**
     * Search for an element inside the webview iframe.
     * Requires webdriver being switched to the webview iframe first.
     * (Will attempt to search from the main DOM root otherwise)
     * 
     * @param locator webdriver locator to search by
     * @returns promise resolving to WebElement when found
     */
    async findWebElement(locator: string) {
        return this.elem.$(locator);
    }

    /**
     * Search for all element inside the webview iframe by a given locator
     * Requires webdriver being switched to the webview iframe first.
     * (Will attempt to search from the main DOM root otherwise)
     * 
     * @param locator webdriver locator to search by
     * @returns promise resolving to a list of WebElement objects
     */
    async findWebElements(locator: string) {
        return this.elem.$$(locator);
    }

    /**
     * Switch the underlying webdriver context to the webview iframe.
     * This allows using the findWebElement methods.
     * Note that only elements inside the webview iframe will be accessible.
     * Use the switchBack method to switch to the original context.
     */
    async switchToFrame(): Promise<void> {
        if (!handle) {
            handle = await browser.getWindowHandle();
        }

        const handles = await browser.getWindowHandles();
        for (const handle of handles) {
            await browser.switchToWindow(handle)

            if ((await browser.getTitle()).includes('Virtual Document')) {
                await browser.switchToFrame(0);
                return;
            }
        }
        await browser.switchToWindow(handle);

        const reference = await this.elem.$(this.locatorMap.EditorView.webView as string);
        const flowToAttr = await reference.getAttribute('aria-flowto')
        const container = await browser.$(`#${flowToAttr}`)
        await container.waitForExist({ timeout: 5000 })
        
        let tries: WebdriverIO.Element[] = []
        await browser.waitUntil(async () => {
            const tries = await container.$$(this.locators.iframe);
            if (tries.length > 0) {
                return true;
            }
            return false;
        }, { timeout: 5000 });
        const view = tries[0]!
        await browser.switchToFrame(view);

        const frame = await this.activeFrame$;
        await frame.waitForExist({ timeout: 5000 });
        await browser.switchToFrame(frame);
    }

    /**
     * Switch the underlying webdriver back to the original window
     */
    async switchBack(): Promise<void> {
        if (!handle) {
            handle = await browser.getWindowHandle();
        }
        return browser.switchToWindow(handle);
    }
}