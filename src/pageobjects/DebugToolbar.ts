import { workbench } from 'locators/1.61.0'
import { ChainablePromiseElement } from 'webdriverio';
import { BasePage, PluginDecorator, IPluginDecorator } from './utils'

/**
 * Page object for the Debugger Toolbar
 */
export interface DebugToolbar extends IPluginDecorator<typeof workbench.DebugToolbar> {}
@PluginDecorator(workbench.DebugToolbar)
export class DebugToolbar extends BasePage {
    /**
     * Wait for the debug toolbar to appear and instantiate it.
     * Assumes that debug session is already starting and it is just
     * a matter of waiting for the toolbar to appear.
     * 
     * @param timeout max time to wait in milliseconds, default 5000
     */
    // static async create(timeout = 5000): Promise<DebugToolbar> {
    //     await DebugToolbar.driver.wait(until.elementLocated(DebugToolbar.locators.DebugToolbar.ctor), timeout);
    //     return new DebugToolbar().wait(timeout);
    // }

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