import type { ChainablePromiseElement } from 'webdriverio';

import { TextEditor } from "./TextEditor";
import { SettingsEditor } from "./SettingsEditor";
import { WebView } from "./WebView";
import { DiffEditor } from './DiffEditor';
import { PluginDecorator, IPluginDecorator, BasePage, ElementWithContextMenu, LocatorMap } from "../utils";
import {
    EditorView as EditorViewLocators,
    Editor as EditorLocatorsObj
} from '../../locators/1.61.0'

export interface EditorView extends IPluginDecorator<typeof EditorViewLocators> {}
/**
 * View handling the open editors
 *
 * @category Editor
 */
@PluginDecorator(EditorViewLocators)
export class EditorView extends BasePage<typeof EditorViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'EditorView' as const

    /**
     * Switch to an editor tab with the given title
     * @param title title of the tab
     * @param groupIndex zero based index for the editor group (0 for the left most group)
     * @returns Promise resolving to Editor object
     */
    async openEditor(title: string, groupIndex: number = 0) {
        const group = await this.getEditorGroup(groupIndex);
        return group.openEditor(title);
    }

    /**
     * Close an editor tab with the given title
     * @param title title of the tab
     * @param groupIndex zero based index for the editor group (0 for the left most group)
     * @returns Promise resolving when the tab's close button is pressed
     */
    async closeEditor(title: string, groupIndex: number = 0): Promise<void> {
        const group = await this.getEditorGroup(groupIndex);
        return group.closeEditor(title);
    }

    /**
     * Close all open editor tabs
     * @param groupIndex optional index to specify an editor group
     * @returns Promise resolving once all tabs have had their close button pressed
     */
    async closeAllEditors(groupIndex?: number): Promise<void> {
        let groups = await this.getEditorGroups();
        if (groupIndex !== undefined) {
            return groups[0].closeAllEditors();
        }

        while (groups.length > 0 && (await groups[0].getOpenEditorTitles()).length > 0) {
            await groups[0].closeAllEditors();
            groups = await this.getEditorGroups();
        }        
    }

    /**
     * Retrieve all open editor tab titles in an array
     * @param groupIndex optional index to specify an editor group, if left empty will search all groups
     * @returns Promise resolving to array of editor titles
     */
    async getOpenEditorTitles(groupIndex?: number): Promise<string[]> {
        const groups = await this.getEditorGroups();
        if (groupIndex !== undefined) {
            return groups[groupIndex].getOpenEditorTitles();
        }
        const titles: string[] = [];
        for (const group of groups) {
            titles.push(...(await group.getOpenEditorTitles()));
        }
        return titles;
    }

    /**
     * Retrieve an editor tab from a given group by title
     * @param title title of the tab
     * @param groupIndex zero based index of the editor group, default 0 (leftmost one)
     * @returns promise resolving to EditorTab object
     */
    async getTabByTitle(title: string, groupIndex: number = 0): Promise<EditorTab> {
        const group = await this.getEditorGroup(groupIndex);
        return group.getTabByTitle(title);
    }

    /**
     * Retrieve all open editor tabs
     * @param groupIndex index of group to search for tabs, if left undefined, all groups are searched
     * @returns promise resolving to EditorTab list
     */
    async getOpenTabs(groupIndex?: number): Promise<EditorTab[]> {
        const groups = await this.getEditorGroups();
        if (groupIndex !== undefined) {
            return groups[groupIndex].getOpenTabs();
        }
        const tabs: EditorTab[] = [];
        for (const group of groups) {
            tabs.push(...(await group.getOpenTabs()));
        }
        return tabs;
    }

    /**
     * Retrieve the active editor tab
     * @returns promise resolving to EditorTab object, undefined if no tab is active
     */
    async getActiveTab(): Promise<EditorTab | undefined> {
        const tabs = await this.getOpenTabs();
        const klasses = await Promise.all(tabs.map(async tab => tab.elem.getAttribute('class')));
        const index = klasses.findIndex(klass => klass.indexOf('active') > -1);

        if (index > -1) {
            return tabs[index];
        }
        return undefined;
    }

    /**
     * Retrieve all editor groups in a list, sorted left to right
     * @returns promise resolving to an array of EditorGroup objects
     */
    async getEditorGroups(): Promise<EditorGroup[]> {
        const elements = await this.editorGroup$$;
        const groups = await Promise.all(
            elements.map(async (element) => (
                new EditorGroup(this.locatorMap, element as any, this).wait()
            ))
        );
        
        // sort the groups by x coordinates, so the leftmost is always at index 0
        for (let i = 0; i < groups.length - 1; i++) {
            for (let j = 0; j < groups.length - i - 1; j++) {
                if ((await groups[j].elem.getLocation('x')) > (await groups[j + 1].elem.getLocation('x'))) {
                    let temp = groups[j];
                    groups[j] = groups[j + 1];
                    groups[j + 1] = temp;
                }
            }
        }
        return groups;
    }

    /**
     * Retrieve an editor group with a given index (counting from left to right)
     * @param index zero based index of the editor group (leftmost group has index 0)
     * @returns promise resolving to an EditorGroup object
     */
    async getEditorGroup(index: number): Promise<EditorGroup> {
        return (await this.getEditorGroups())[index];
    }

    /**
     * Get editor actions of a select editor group
     * @param groupIndex zero based index of the editor group (leftmost group has index 0), default 0
     * @returns promise resolving to list of WebElement objects
     */
    async getActions(groupIndex = 0) {
        const group = await this.getEditorGroup(groupIndex);
        return group.getActions();
    }

    /**
     * Get editor action of a select editor group, search by title
     * @param groupIndex zero based index of the editor group (leftmost group has index 0), default 0
     * @returns promise resolving to WebElement object if found, undefined otherwise
     */
    async getAction(title: string, groupIndex = 0) {
        const group = await this.getEditorGroup(groupIndex);
        return group.getAction(title);
    }
}

