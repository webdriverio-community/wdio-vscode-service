import {
    DebugConsoleView, OutputView, TerminalView, ProblemsView, EditorView, TitleBar,
    StatusBar
} from '..'
import { BasePage, PageDecorator, IPageDecorator } from '../utils'
import { BottomBarPanel as BottomBarPanelLocators } from '../../locators/1.73.0'

export interface BottomBarPanel extends IPageDecorator<typeof BottomBarPanelLocators> {}
/**
 * Page object for the bottom view panel
 *
 * ```ts
 * const bottomBar = workbench.getBottomBar()
 * await bottomBar.toggle(true)
 * ```
 *
 * @category BottomBar
 */
@PageDecorator(BottomBarPanelLocators)
export class BottomBarPanel extends BasePage<typeof BottomBarPanelLocators> {
    /**
     * @private
     */
    public locatorKey = 'BottomBarPanel' as const

    /**
     * Open/Close the bottom bar panel
     * @param open true to open. false to close
     * @returns Promise resolving when the view visibility is toggled
     */
    async toggle (open: boolean): Promise<void> {
        try {
            const tab = await new EditorView(this.locatorMap).getActiveTab()
            await tab?.elem.click()
        } catch (err) {
            // ignore and move on
        }
        const height = await this.elem.getSize('height')

        if ((open && height === 0) || (!open && height > 0)) {
            const statusBar = new StatusBar(this.locatorMap)
            await statusBar.problems$.click()

            if (open) {
                await this.wait()
                return
            }

            /**
             * we might have to click again if we were on a different tab
             * than the problems tab
             */
            if (await this.elem.isDisplayed()) {
                await statusBar.problems$.click()
            }

            await this.elem.waitForDisplayed({ reverse: true })
        }
    }

    /**
     * Open the Problems view in the bottom panel
     * @returns Promise resolving to a ProblemsView object
     */
    async openProblemsView (): Promise<ProblemsView> {
        await this.openTab(this.locators.problemsTab)
        return new ProblemsView(this.locatorMap, this).wait()
    }

    /**
     * Open the Output view in the bottom panel
     * @returns Promise resolving to OutputView object
     */
    async openOutputView (): Promise<OutputView> {
        await this.openTab(this.locators.outputTab)
        return new OutputView(this.locatorMap, this).wait()
    }

    /**
     * Open the Debug Console view in the bottom panel
     * @returns Promise resolving to DebugConsoleView object
     */
    async openDebugConsoleView (): Promise<DebugConsoleView> {
        await this.openTab(this.locators.debugTab)
        return new DebugConsoleView(this.locatorMap, this).wait()
    }

    /**
     * Open the Terminal view in the bottom panel
     * @returns Promise resolving to TerminalView object
     */
    async openTerminalView (): Promise<TerminalView> {
        await this.openTab(this.locators.terminalTab)
        return new TerminalView(this.locatorMap, this).wait()
    }

    /**
     * Maximize the the bottom panel if not maximized
     * @returns Promise resolving when the maximize button is pressed
     */
    async maximize (): Promise<void> {
        await this.resize(this.locators.maximize)
    }

    /**
     * Restore the the bottom panel if maximized
     * @returns Promise resolving when the restore button is pressed
     */
    async restore (): Promise<void> {
        await this.resize(this.locators.restore)
    }

    private async openTab (title: string) {
        await this.toggle(true)
        const tabContainer = await this.tabContainer$
        try {
            const tabs = await tabContainer.$$(this.locators.tab(title))
            if (tabs.length > 0) {
                await tabs[0].click()
            } else {
                const label = await tabContainer.$(`.//a[starts-with(@aria-label, '${title}')]`)
                await label.click()
            }
        } catch (err) {
            await new TitleBar(this.locatorMap).select('View', title)
        }
    }

    private async resize (label: string) {
        await this.toggle(true)
        let action!: WebdriverIO.Element
        try {
            action = await this.elem
                .$(this.locators.globalActions)
                .$(this.locators.action(label))
        } catch (err) {
            // the panel is already maximized
        }
        if (action) {
            await action.click()
        }
    }
}
