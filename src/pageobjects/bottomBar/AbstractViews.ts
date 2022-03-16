import clipboard from 'clipboardy';

import { ElementWithContextMenu, IPluginDecorator } from "../utils";
import { bottomBar } from '../../locators/1.61.0'

/**
 * View with channel selector
 */
export interface ChannelView extends Omit<IPluginDecorator<typeof bottomBar.BottomBarViews>, 'locators'> {}
export abstract class ChannelView extends ElementWithContextMenu {
    protected actionsLabel!: string;

    /**
    * Get names of all selectable channels
    * @returns Promise resolving to array of strings - channel names
    */
    async getChannelNames(): Promise<string[]> {
        const names: string[] = [];
        const elements = await this.parent!
            .$(this.locatorMap.bottomBar.BottomBarViews.actionsContainer(this.actionsLabel))
            .$$(this.locatorMap.bottomBar.BottomBarViews.channelOption);

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
        const combo = await this.parent!.$(this.locatorMap.bottomBar.BottomBarViews.channelCombo);
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
                const text = await rows[i].$(this.locatorMap.bottomBar.BottomBarViews.channelText).getText();
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
        const combo = await this.parent!.$(this.locatorMap.bottomBar.BottomBarViews.channelCombo);
        const workbench = await browser.$(this.locatorMap.workbench.Workbench.elem);
        const menus = await workbench.$$(this.locatorMap.menu.ContextMenu.contextView);
        let menu!: WebdriverIO.Element;

        if (menus.length < 1) {
            await combo.click();
            await browser.pause(500);
            menu = await workbench.$(this.locatorMap.menu.ContextMenu.contextView);
            return menu.$$(this.locatorMap.bottomBar.BottomBarViews.channelRow);
        } else if (await menus[0].isDisplayed()) {
            await combo.click();
            await browser.pause(500);
        }
        await combo.click();
        await browser.pause(500);
        menu = await workbench.$(this.locatorMap.menu.ContextMenu.contextView);
        if (!await menu.isDisplayed()) {
            await combo.click();
            await browser.pause(500);
        }
        return menu.$$(this.locatorMap.bottomBar.BottomBarViews.channelRow);
    }
}

/**
 * View with channel selection and text area
 */
export abstract class TextView extends ChannelView {
    protected actionsLabel!: string;

    /**
     * Get all text from the currently open channel
     * @returns Promise resolving to the view's text
     */
    async getText(): Promise<string> {
        const textarea = await this.elem.$(this.locatorMap.bottomBar.BottomBarViews.textArea);
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
        await this.parent!
            .$(this.locatorMap.bottomBar.BottomBarViews.actionsContainer(this.actionsLabel))
            .$(this.locatorMap.bottomBar.BottomBarViews.clearText)
            .click();
    }
}
