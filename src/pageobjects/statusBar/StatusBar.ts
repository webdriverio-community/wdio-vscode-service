import { PluginDecorator, IPluginDecorator, BasePage } from '../utils'
import { StatusBar as StatusBarLocators } from '../../locators/1.61.0'

/**
 * Page object for the status bar at the bottom
 */
export interface StatusBar extends IPluginDecorator<typeof StatusBarLocators> {}
@PluginDecorator(StatusBarLocators)
export class StatusBar extends BasePage<typeof StatusBarLocators> {
    public locatorKey = 'StatusBar' as const

    /**
     * Retrieve all status bar items currently displayed
     * @returns Promise resolving to an array of WebElement
     */
    async getItems() {
        return this.item$$;
    }

    /**
     * Find status bar item by title/visible label
     * @param title title of the item
     * @returns Promise resolving to a WebElement if item is found, to undefined otherwise
     */
    async getItem(title: string) {
        const items = await this.getItems();
        for (const item of items) {
            if (await item.getAttribute(this.locators.itemTitle) === title) {
                return item;
            }
        }
        return undefined;
    }

    /**
     * Open the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    async openNotificationsCenter(): Promise<any /*NotificationsCenter*/> {
        await this.toggleNotificationsCentre(true);
        // return new NotificationsCenter();
    }

    /**
     * Close the notifications center
     * @returns Promise resolving when the notifications center is closed
     */
    async closeNotificationsCenter(): Promise<void> {
        await this.toggleNotificationsCentre(false);
    }

    /**
     * Open the language selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the language selection is opened
     */
    async openLanguageSelection(): Promise<void> {
        await this.language$.click();
    }

    /**
     * Get the current language label text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current language
     */
    async getCurrentLanguage(): Promise<string> {
        return this.getPartText(this.locators.language);
    }

    /**
     * Open the quick pick for line endings selection
     * Only works with an open editor
     * @returns Promise resolving when the line ending selection is opened
     */
    async openLineEndingSelection(): Promise<void> {
        await this.lines$.click();
    }

    /**
     * Get the currently selected line ending as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current line ending
     */
    async getCurrentLineEnding(): Promise<string> {
        return this.getPartText(this.locators.lines);
    }

    /**
     * Open the encoding selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the encoding selection is opened
     */
    async openEncodingSelection(): Promise<void> {
        await this.encoding$.click();
    }

    /**
     * Get the name of the current encoding as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current encoding
     */
    async getCurrentEncoding(): Promise<string> {
        return this.getPartText(this.locators.encoding);
    }

    /**
     * Open the indentation selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the indentation selection is opened
     */
    async openIndentationSelection(): Promise<void> {
        await this.indent$.click();
    }

    /**
     * Get the current indentation option label as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current indentation
     */
    async getCurrentIndentation(): Promise<string> {
        return this.getPartText(this.locators.indent);
    }

    /**
     * Open the line selection input box
     * Only works with an open editor
     * @returns Promise resolving when the line selection is opened
     */
    async openLineSelection(): Promise<void> {
        await this.selection$.click();
    }

    /**
     * Get the current editor coordinates as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current position in the editor
     */
    async getCurrentPosition(): Promise<string> {
        return this.getPartText(this.locators.selection);
    }

    /**
     * Open/Close notification centre
     * @param open true to open, false to close
     */
    private async toggleNotificationsCentre(open: boolean): Promise<void> {
        let visible = false;
        try {
            const klass = await browser
                .$(this.locatorMap.Workbench.elem as string)
                .$(this.locators.notifications)
                .getAttribute('class');
            visible = klass.indexOf('visible') > -1;
        } catch (err) {
            // element doesn't exist until the button is first clicked
        }
        if (visible !== open) {
            await this.bell$.click();
        }
    }

    private async getPartText(locator: string): Promise<string> {
        return this.elem.$(locator).$('a').getAttribute('innerHTML');
    }
}