import { ViewControl, ActionsControl } from '..'
import { PageDecorator, IPageDecorator, ElementWithContextMenu } from '../utils'
import { ActivityBar as ActivityBarLocators } from '../../locators/1.66.0'

export interface ActivityBar extends IPageDecorator<typeof ActivityBarLocators> {}
/**
 * Page object representing the left side activity bar in VS Code
 *
 * @category ActivityBar
 */
@PageDecorator(ActivityBarLocators)
export class ActivityBar extends ElementWithContextMenu<typeof ActivityBarLocators> {
    /**
     * @private
     */
    public locatorKey = 'ActivityBar' as const

    /**
     * Find all view containers displayed in the activity bar
     * @returns Promise resolving to array of ViewControl objects
     */
    async getViewControls (): Promise<ViewControl[]> {
        const views: ViewControl[] = []
        const viewContainer = await this.viewContainer$
        for (const element of await viewContainer.$$(this.locators.actionItem)) {
            views.push(await new ViewControl(
                this.locatorMap,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                element as any,
                this
            ).wait())
        }
        return views
    }

    /**
     * Find a view container with a given title
     * @param name title of the view
     * @returns Promise resolving to ViewControl object representing the view selector, undefined if not found
     */
    async getViewControl (name: string): Promise<ViewControl | undefined> {
        const controls = await this.getViewControls()
        const names = await Promise.all(
            controls.map(async (item) => item.getTitle())
        )
        const index = names.findIndex((value) => value.indexOf(name) > -1)
        if (index > -1) {
            return controls[index]
        }
        return undefined
    }

    /**
     * Returns selected view control
     * @returns Promise resolving to selected ViewControl object
     */
    async getSelectedViewAction (): Promise<ViewControl> {
        const element = await this.viewContainer$.$(this.locators.actionItemSelected)
        return new ViewControl(
            this.locatorMap,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            element as any,
            this
        ).wait()
    }

    /**
     * Find all global action controls displayed on the bottom of the activity bar
     * @returns Promise resolving to array of ActionsControl objects
     */
    async getGlobalActions (): Promise<ActionsControl[]> {
        const actions: ActionsControl[] = []
        const actionContainer = await this.actionsContainer$
        for (const element of await actionContainer.$$(this.locators.actionItem)) {
            actions.push(await new ActionsControl(
                this.locatorMap,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                element as any
            ).wait())
        }
        return actions
    }

    /**
     * Find an action control with a given title
     * @param name title of the global action
     * @returns Promise resolving to ActionsControl object representing the action selector, undefined if not found
     */
    async getGlobalAction (name: string): Promise<ActionsControl | undefined> {
        const actions = await this.getGlobalActions()
        const names = await Promise.all(actions.map(async (item) => item.getTitle()))
        const index = names.findIndex((value) => value.indexOf(name) > -1)
        if (index > -1) {
            return actions[index]
        }
        return undefined
    }
}
