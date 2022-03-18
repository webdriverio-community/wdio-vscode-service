import clipboard from 'clipboardy';

import { ElementWithContextMenu } from "../utils";

/**
 * View with channel selector
 */
export abstract class ChannelView<T> extends ElementWithContextMenu<T> {
    protected actionsLabel!: string;

    /**
    * Get names of all selectable channels
    * @returns Promise resolving to array of strings - channel names
    */
    async getChannelNames(): Promise<string[]> {
        const names: string[] = [];
        const elements = await this.parent
            .$((this.locatorMap.BottomBarViews.actionsContainer as Function)(this.actionsLabel))
            .$$(this.locatorMap.BottomBarViews.channelOption as string);

        for (const element of elements) {
            const disabled = await element.getAttribute('disabled');
            if (!disabled) {
                names.push(await element.getAttribute('value'));
            }
        }
        return names;
    }

    /**
     * Get name of the current channel
     * @returns Promise resolving to the current channel name
     */
    async getCurrentChannel(): Promise<string> {
        const combo = await this.parent.$(this.locatorMap.BottomBarViews.channelCombo as string);
        return combo.getAttribute('title');
    }

    /**
     * Select a channel using the selector combo
     * @param name name of the channel to open
     */
    async selectChannel(name: string): Promise<void> {
        const rows = await this.getOptions();
        for (let i = 0; i < rows.length; i++) {
            if ((await rows[i].getAttribute('class')).indexOf('disabled') < 0) {
                const text = await rows[i].$(this.locatorMap.BottomBarViews.channelText as string).getText();
                if (name === text) {
                    await rows[i].click();
                    await new Promise(res => setTimeout(res, 500));
                    return;
                }
            }
        }
        throw new Error(`Channel ${name} not found`);
    }

    private async getOptions() {
        const combo = await this.parent.$(this.locatorMap.BottomBarViews.channelCombo as string);
        const workbench = await browser.$(this.locatorMap.Workbench.elem as string);
        const menus = await workbench.$$(this.locatorMap.ContextMenu.contextView as string);
        let menu!: WebdriverIO.Element;

        if (menus.length < 1) {
            await combo.click();
            await browser.pause(500);
            menu = await workbench.$(this.locatorMap.ContextMenu.contextView as string);
            return menu.$$(this.locatorMap.BottomBarViews.channelRow as string);
        } else if (await menus[0].isDisplayed()) {
            await combo.click();
            await browser.pause(500);
        }
        await combo.click();
        await browser.pause(500);
        menu = await workbench.$(this.locatorMap.ContextMenu.contextView as string);
        if (!await menu.isDisplayed()) {
            await combo.click();
            await browser.pause(500);
        }
        return menu.$$(this.locatorMap.BottomBarViews.channelRow as string);
    }
}

/**
 * View with channel selection and text area
 */
export abstract class TextView<T> extends ChannelView<T> {
    protected actionsLabel!: string;

    /**
     * Get all text from the currently open channel
     * @returns Promise resolving to the view's text
     */
    async getText(): Promise<string> {
        const textarea = await this.elem.$(this.locatorMap.BottomBarViews.textArea as string);
        /**
         * Todo(Christian): replace with actions command
         */
        await textarea.addValue(['CTRL', 'a']);
        await textarea.addValue(['CTRL', 'c']);
        const text = clipboard.readSync();
        await textarea.click();
        clipboard.writeSync('');
        return text;
    }

    /**
     * Clear the text in the current channel
     * @returns Promise resolving when the clear text button is pressed
     */
    async clearText(): Promise<void> {
        await this.parent
            .$((this.locatorMap.BottomBarViews.actionsContainer as Function)(this.actionsLabel))
            .$(this.locatorMap.BottomBarViews.clearText as string)
            .click();
    }
}
