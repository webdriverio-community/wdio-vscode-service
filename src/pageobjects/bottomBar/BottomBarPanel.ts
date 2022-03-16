import { TitleBar } from "../menu/TitleBar";
// import { ProblemsView, OutputView, DebugConsoleView, TerminalView, EditorView } from "../..";
import { BasePage, ElementWithContextMenu, PluginDecorator, IPluginDecorator } from "../utils";
import { bottomBar } from '../../locators/1.61.0'

class EditorView {
    constructor (public locator: any) {}
    getActiveTab () { return { click: () => {} } }
}
class ProblemsView extends ElementWithContextMenu {
    constructor (public param: any) { super(param) }
}
class OutputView extends ElementWithContextMenu {
    constructor (public param: any) { super(param) }
}
class DebugConsoleView extends ElementWithContextMenu {
    constructor (public param: any) { super(param) }
}
class TerminalView extends ElementWithContextMenu {
    constructor (public param: any) { super(param) }
}

/**
 * Page object for the bottom view panel
 */
export interface BottomBarPanel extends IPluginDecorator<typeof bottomBar.BottomBarPanel> {}
@PluginDecorator(bottomBar.BottomBarPanel)
export class BottomBarPanel extends BasePage {
    /**
     * Open/Close the bottom bar panel
     * @param open true to open. false to close
     * @returns Promise resolving when the view visibility is toggled
     */
    async toggle(open: boolean): Promise<void> {
        try {
            const tab = await new EditorView(this.locatorMap.editor.EditorView).getActiveTab()
            await tab?.click();
        } catch (err) {
            // ignore and move on
        }
        const height = await this.elem.getSize('height');
        if ((open && height === 0) || !open && height > 0) {
            await browser.keys(['Control', 'j']);
            if (open) {
                await this.wait();
            } else {
                await this.elem.waitForDisplayed({ reverse: true })
            }
        }
    }

    /**
     * Open the Problems view in the bottom panel
     * @returns Promise resolving to a ProblemsView object
     */
    async openProblemsView(): Promise<ProblemsView> {
        await this.openTab(this.locators.problemsTab);
        return new ProblemsView(this).wait();
    }

    /**
     * Open the Output view in the bottom panel
     * @returns Promise resolving to OutputView object
     */
    async openOutputView(): Promise<OutputView> {
        await this.openTab(this.locators.outputTab);
        return new OutputView(this).wait();
    }

    /**
     * Open the Debug Console view in the bottom panel
     * @returns Promise resolving to DebugConsoleView object
     */
    async openDebugConsoleView(): Promise<DebugConsoleView> {
        await this.openTab(this.locators.debugTab);
        return new DebugConsoleView(this).wait();
    }

    /**
     * Open the Terminal view in the bottom panel
     * @returns Promise resolving to TerminalView object
     */
    async openTerminalView(): Promise<TerminalView> {
        await this.openTab(this.locators.terminalTab);
        return new TerminalView(this).wait();
    }

    /**
     * Maximize the the bottom panel if not maximized
     * @returns Promise resolving when the maximize button is pressed
     */
    async maximize(): Promise<void> {
        await this.resize(this.locators.maximize);
    }

    /**
     * Restore the the bottom panel if maximized
     * @returns Promise resolving when the restore button is pressed
     */
    async restore(): Promise<void> {
        await this.resize(this.locators.restore);
    }

    private async openTab(title: string) {
        await this.toggle(true);
        const tabContainer = await this.elem.$(this.locators.tabContainer);
        try {
            const tabs = await tabContainer.$$(this.locators.tab(title));
            if (tabs.length > 0) {
                await tabs[0].click();
            } else {
                const label = await tabContainer.$(`.//a[starts-with(@aria-label, '${title}')]`);
                await label.click();
            }
        } catch (err) {
            await new TitleBar(this.locatorMap.menu.TitleBar).select('View', title);
        }
    }

    private async resize(label: string) {
        await this.toggle(true);
        let action!: WebdriverIO.Element;
        try {
            action = await this.elem
                .$(this.locators.globalActions)
                .$(this.locators.action(label));
        } catch (err) {
            // the panel is already maximized
        }
        if (action) {
            await action.click();
        }
    }
}