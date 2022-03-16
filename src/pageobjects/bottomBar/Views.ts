// import { BottomBarPanel, ContentAssist, Workbench } from "../..";
import { TextView, ChannelView } from "./AbstractViews";
import Workbench from '../workbench'
import clipboard from 'clipboardy';
import { BottomBarPanel } from './BottomBarPanel'
import { ElementWithContextMenu, PluginDecorator, IPluginDecorator } from "../utils";
import { bottomBar } from '../../locators/1.61.0'

class ContentAssist {
    constructor (a: any) {}
    wait () { return this }
}

/**
 * Output view of the bottom panel
 */
export interface OutputView extends IPluginDecorator<typeof bottomBar.OutputView> {}
@PluginDecorator(bottomBar.OutputView)
export class OutputView extends TextView {
    public panel: BottomBarPanel;

    constructor(
        locators: typeof bottomBar.OutputView,
        panel?: BottomBarPanel
    ) {
        super(locators, locators.elem);
        this.actionsLabel = locators.actionsLabel;
        this.panel = panel || new BottomBarPanel(this.locatorMap.bottomBar.BottomBarPanel)
    }
}

/**
 * Debug Console view on the bottom panel
 * Most functionality will only be available when a debug session is running
 */
export interface DebugConsoleView extends IPluginDecorator<typeof bottomBar.DebugConsoleView> {}
@PluginDecorator(bottomBar.DebugConsoleView)
export class DebugConsoleView extends ElementWithContextMenu {
    public panel: BottomBarPanel;

    constructor(
        locators: typeof bottomBar.DebugConsoleView,
        panel: BottomBarPanel
    ) {
        super(locators, locators.elem);
        this.panel = panel || new BottomBarPanel(this.locatorMap.bottomBar.BottomBarPanel)
    }

    /**
     * Get all text from the debug console
     */
    async getText(): Promise<string> {
        const menu = await this.openContextMenu();
        await menu.select('Copy All');
        const text = await clipboard.read();
        await clipboard.write('');
        return text;
    }

    /**
     * Clear the console of all text
     */
    async clearText(): Promise<void> {
        const menu = await this.openContextMenu();
        await menu.select('Clear Console');
    }

    /**
     * Type an expression into the debug console text area
     * @param expression expression in form of a string
     */
    async setExpression(expression: string): Promise<void> {
        const textarea = await this.elem.$(this.locatorMap.bottomBar.BottomBarViews.textArea);
        await textarea.setValue(expression);
    } 

    /**
     * Evaluate an expression:
     *  - if no argument is supplied, evaluate the current expression present in debug console text area
     *  - if a string argument is supplied, replace the current expression with the `expression` argument and evaluate
     * 
     * @param expression expression to evaluate. To use existing contents of the debug console text area instead, don't define this argument
     */
    async evaluateExpression(expression?: string): Promise<void> {
        if (expression) {
            await this.setExpression(expression);
        }
        await browser.keys('Enter');
    }
    
    /**
     * Create a content assist page object
     * @returns promise resolving to ContentAssist object
     */
    async getContentAssist(): Promise<ContentAssist> {
        return new ContentAssist(this).wait();
    }
}

/**
 * Terminal view on the bottom panel
 */
export interface TerminalView extends IPluginDecorator<typeof bottomBar.TerminalView> {}
@PluginDecorator(bottomBar.TerminalView)
export class TerminalView extends ChannelView {
    public panel: BottomBarPanel;

    constructor(
        locators: typeof bottomBar.TerminalView,
        panel: BottomBarPanel
    ) {
        super(locators, locators.elem);
        this.actionsLabel = locators.actionsLabel;
        this.panel = panel || new BottomBarPanel(this.locatorMap.bottomBar.BottomBarPanel)
    }

    /**
     * Execute command in the internal terminal and wait for results
     * @param command text of the command
     * @param timeout optional maximum time to wait for completion in milliseconds, 0 for unlimited
     * @returns Promise resolving when the command is finished
     */
    async executeCommand(command: string, timeout: number = 0): Promise<void> {
        const input = await this.elem.$(this.locators.textArea);

        try {
            await input.clearValue();
        } catch (err) {
            // try clearing, ignore if not available
        }
        await input.setValue([command, 'Enter']);
        
        let timer = 0;
        let style = await input.getCSSProperty('left');
        do {
            if (timeout > 0 && timer > timeout) {
                throw new Error(`Timeout of ${timeout}ms exceeded`);
            }
            await new Promise(res => setTimeout(res, 500));
            timer += 500;
            style = await input.getCSSProperty('left');
        } while(style.value === '0px')
    }
    
    /**
     * Get all text from the internal terminal
     * Beware, no formatting.
     * @returns Promise resolving to all terminal text
     */
    async getText(): Promise<string> {
        const workbench = new Workbench(this.locatorMap.workbench.Workbench);
        await workbench.executeCommand('terminal select all');
        await browser.pause(500);
        await workbench.executeCommand('terminal copy selection');
        await browser.pause(500);
        const text = clipboard.readSync();
        clipboard.writeSync('');
        return text;
    }

    /**
     * Destroy the currently open terminal
     * @returns Promise resolving when Kill Terminal button is pressed
     */
    async killTerminal(): Promise<void> {
        await new Workbench(this.locatorMap.workbench.Workbench)
            .executeCommand('terminal: kill the active terminal instance');
    }

    /**
     * Initiate new terminal creation
     * @returns Promise resolving when New Terminal button is pressed
     */
    async newTerminal(): Promise<void> {
        await new Workbench(this.locatorMap.workbench.Workbench)
            .executeCommand(this.locators.newCommand);
        const combo = await this.panel.elem.$$(this.locatorMap.bottomBar.BottomBarViews.channelCombo);
        if (combo.length < 1) {
            await browser.waitUntil(async () => {
                const list = await this.elem.$$(this.locators.tabList);
                return list.length > 0;
            }, { timeout: 5000 });
        }
    }

    async getCurrentChannel(): Promise<string> {
        const combo = await this.panel.elem.$$(this.locatorMap.bottomBar.BottomBarViews.channelCombo);
        if (combo.length > 0) {
            return super.getCurrentChannel();
        }
        const singleTerm = await this.panel.elem.$$(this.locators.singleTab);
        if (singleTerm.length > 0) {
            return singleTerm[0].getText();
        }
        const list = await this.elem.$(this.locators.tabList);
        const row = await list.$(this.locators.selectedRow);
        const label = (await row.getAttribute('aria-label')).split(' ');

        return `${label[1]}: ${label[2]}`
    }

    async selectChannel(name: string): Promise<void> {
        const combo = await this.panel.elem.$$(this.locatorMap.bottomBar.BottomBarViews.channelCombo);
        if (combo.length > 0) {
            return super.selectChannel(name);
        }
        const singleTerm = await this.panel.elem.$$(this.locators.singleTab);
        if (singleTerm.length > 0) {
            return;
        }

        const matches = name.match(/.*(\d+).?\s.*/);
        if (matches === null || !matches[1]) {
            throw new Error(`Channel ${name} not found`);
        }
        const channelNumber = matches[1];        

        const list = await this.elem.$(this.locators.tabList);
        const rows = await list.$$(this.locators.row);

        for (const row of rows) {
            const label = await row.getAttribute('aria-label');
            if (label.includes(channelNumber)) {
                await row.click();
                return;
            }
        }
        throw new Error(`Channel ${name} not found`);
    }
}