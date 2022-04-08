import clipboard from 'clipboardy'

import { Workbench, BottomBarPanel, ContentAssist } from '../..'
import { TextView, ChannelView } from './AbstractViews'
import {
    ElementWithContextMenu, PluginDecorator, IPluginDecorator, VSCodeLocatorMap
} from '../utils'
import {
    OutputView as OutputViewLocators,
    DebugConsoleView as DebugConsoleViewLocators,
    TerminalView as TerminalViewLocators
} from '../../locators/1.61.0'

export interface OutputView extends IPluginDecorator<typeof OutputViewLocators> {}
/**
 * Output view of the bottom panel
 *
 * ```ts
 * const bottomBar = workbench.getBottomBar()
 * const outputView = await bottomBar.openOutputView()
 * console.log(await outputView.getChannelNames())
 * // returns
 * // [
 * //   'Tasks',
 * //   'Extensions',
 * //   'Microsoft Authentication',
 * //   'Git',
 * //   'GitHub Authentication',
 * //   'Log (Window)',
 * //   'Log (Main)',
 * //   'Log (Extension Host)',
 * //   'Log (Settings Sync)',
 * //   'Log (Shared)'
 * // ]
 * ```
 *
 * @category BottomBar
 */
@PluginDecorator(OutputViewLocators)
export class OutputView extends TextView<typeof OutputViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'OutputView' as const

    constructor (
        locators: VSCodeLocatorMap,
        driver: WebdriverIO.Browser,
        public panel = new BottomBarPanel(locators, driver)
    ) {
        super(locators, driver)
        this.actionsLabel = locators.OutputView.actionsLabel as string
        this.setParentElement(panel.elem)
    }
}

export interface DebugConsoleView extends IPluginDecorator<typeof DebugConsoleViewLocators> {}
/**
 * Debug Console view on the bottom panel
 * Most functionality will only be available when a debug session is running
 *
 * @category BottomBar
 */
@PluginDecorator(DebugConsoleViewLocators)
export class DebugConsoleView extends ElementWithContextMenu<typeof DebugConsoleViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'DebugConsoleView' as const

    constructor (
        locators: VSCodeLocatorMap,
        driver: WebdriverIO.Browser,
        public panel: BottomBarPanel = new BottomBarPanel(locators, driver)
    ) {
        super(locators, driver)
        this.setParentElement(panel.elem)
    }

    /**
     * Get all text from the debug console
     */
    async getText (): Promise<string> {
        const menu = await this.openContextMenu()
        await menu.select('Copy All')
        const text = await clipboard.read()
        await clipboard.write('')
        return text
    }

    /**
     * Clear the console of all text
     */
    async clearText (): Promise<void> {
        const menu = await this.openContextMenu()
        await menu.select('Clear Console')
    }

    /**
     * Type an expression into the debug console text area
     * @param expression expression in form of a string
     */
    async setExpression (expression: string): Promise<void> {
        const textarea = await this.elem.$(this.locatorMap.BottomBarViews.textArea as string)
        await textarea.setValue(expression)
    }

    /**
     * Evaluate an expression:
     *  - if no argument is supplied, evaluate the current expression present in debug console text area
     *  - if a string argument is supplied, replace the current expression with the `expression` argument and evaluate
     *
     * @param expression expression to evaluate. To use existing contents of the debug console
     *                   text area instead, don't define this argument
     */
    async evaluateExpression (expression?: string): Promise<void> {
        if (expression) {
            await this.setExpression(expression)
        }
        await this._driver.keys('Enter')
    }

    /**
     * Create a content assist page object
     * @returns promise resolving to ContentAssist object
     */
    async getContentAssist (): Promise<ContentAssist> {
        return this.load(ContentAssist, this).wait()
    }
}

export interface TerminalView extends IPluginDecorator<typeof TerminalViewLocators> {}
/**
 * Terminal view on the bottom panel
 *
 * @category BottomBar
 */
