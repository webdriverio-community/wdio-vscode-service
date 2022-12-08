import { ElementWithContextMenu } from '../utils.js'
import { ActivityBar as ActivityBarLocators } from '../../locators/1.73.0.js'
import type { ContextMenu } from '../menu/ContextMenu'

/**
 * Page object representing the global action controls on the bottom of the action bar.
 *
 * ```ts
 * const workbench = await browser.getWorkbench()
 * const actionControl = await workbench.getActivityBar().getGlobalActions()
 * console.log(await Promise.all(actionControl.map(ac => ac.getTitle())))
 * // returns: [ 'Accounts', 'Manage' ]
 * ```
 *
 * @category ActivityBar
 */
export class ActionsControl extends ElementWithContextMenu<typeof ActivityBarLocators> {
    /**
     * @private
     */
    public locatorKey = 'ActivityBar' as const

    /**
     * Open the context menu bound to this global action
     * @returns Promise resolving to ContextMenu object representing the action's menu
     */
    async openActionMenu (): Promise<ContextMenu> {
        return this.openContextMenu()
    }

    /**
     * Returns the title of the associated action
     */
    async getTitle (): Promise<string> {
        return this.elem.getAttribute('aria-label')
    }
}
