import { ChainablePromiseElement } from 'webdriverio';

import { TextEditor } from './TextEditor'
import { Menu } from '../menu/Menu'
import { MenuItem } from '../menu/MenuItem'
import { DebugConsoleView } from "../bottomBar/Views";
import { PluginDecorator, IPluginDecorator } from "../utils";
import { editor } from '../../locators/1.61.0'

/**
 * Page object representing the content assistant
 */
export interface ContentAssist extends IPluginDecorator<typeof editor.ContentAssist> {}
@PluginDecorator(editor.ContentAssist)
export class ContentAssist extends Menu {
    constructor(
        locators: typeof editor.ContentAssist,
        parent: TextEditor | DebugConsoleView
    ) {
        super(locators, locators.elem, parent.elem);
    }

    /**
     * Get content assist item by name/text, scroll through the list
     * until the item is found, or the end is reached
     * 
     * @param name name/text to search by
     * @returns Promise resolving to ContentAssistItem object if found, undefined otherwise
     */
    async getItem(name: string): Promise<ContentAssistItem | undefined> {
        let lastItem = false;
        const scrollable = await this.elem.$(this.locators.itemList);

        let firstItem = await this.elem.$$(this.locators.firstItem);
        while(firstItem.length < 1) {
            await scrollable.addValue(['Page Up']);
            firstItem = await this.elem.$$(this.locators.firstItem);
        }

        while(!lastItem) {
            const items = await this.getItems();
            
            for (const item of items) {
                if (await item.getLabel() === name) {
                    return item;
                }
                lastItem = lastItem
                    ? lastItem
                    : (await item.elem.getAttribute('data-last-element')) === 'true';
            }
            if (!lastItem) {
                await scrollable.addValue('PageDown');
                await new Promise(res => setTimeout(res, 100));
            }
        }

        return undefined
    }

    /**
     * Get all visible content assist items
     * @returns Promise resolving to array of ContentAssistItem objects
     */
    async getItems(): Promise<ContentAssistItem[]> {
        await browser.waitUntil(() => { return this.isLoaded(); });

        const elements = await this.elem
            .$(this.locators.itemRows)
            .$$(this.locators.itemRow);
        const items: ContentAssistItem[] = [];

        for (const item of elements) {
            items.push(await new ContentAssistItem(this.locators, item as any, this).wait());
        }
        return items;
    }

    /**
     * Find if the content assist is still loading the suggestions
     * @returns promise that resolves to true when suggestions are done loading,
     * to false otherwise
     */
    async isLoaded(): Promise<boolean> {
        const message = await this.elem.$(this.locators.message);
        if (await message.isDisplayed()) {
            if ((await message.getText()).startsWith('No suggestions')) {
                return true;
            }
            return false;
        }
        return true;
    }
}

/**
 * Page object for a content assist item
 */
export interface ContentAssistItem extends IPluginDecorator<typeof editor.ContentAssist> {}
@PluginDecorator(editor.ContentAssist)
export class ContentAssistItem extends MenuItem {
    public parentMenu: ContentAssist
    public label = ''

    constructor(
        locators: typeof editor.ContentAssist,
        item: string | ChainablePromiseElement<WebdriverIO.Element>,
        contentAssist: ContentAssist
    ) {
        super(locators, item);
        this.parentMenu = contentAssist
    }

    async getLabel(): Promise<string> {
        const labelDiv = await this.elem.$(this.locators.itemLabel);
        return labelDiv.getText();
    }
}