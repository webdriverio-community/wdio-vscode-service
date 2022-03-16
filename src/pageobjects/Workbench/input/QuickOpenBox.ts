import { Input, QuickPickItem } from "./Input";
import { IPluginDecorator, PluginDecorator } from '../../utils'
import { input } from 'locators/1.61.0'

/**
 * @deprecated as of VS Code 1.44.0, quick open box has been replaced with input box
 * The quick open box variation of the input
 */
export interface QuickOpenBox extends IPluginDecorator<typeof input.Input> {}
@PluginDecorator({ ...input.Input, ...input.QuickOpenBox })
export class QuickOpenBox extends Input {
    /**
     * Construct a new QuickOpenBox instance after waiting for its underlying element to exist
     * Use when a quick open box is scheduled to appear.
     */
    // static async create(): Promise<QuickOpenBox> {
    //     await QuickOpenBox.driver.wait(until.elementLocated(QuickOpenBox.locators.QuickOpenBox.constructor));
    //     return new QuickOpenBox().wait();
    // }

    async hasProgress(): Promise<boolean> {
        const klass = await this.elem.$(this.locatorMap.input.QuickOpenBox.progress)
            .getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const tree = await browser.$(this.locatorMap.input.QuickOpenBox.quickList);
        await tree.waitForExist({ timeout: 1000 })
        const elements = await tree.$$(this.locatorMap.input.QuickOpenBox.row);
        for (const element of elements) {
            const index = parseInt(await element.getAttribute('aria-posinset'), 10);
            if (await element.isDisplayed()) {
                picks.push(await new QuickPickItem(this.locators, index, this).wait());
            }
        }
        return picks;
    }
}