export interface EditorGroup extends IPluginDecorator<typeof EditorViewLocators> {}
/**
 * Page object representing an editor group
 *
 * @category Editor
 */
@PluginDecorator(EditorViewLocators)
export class EditorGroup extends BasePage<typeof EditorViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'EditorView' as const

    constructor(
        locators: LocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public view = new EditorView(locators)
    ) {
        super(locators, element);
    }
    
    /**
     * Switch to an editor tab with the given title
     * @param title title of the tab
     * @returns Promise resolving to Editor object
     */
    async openEditor(title: string): Promise<SettingsEditor | WebView | DiffEditor | TextEditor> {
        const tab = await this.getTabByTitle(title);
        await tab.select();

        if (await this.settingsEditor$.isExisting()) {
            return new SettingsEditor(
                this.locatorMap,
                this
            ).wait();
        }

        if (await this.webView$.isExisting()) {
            return new WebView(
                this.locatorMap,
                this.locatorMap.Editor.elem as string,
                this
            ).wait();
        }

        if (await this.diffEditor$.isExisting()) {
            return new DiffEditor(
                this.locatorMap,
                this.locatorMap.Editor.elem as string,
                this
            ).wait();
        }

        return new TextEditor(
            this.locatorMap,
            this.locatorMap.Editor.elem as string,
            this
        ).wait();
    }

    /**
     * Close an editor tab with the given title
     * @param title title of the tab
     * @returns Promise resolving when the tab's close button is pressed
     */
    async closeEditor(title: string): Promise<void> {
        const tab = await this.getTabByTitle(title);
        await tab.elem.moveTo()
        const closeButton = await tab.elem.$(this.locators.closeTab);
        await closeButton.click();
    }

    /**
     * Close all open editor tabs
     * @returns Promise resolving once all tabs have had their close button pressed
     */
    async closeAllEditors(): Promise<void> {
        let titles = await this.getOpenEditorTitles();
        while (titles.length > 0) {
            await this.closeEditor(titles[0]);
            try {
                // check if the group still exists
                await this.elem.getTagName();
            } catch (err) {
                break;
            }
            titles = await this.getOpenEditorTitles();
        }
    }

    /**
     * Retrieve all open editor tab titles in an array
     * @returns Promise resolving to array of editor titles
     */
    async getOpenEditorTitles(): Promise<string[]> {
        const tabs = await this.tab$$;
        const titles = [];
        for (const tab of tabs) {
            const title = await new EditorTab(this.locatorMap, tab as any, this.view).getTitle();
            titles.push(title);
        }
        return titles;
    }

    /**
     * Retrieve an editor tab by title
     * @param title title of the tab
     * @returns promise resolving to EditorTab object
     */
    async getTabByTitle(title: string): Promise<EditorTab> {
        const tabs = await this.tab$$;
        for (const tab of tabs) {
            const editorTab = new EditorTab(this.locatorMap, tab as any, this.view)
            const label = await editorTab.getTitle();
            if (label === title) {
                return editorTab;
            }
        }
        throw new Error(`No editor with title '${title}' available`);
    }

    /**
     * Retrieve all open editor tabs
     * @returns promise resolving to EditorTab list
     */
    async getOpenTabs(): Promise<EditorTab[]> {
        const tabs = await this.tab$$;
        return Promise.all(
            tabs.map(async tab => (
                new EditorTab(this.locatorMap, tab as any, this.view).wait()
            ))
        );
    }

    /**
     * Retrieve the active editor tab
     * @returns promise resolving to EditorTab object, undefined if no tab is active
     */
    async getActiveTab(): Promise<EditorTab | undefined> {
        const tabs = await this.getOpenTabs();
        const klasses = await Promise.all(tabs.map(async tab => tab.elem.getAttribute('class')));
        const index = klasses.findIndex(klass => klass.indexOf('active') > -1);

        if (index > -1) {
            return tabs[index];
        }
        return undefined;
    }

    /**
     * Retrieve the editor action buttons as WebElements
     * @returns promise resolving to list of WebElement objects
     */
    async getActions() {
        return this.actionContainer$.$$(this.locators.actionItem);
    }

    /**
     * Find an editor action button by title
     * @param title title of the button
     * @returns promise resolving to WebElement representing the button if found, undefined otherwise
     */
    async getAction(title: string) {
        const actions = await this.getActions();
        for (const item of actions) {
            if (await item.getAttribute('title') === title) {
                return item;
            }
        }
        return undefined;
    }
}

export interface EditorTab extends IPluginDecorator<typeof EditorLocatorsObj> {}
/**
 * Page object for editor view tab
 *
 * @category Editor
 */
@PluginDecorator(EditorLocatorsObj)
export class EditorTab extends ElementWithContextMenu<typeof EditorLocatorsObj> {
    /**
     * @private
     */
    public locatorKey = 'Editor' as const

    constructor(
        locators: LocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public view: EditorView
    ) {
        super(locators, element);
    }

    /**
     * Get the tab title as string
     */
    async getTitle(): Promise<string> {
        return this.title$.getText();
    }

    /**
     * Select (click) the tab
     */
    async select(): Promise<void> {
        await this.elem.click();
    }
}