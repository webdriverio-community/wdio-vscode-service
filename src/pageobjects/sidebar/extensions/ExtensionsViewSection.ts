import { ViewSection, ViewSectionLocators } from "../ViewSection";
import { ExtensionsViewItem } from "./ExtensionsViewItem";

import { PluginDecorator, IPluginDecorator } from '../../utils'
import { sideBar } from 'locators/1.61.0';

/**
 * Categories of extensions to search for
 */
enum ExtensionCategory {
    Installed = '@installed',
    Enabled = '@enabled',
    Disabled = '@disabled',
    Outdated = '@outdated',
    Recommended = '@recommended'
}

/**
 * View section containing extensions
 */
export interface ExtensionsViewSection extends IPluginDecorator<ViewSectionLocators> { }
@PluginDecorator(sideBar.ExtensionsViewSection)
export class ExtensionsViewSection extends ViewSection {
    async getVisibleItems(): Promise<ExtensionsViewItem[]> {
        const extensionRows = await this.items$.$$(this.locators.itemRow);
        return Promise.all(
            extensionRows.map(async row => (
                new ExtensionsViewItem(this.locatorMap.sideBar.ExtensionsViewItem, row as any, this).wait()
            ))
        );
    }

    /**
     * Search for an extension by title. This utilizes the search bar
     * in the Extensions view, which switches the perspective to the
     * section representing the chosen category and temporarily hides all other sections.
     * If you wish to continue working with the initial view section
     * (i.e. Enabled), use the clearSearch method to reset it back to default
     * 
     * @param title title to search for in '@category name' format,
     * e.g '@installed extension'. If no @category is present, marketplace will be searched
     * 
     * @returns Promise resolving to ExtensionsViewItem if such item exists, undefined otherwise
     */
    async findItem(title: string): Promise<ExtensionsViewItem | undefined> {
        await this.clearSearch();
        const progress = await this.content.progress$;
        const searchField = await this.content.elem.$(this.locators.searchBox);
        await searchField.addValue(title);

        await progress.waitForDisplayed();
        await progress.waitForDisplayed({ reverse: true });

        const sectionTitle = this.getSectionForCategory(title);
        const section = await this.content.getSection(sectionTitle) as ExtensionsViewSection;
        
        const titleParts = title.split(' ');
        if (titleParts[0].startsWith('@')) {
            title = titleParts.slice(1).join(' ');
        }

        const extensions = await section.getVisibleItems();

        for (const extension of extensions) {
            if (await extension.getTitle() === title) {
                return extension;
            }
        }

        return undefined;
    }

    /**
     * Clears the search bar on top of the view
     * @returns Promise resolving when the search box is cleared
     */
    async clearSearch(): Promise<void> {
        const progress = await this.content.progress$;
        const searchField = await this.content.elem.$(this.locators.searchBox);
        const textField = await this.content.elem.$(this.locators.textContainer);

        try {
            await textField.$(this.locators.textField)
            await searchField.addValue(['Control', 'a'])
            await searchField.addValue(['Backspace'])
            await progress.waitForDisplayed()
            await progress.waitForDisplayed({ reverse: true })
        } catch (err) {
            // do nothing, the text field is empty
        }
    }

    /**
     * Find and open an extension item
     * @param title title of the extension
     * @returns Promise resolving when the item is clicked
     */
    async openItem(title: string): Promise<never[]> {
        const item = await this.findItem(title);
        if (item) {
            await item.elem.click();
        }
        return [];
    }

    private getSectionForCategory(title: string): string {
        const category = title.split(' ')[0].toLowerCase();
        switch(category) {
            case ExtensionCategory.Disabled:
                return 'Disabled';
            case ExtensionCategory.Enabled:
                return 'Enabled';
            case ExtensionCategory.Installed:
                return 'Installed';
            case ExtensionCategory.Outdated:
                return 'Outdated';
            case ExtensionCategory.Recommended:
                return 'Other Recommendations';
            default:
                return 'Marketplace';
        }
    }
}