@PluginDecorator(TerminalViewLocators)
export class TerminalView extends ChannelView<typeof TerminalViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'TerminalView' as const

    constructor (
        locators: VSCodeLocatorMap,
        driver: WebdriverIO.Browser,
        public panel = new BottomBarPanel(locators, driver)
    ) {
        super(locators, driver)
        this.actionsLabel = locators.OutputView.actionsLabel as string
    }

    /**
     * Execute command in the internal terminal and wait for results
     * @param command text of the command
     * @param timeout optional maximum time to wait for completion in milliseconds, 0 for unlimited
     * @returns Promise resolving when the command is finished
     */
    async executeCommand (command: string, timeout = 0): Promise<void> {
        const input = await this.textArea$

        try {
            await input.clearValue()
        } catch (err) {
            // try clearing, ignore if not available
        }
        await input.setValue([command, 'Enter'])

        let timer = 0
        let style = await input.getCSSProperty('left')
        do {
            if (timeout > 0 && timer > timeout) {
                throw new Error(`Timeout of ${timeout}ms exceeded`)
            }
            await new Promise((res) => setTimeout(res, 500))
            timer += 500
            style = await input.getCSSProperty('left')
        } while (style.value === '0px')
    }

    /**
     * Get all text from the internal terminal
     * Beware, no formatting.
     * @returns Promise resolving to all terminal text
     */
    async getText (): Promise<string> {
        const workbench = this.load(Workbench)
        await workbench.executeCommand('terminal select all')
        // eslint-disable-next-line wdio/no-pause
        await this._driver.pause(500)
        await workbench.executeCommand('terminal copy selection')
        // eslint-disable-next-line wdio/no-pause
        await this._driver.pause(500)
        const text = clipboard.readSync()
        clipboard.writeSync('')
        return text
    }

    /**
     * Destroy the currently open terminal
     * @returns Promise resolving when Kill Terminal button is pressed
     */
    async killTerminal (): Promise<void> {
        await this.load(Workbench)
            .executeCommand('terminal: kill the active terminal instance')
    }

    /**
     * Initiate new terminal creation
     * @returns Promise resolving when New Terminal button is pressed
     */
    async newTerminal (): Promise<void> {
        await this.load(Workbench)
            .executeCommand(this.locators.newCommand)
        const combo = await this.panel.elem.$$(this.locatorMap.BottomBarViews.channelCombo as string)
        if (combo.length < 1) {
            await this._driver.waitUntil(async () => {
                const list = await this.tabList$$
                return list.length > 0
            }, { timeout: 5000 })
        }
    }

    async getCurrentChannel (): Promise<string> {
        const combo = await this.panel.elem.$$(this.locatorMap.BottomBarViews.channelCombo as string)
        if (combo.length > 0) {
            return super.getCurrentChannel()
        }
        const singleTerm = await this.panel.elem.$$(this.locators.singleTab)
        if (singleTerm.length > 0) {
            return singleTerm[0].getText()
        }
        const list = await this.tabList$
        const row = await list.$(this.locators.selectedRow)
        const label = (await row.getAttribute('aria-label')).split(' ')

        return `${label[1]}: ${label[2]}`
    }

    async selectChannel (name: string): Promise<void> {
        const combo = await this.panel.elem.$$(this.locatorMap.BottomBarViews.channelCombo as string)
        if (combo.length > 0) {
            return super.selectChannel(name)
        }
        const singleTerm = await this.panel.elem.$$(this.locators.singleTab)
        if (singleTerm.length > 0) {
            return undefined
        }

        const matches = name.match(/.*(\d+).?\s.*/)
        if (matches === null || !matches[1]) {
            throw new Error(`Channel ${name} not found`)
        }
        const channelNumber = matches[1]

        const list = await this.tabList$
        const rows = await list.$$(this.locators.row)

        for (const row of rows) {
            const label = await row.getAttribute('aria-label')
            if (label.includes(channelNumber)) {
                await row.click()
                return undefined
            }
        }
        throw new Error(`Channel ${name} not found`)
    }
}
