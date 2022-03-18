import { ElementWithContextMenu } from '../utils'
import type { ContextMenu } from "../menu/ContextMenu";
import { ActivityBar as ActivityBarLocators } from '../../locators/1.61.0'

/**
 * Page object representing the global action controls on the bottom of the action bar
 */
export class ActionsControl extends ElementWithContextMenu<typeof ActivityBarLocators> {
    public locatorKey = 'ActivityBar' as const;

    /**
     * Open the context menu bound to this global action
     * @returns Promise resolving to ContextMenu object representing the action's menu
     */
    async openActionMenu(): Promise<ContextMenu> {
        return this.openContextMenu();
    }

    /**
     * Returns the title of the associated action
     */
    async getTitle(): Promise<string> {
        return this.elem.getAttribute('aria-label');
    }
}