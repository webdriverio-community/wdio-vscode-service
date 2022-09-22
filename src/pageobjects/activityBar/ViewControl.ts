import type { ChainablePromiseElement } from 'webdriverio'

import {
    ActivityBar, DebugView, SideBarView, ScmView
} from '../..'
import { NewScmView } from '../sidebar/scm/NewScmView'

import {
    PageDecorator, IPageDecorator, ElementWithContextMenu, VSCodeLocatorMap
} from '../utils'
import { ViewControl as ViewControlLocators } from '../../locators/1.70.0'

export interface ViewControl extends IPageDecorator<typeof ViewControlLocators> { }
/**
 * Page object representing a view container item in the activity bar
 *
 * ```ts
 * const workbench = await browser.getWorkbench()
 * const viewControls = await workbench.getActivityBar().getViewControls()
 * console.log(await Promise.all(viewControls.map((vc) => vc.getTitle())))
 * // returns: [
 * //    'Explorer',
 * //    'Search',
 * //    'Source Control',
 * //    'Run and Debug',
 * //    'Extensions'
 * // ]
 * ```
 *
 * @category ActivityBar
 */
@PageDecorator(ViewControlLocators)
export class ViewControl extends ElementWithContextMenu<typeof ViewControlLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewControl' as const

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public bar: ActivityBar
    ) {
        super(locators, element, bar.elem)
    }

    /**
     * Opens the associated view if not already open
     * @returns Promise resolving to SideBarView object representing the opened view
     */
    async openView (): Promise<SideBarView<any> | NewScmView | ScmView | DebugView> {
        const klass = await this.elem.getAttribute(this.locators.attribute)
        if (klass.indexOf(this.locators.klass) < 0) {
            await this.elem.click()
            // eslint-disable-next-line wdio/no-pause
            await browser.pause(500)
        }
        const view = await new SideBarView(this.locatorMap).wait()
        if ((await view.elem.$$(this.locators.scmId)).length > 0) {
            if (await browser.getVSCodeChannel() === 'vscode' && await browser.getVSCodeVersion() >= '1.47.0') {
                return new NewScmView(this.locatorMap).wait()
            }
            return new ScmView(this.locatorMap).wait()
        }
        if ((await view.elem.$$(this.locators.debugId)).length > 0) {
            return new DebugView(this.locatorMap).wait()
        }
        return view
    }

    /**
     * Closes the associated view if not already closed
     * @returns Promise resolving when the view closes
     */
    async closeView (): Promise<void> {
        const klass = await this.elem.getAttribute(this.locators.attribute)
        if (klass.indexOf(this.locators.klass) > -1) {
            await this.elem.click()
        }
    }

    /**
     * Returns the title of the associated view
     * @param includeKeyboardShortcuts if true it includes the keyboard shortcut
     *                                 in the title (e.g. "Source Control (Ctrl+Shift+G)")
     */
    async getTitle (includeKeyboardShortcuts = false): Promise<string> {
        const title = await this.badge$.getAttribute('aria-label')
        if (!includeKeyboardShortcuts) {
            /**
             * first strip out possible pending annotation, e.g.
             * "Source Control (⌃⇧G) - 8 pending
             */
            const [label] = title.split(' - ')

            /**
             * next, strip out possible keyboard shortcuts, e.g.
             * "Source Control (⌃⇧G)
             */
            return label.endsWith(')')
                ? label.split(' ').slice(0, -1).join(' ')
                : label
        }

        return title
    }
}
