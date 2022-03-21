import { ChainablePromiseElement } from 'webdriverio';
import { BasePage, PluginDecorator, IPluginDecorator } from '../utils'
import { DebugToolbar as DebugToolbarLocators } from '../../locators/1.61.0'

export interface DebugToolbar extends IPluginDecorator<typeof DebugToolbarLocators> {}
/**
 * Page object for the Debugger Toolbar
 *
 * @category Workbench
 */
@PluginDecorator(DebugToolbarLocators)
export class DebugToolbar extends BasePage<typeof DebugToolbarLocators> {
    /**
     * @private
     */
    public locatorKey = 'DebugToolbar' as const

    /**
     * Wait for the execution to pause at the next breakpoint
     */
    async waitForBreakPoint(): Promise<void> {
        await browser.waitUntil(async () => {
            const btn = await this.button$('continue');
            return btn.isEnabled();
        });
    }

    /**
     * Click Continue
     */
    async continue(): Promise<void> {
        await this.getButton('continue').click();
    }

    /**
     * Click Pause
     */
    async pause(): Promise<void> {
        await this.getButton('pause').click();
    }

    /**
     * Click Step Over
     */
    async stepOver(): Promise<void> {
        await this.getButton('step-oer').click();
    }

    /**
     * Click Step Into
     */
    async stepInto(): Promise<void> {
        await this.getButton('step-ito').click();
    }

    /**
     * Click Step Out
     */
    async stepOut(): Promise<void> {
        await this.getButton('step-ot').click();
    }

    /**
     * Click Restart
     */
    async restart(): Promise<void> {
        await this.getButton('restart').click();
    }

    /**
     * Click Stop
     */
    async stop(): Promise<void> {
        await this.getButton('stop').click();
    }

    private getButton(name: string): ChainablePromiseElement<WebdriverIO.Element> {
        return this.button$(name);
    }
}