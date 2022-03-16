import { Input, QuickPickItem } from "./Input";
import { IPluginDecorator, PluginDecorator } from '../../utils'
import { input } from 'locators/1.61.0'

/**
 * Plain input box variation of the input page object
 */
export interface InputBox extends IPluginDecorator<typeof input.Input> {}
@PluginDecorator({ ...input.Input, ...input.InputBox})
export class InputBox extends Input {
    /**
     * Get the message below the input field
     */
    async getMessage(): Promise<string> {
        return await this.elem.$(this.locatorMap.input.InputBox.message).getText();
    }

    async hasProgress(): Promise<boolean> {
        const klass = await this.elem.$(this.locatorMap.input.InputBox.progress).getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const elements = await this.elem.$(this.locatorMap.input.InputBox.quickList)
            .$(this.locatorMap.input.InputBox.rows)
            .$$(this.locatorMap.input.InputBox.row);
        
        for (const element of elements) {
            if (await element.isDisplayed()) {
                picks.push(await new QuickPickItem(this.locators, parseInt(await element.getAttribute('data-index')), this).wait());
            }
        }
        return picks;
    }

    /**
     * Find whether the input is showing an error
     * @returns Promise resolving to notification message
     */
    async hasError(): Promise<boolean> {
        const klass = await this.elem.$(this.locators.inputBox).getAttribute('class');
        return klass.indexOf('error') > -1;
    }

    /**
     * Check if the input field is masked (input type password)
     * @returns Promise resolving to notification message
     */
    async isPassword(): Promise<boolean> {
        return await this.elem.$(this.locators.input).getAttribute('type') === 'password';
    }
}