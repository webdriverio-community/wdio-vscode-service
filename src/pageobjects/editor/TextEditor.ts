import { fileURLToPath } from 'url'
import clipboard from 'clipboardy'
import type { ChainablePromiseElement } from 'webdriverio'

import { ContentAssist, ContextMenu, InputBox } from '..'
import { StatusBar } from '../statusBar/StatusBar'
import { Editor, EditorLocators } from './Editor'

import {
    PluginDecorator, IPluginDecorator, BasePage, ElementWithContextMenu, VSCodeLocatorMap
} from '../utils'
import {
    TextEditor as TextEditorLocators,
    FindWidget as FindWidgetLocators
} from '../../locators/1.61.0'

export interface TextEditor extends IPluginDecorator<EditorLocators> {}
/**
 * Page object representing the active text editor
 *
 * @category Editor
 */
@PluginDecorator(TextEditorLocators)
export class TextEditor extends Editor<EditorLocators> {
    /**
     * @private
     */
    public locatorKey = 'TextEditor' as const

    /**
     * Find whether the active editor has unsaved changes
     * @returns Promise resolving to true/false
     */
    async isDirty (): Promise<boolean> {
        const klass = await this.parent.$(this.locators.activeTab).getAttribute('class')
        return klass.indexOf('dirty') >= 0
    }

    /**
     * Saves the active editor
     * @returns Promise resolving when ctrl+s is invoked
     */
    async save (): Promise<void> {
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        await inputarea.addValue(['Meta', 's'])
    }

    /**
     * Open the Save as prompt
     *
     * @returns InputBox serving as a simple file dialog
     */
    async saveAs (): Promise<InputBox> {
        const tab = await this.getTab()
        await tab.elem.addValue(['Meta', 'Shift', 's'])
        const inputBox = browser.$(this.locatorMap.InputBox.elem as string)
        await inputBox.waitForExist({ timeout: 5000 })
        return new InputBox(this.locatorMap, inputBox)
    }

    /**
     * Retrieve the Uri of the file opened in the active editor
     * @returns Promise resolving to editor's underlying Uri
     */
    async getFileUri (): Promise<string> {
        const ed = await this.editorContainer$
        return ed.getAttribute(this.locators.dataUri)
    }

    /**
     * Retrieve the path to the file opened in the active editor
     * @returns Promise resolving to editor's underlying file path
     */
    async getFilePath (): Promise<string> {
        return fileURLToPath(await this.getFileUri())
    }

    /**
     * Open/Close the content assistant at the current position in the editor by sending the default
     * keyboard shortcut signal
     * @param open true to open, false to close
     * @returns Promise resolving to ContentAssist object when opening, void otherwise
     */
    async toggleContentAssist (open: boolean): Promise<ContentAssist | undefined> {
        let isHidden = true
        try {
            const assist = await this.elem.$(this.locatorMap.ContentAssist.elem as string)
            const klass = await assist.getAttribute('class')
            const visibility = await assist.getCSSProperty('visibility')
            isHidden = klass.indexOf('visible') < 0 || visibility.value === 'hidden'
        } catch (err) {
            isHidden = true
        }
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)

        if (open) {
            if (isHidden) {
                await inputarea.addValue(['Meta', 'Space'])
                await browser.$(this.locatorMap.ContentAssist.elem as string)
                    .waitForExist({ timeout: 2000 })
            }
            const assist = await new ContentAssist(this.locatorMap, this).wait()
            await browser.waitUntil(() => assist.isLoaded(), { timeout: 10000 })
            return assist
        }
        if (!isHidden) {
            await inputarea.addValue(['Escape'])
        }
        return undefined
    }

    /**
     * Get all text from the editor
     * @returns Promise resolving to editor text
     */
    async getText (): Promise<string> {
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        await inputarea.addValue(['Meta', 'a', 'Meta', 'c'])
        const text = clipboard.readSync()
        await inputarea.addValue(['ArrowUp'])
        clipboard.writeSync('')
        return text
    }

    /**
     * Replace the contents of the editor with a given text
     * @param text text to type into the editor
     * @param formatText format the new text, default false
     * @returns Promise resolving once the new text is copied over
     */
    async setText (text: string, formatText = false): Promise<void> {
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        clipboard.writeSync(text)
        await inputarea.sendKeys(['Meta', 'a', 'Meta', 'v'])
        clipboard.writeSync('')
        if (formatText) {
            await this.formatDocument()
        }
    }

    /**
     * Deletes all text within the editor
     * @returns Promise resolving once the text is deleted
     */
    async clearText (): Promise<void> {
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        await inputarea.addValue(['Meta', 'a'])
        await inputarea.addValue(['Backspace'])
    }

    /**
     * Get text from a given line
     * @param line number of the line to retrieve
     * @returns Promise resolving to text at the given line number
     */
    async getTextAtLine (line: number): Promise<string> {
        const text = await this.getText()
        const lines = text.split('\n')
        if (line < 1 || line > lines.length) {
            throw new Error(`Line number ${line} does not exist`)
        }
        return lines[line - 1]
    }

    /**
     * Replace the contents of a line with a given text
     * @param line number of the line to edit
     * @param text text to set at the line
     * @returns Promise resolving when the text is typed in
     */
    async setTextAtLine (line: number, text: string): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`)
        }
        const lines = (await this.getText()).split('\n')
        lines[line - 1] = text
        await this.setText(lines.join('\n'))
    }

    /**
     * Get line number that contains the given text. Not suitable for multi line inputs.
     *
     * @param text text to search for
     * @param occurrence select which occurrence of the search text to look for in case
     *                   there are multiple in the document, defaults to 1 (the first instance)
     *
     * @returns Number of the line that contains the start of the given text. -1 if no such text is found.
     * If occurrence number is specified, searches until it finds as many instances of the given text.
     * Returns the line number that holds the last occurrence found this way.
     */
    async getLineOfText (text: string, occurrence = 1): Promise<number> {
        let lineNum = -1
        let found = 0
        const lines = (await this.getText()).split('\n')

        for (let i = 0; i < lines.length; i += 1) {
            if (lines[i].includes(text)) {
                found += 1
                lineNum = i + 1
                if (found >= occurrence) {
                    break
                }
            }
        }
        return lineNum
    }

    /**
     * Find and select a given text. Not usable for multi line selection.
     *
     * @param text text to select
     * @param occurrence specify which onccurrence of text to select if multiple are present in the document
     */
    async selectText (text: string, occurrence = 1): Promise<void> {
        const lineNum = await this.getLineOfText(text, occurrence)
        if (lineNum < 1) {
            throw new Error(`Text '${text}' not found`)
        }

        const line = await this.getTextAtLine(lineNum)
        const column = line.indexOf(text) + 1

        await this.moveCursor(lineNum, column)

        const action = ['Shift']
        for (let i = 0; i < text.length; i += 1) {
            action.push('Right')
        }
        await browser.keys(action)
        await new Promise((res) => setTimeout(res, 500))
    }

    /**
     * Get the text that is currently selected as string
     */
    async getSelectedText (): Promise<string> {
        const selection = await this.getSelection()
        if (!selection) {
            return ''
        }
        const menu = await selection.openContextMenu()
        await menu.select('Copy')
        await new Promise((res) => setTimeout(res, 500))
        return clipboard.read()
    }

    /**
     * Get the selection block as a page object
     * @returns Selection page object
     */
    async getSelection (): Promise<Selection | undefined> {
        const selection = await this.selection$$
        if (selection.length < 1) {
            return undefined
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new Selection(this.locatorMap, selection[0] as any, this)
    }

    async openFindWidget (): Promise<FindWidget> {
        await browser.keys(['Meta', 'f'])
        const widget = await browser.$(this.locators.findWidget)
        await widget.waitForDisplayed({ timeout: 2000 })

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new FindWidget(this.locatorMap, widget as any, this)
    }

    /**
     * Add the given text to the given coordinates
     * @param line number of the line to type into
     * @param column number of the column to start typing at
     * @param text text to add
     * @returns Promise resolving when the text is typed in
     */
    async typeTextAt (line: number, column: number, text: string): Promise<void> {
        await this.moveCursor(line, column)
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        await inputarea.addValue(text)
    }

    /**
     * Type given text at the current coordinates
     * @param text text to type
     * @returns promise resolving when the text is typed in
     */
    async typeText (text: string): Promise<void> {
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        await inputarea.addValue(text)
    }

    /**
     * Move the cursor to the given coordinates
     * @param line line number to move to
     * @param column column number to move to
     * @returns Promise resolving when the cursor has reached the given coordinates
     */
    async moveCursor (line: number, column: number): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`)
        }
        if (column < 1) {
            throw new Error(`Column number ${column} does not exist`)
        }
        const inputarea = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        let coordinates = await this.getCoordinates()
        const lineGap = coordinates[0] - line
        const lineKey = lineGap >= 0 ? 'ArrowUp' : 'ArrowDown'
        for (let i = 0; i < Math.abs(lineGap); i += 1) {
            await inputarea.addValue([lineKey])
        }

        coordinates = await this.getCoordinates()
        const columnGap = coordinates[1] - column
        const columnKey = columnGap >= 0 ? 'ArrowLeft' : 'ArrowRight'
        for (let i = 0; i < Math.abs(columnGap); i += 1) {
            await inputarea.addValue([columnKey])
            if ((await this.getCoordinates())[0] !== coordinates[0]) {
                throw new Error(`Column number ${column} is not accessible on line ${line}`)
            }
        }
    }

    /**
     * Get number of lines in the editor
     * @returns Promise resolving to number of lines
     */
    async getNumberOfLines (): Promise<number> {
        const lines = (await this.getText()).split('\n')
        return lines.length
    }

    /**
     * Use the built-in 'Format Document' option to format the text
     * @returns Promise resolving when the Format Document command is invoked
     */
    async formatDocument (): Promise<void> {
        const menu = await this.openContextMenu()
        try {
            await menu.select('Format Document')
        } catch (err) {
            console.log('Warn: Format Document not available for selected language')
            if (await menu.elem.isDisplayed()) {
                await menu.close()
            }
        }
    }

    async openContextMenu (): Promise<ContextMenu> {
        await this.elem.click({ button: 2 })
        const shadowRootHost = await this.view.elem.$$('.shadow-root-host')

        if (shadowRootHost.length > 0) {
            const shadowRoot = $(await browser.execute('return arguments[0].shadowRoot', shadowRootHost[0]))
            return new ContextMenu(this.locatorMap, shadowRoot).wait()
        }
        return super.openContextMenu()
    }

    /**
     * Get the cursor's coordinates as an array of two numbers: `[line, column]`
     *
     * **Caution** line & column coordinates do not start at `0` but at `1`!
     */
    async getCoordinates (): Promise<[number, number]> {
        const coords: number[] = []
        const statusBar = new StatusBar(this.locatorMap)
        const coordinates = <RegExpMatchArray>(await statusBar.getCurrentPosition()).match(/\d+/g)
        for (const c of coordinates) {
            coords.push(+c)
        }
        return [coords[0], coords[1]]
    }

    /**
     * Toggle breakpoint on a given line
     *
     * @param line target line number
     * @returns promise resolving to true when a breakpoint was added, false when removed or
     */
    async toggleBreakpoint (line: number): Promise<boolean> {
        const margin = await this.marginArea$
        const lineNum = await margin.$(this.locators.lineNumber(line))
        await lineNum.moveTo()

        const lineOverlay = await margin.$(this.locators.lineOverlay(line))
        const breakPoint = await lineOverlay.$$(this.locators.breakPoint)
        if (breakPoint.length > 0) {
            await breakPoint[0].click()
            await new Promise((res) => setTimeout(res, 200))
            return false
        }

        const noBreak = await lineOverlay.$$(this.locators.debugHint)
        if (noBreak.length > 0) {
            await noBreak[0].click()
            await new Promise((res) => setTimeout(res, 200))
            return true
        }
        return false
    }

    /**
     * Get all code lenses within the editor
     * @returns list of CodeLens page objects
     */
    async getCodeLenses (): Promise<CodeLens[]> {
        const lenses: CodeLens[] = []
        const widgets = await this.elem.$('.contentWidgets')
        const items = await widgets.$$('.//span[contains(@widgetid, \'codelens.widget\')]')

        for (const item of items) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            lenses.push(await new CodeLens(this.locatorMap, item as any, this).wait())
        }
        return lenses
    }

    /**
     * Get a code lens based on title, or zero based index
     *
     * @param indexOrTitle zero based index (counting from the top of the editor), or partial title of the code lens
     * @returns CodeLens object if such a code lens exists, undefined otherwise
     */
    async getCodeLens (indexOrTitle: number | string): Promise<CodeLens | undefined> {
        const lenses = await this.getCodeLenses()

        if (typeof indexOrTitle === 'string') {
            for (const lens of lenses) {
                const title = await lens.getText()
                const match = title.match(indexOrTitle)
                if (match && match.length > 0) {
                    return lens
                }
            }
        } else if (lenses[indexOrTitle]) {
            return lenses[indexOrTitle]
        }
        return undefined
    }
}

interface Selection extends IPluginDecorator<typeof TextEditorLocators> {}
/**
 * Text selection block
 *
 * @category Editor
 */
@PluginDecorator(TextEditorLocators)
class Selection extends ElementWithContextMenu<typeof TextEditorLocators> {
    /**
     * @private
     */
    public locatorKey = 'TextEditor' as const

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public editor: TextEditor
    ) {
        super(locators, element)
    }

    async openContextMenu (): Promise<ContextMenu> {
        await this.elem.click({ button: 2 })
        const shadowRootHost = await this.editor.view.elem.$$('.shadow-root-host')

        if (shadowRootHost.length > 0) {
            const shadowRoot = $(await browser.execute('return arguments[0].shadowRoot', shadowRootHost[0]))
            return new ContextMenu(this.locatorMap, shadowRoot).wait()
        }
        return super.openContextMenu()
    }
}

export interface CodeLens extends IPluginDecorator<typeof TextEditorLocators> {}
/**
 * Page object for Code Lens inside a text editor
 *
 * @category Editor
 */
@PluginDecorator(TextEditorLocators)
export class CodeLens extends BasePage<typeof TextEditorLocators> {
    /**
     * @private
     */
    public locatorKey = 'TextEditor' as const

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public editor: TextEditor
    ) {
        super(locators, element)
    }

    /**
     * Get the text displayed on the code lens
     * @returns text as string
     */
    async getText (): Promise<string> {
        const link = await this.elem.$('a')
        return link.getText()
    }

    /**
     * Get tooltip of the code lens
     * @returns tooltip as string
     */
    async getTooltip (): Promise<string> {
        const link = await this.elem.$('a')
        return link.getAttribute('title')
    }
}

export interface FindWidget extends IPluginDecorator<typeof FindWidgetLocators> {}
/**
 * Text Editor's Find Widget
 *
 * @category Editor
 */
@PluginDecorator(FindWidgetLocators)
export class FindWidget extends BasePage<typeof FindWidgetLocators> {
    /**
     * @private
     */
    public locatorKey = 'FindWidget' as const

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public textEditor: TextEditor
    ) {
        super(locators, element)
    }

    /**
     * Toggle between find and replace mode
     * @param replace true for replace, false for find
     */
    async toggleReplace (replace: boolean): Promise<void> {
        const btn = await this.toggleReplace$
        const klass = await btn.getAttribute('class')

        if ((replace && klass.includes('collapsed')) || (!replace && !klass.includes('collapsed'))) {
            await btn.addValue([' '])
            const repl = await browser.$(this.locators.replacePart)
            await repl.waitForExist({ timeout: 2000 })
            if (replace) {
                await repl.waitForDisplayed({ timeout: 2000 })
            } else {
                await repl.waitForDisplayed({ timeout: 2000, reverse: true })
            }
        }
    }

    /**
     * Set text in the search box
     * @param text text to fill in
     */
    async setSearchText (text: string): Promise<void> {
        const findPart = await this.findPart$
        await this.setText(text, findPart)
    }

    /**
     * Get text from Find input box
     * @returns value of find input as string
     */
    async getSearchText (): Promise<string> {
        const findPart = await this.findPart$
        return this.getInputText(findPart)
    }

    /**
     * Set text in the replace box. Will toggle replace mode on if called in find mode.
     * @param text text to fill in
     */
    async setReplaceText (text: string): Promise<void> {
        await this.toggleReplace(true)
        const replacePart = await this.replacePart$
        await this.setText(text, replacePart)
    }

    /**
     * Get text from Replace input box
     * @returns value of replace input as string
     */
    async getReplaceText (): Promise<string> {
        const replacePart = await this.replacePart$
        return this.getInputText(replacePart)
    }

    /**
     * Click 'Next match'
     */
    async nextMatch (): Promise<void> {
        const name = (await browser.getVSCodeVersion()) < '1.59.0' ? 'Next match' : 'Next Match'
        await this.clickButton(name, 'find')
    }

    /**
     * Click 'Previous match'
     */
    async previousMatch (): Promise<void> {
        const name = (await browser.getVSCodeVersion()) < '1.59.0' ? 'Previous match' : 'Previous Match'
        await this.clickButton(name, 'find')
    }

    /**
     * Click 'Replace'. Only works in replace mode.
     */
    async replace (): Promise<void> {
        await this.clickButton('Replace', 'replace')
    }

    /**
     * Click 'Replace All'. Only works in replace mode.
     */
    async replaceAll (): Promise<void> {
        await this.clickButton('Replace All', 'replace')
    }

    /**
     * Close the widget.
     */
    async close (): Promise<void> {
        await this.clickButton('Close', 'find')
    }

    /**
     * Get the number of results as an ordered pair of numbers
     * @returns pair in form of [current result index, total number of results]
     */
    async getResultCount (): Promise<[number, number]> {
        const count = await this.matchCount$
        const text = await count.getText()

        if (text.includes('No results')) {
            return [0, 0]
        }
        const numbers = text.split(' of ')
        return [+numbers[0], +numbers[1]]
    }

    /**
     * Toggle the search to match case
     * @param toggle true to turn on, false to turn off
     */
    async toggleMatchCase (toggle: boolean) {
        await this.toggleControl('Match Case', 'find', toggle)
    }

    /**
     * Toggle the search to match whole words
     * @param toggle true to turn on, false to turn off
     */
    async toggleMatchWholeWord (toggle: boolean) {
        await this.toggleControl('Match Whole Word', 'find', toggle)
    }

    /**
     * Toggle the search to use regular expressions
     * @param toggle true to turn on, false to turn off
     */
    async toggleUseRegularExpression (toggle: boolean) {
        await this.toggleControl('Use Regular Expression', 'find', toggle)
    }

    /**
     * Toggle the replace to preserve case
     * @param toggle true to turn on, false to turn off
     */
    async togglePreserveCase (toggle: boolean) {
        await this.toggleControl('Preserve Case', 'replace', toggle)
    }

    private async toggleControl (title: string, part: 'find' | 'replace', toggle: boolean) {
        if (part !== 'find' && part !== 'replace') {
            throw new Error('"part" parameter needs to be "find" or "replace"')
        }

        const element = part === 'find'
            ? await this.findPart$
            : await this.replacePart$

        if (part === 'replace') {
            await this.toggleReplace(true)
        }

        const control = await element.$(this.locators.checkbox(title))
        const checked = await control.getAttribute('aria-checked')
        if ((toggle && checked !== 'true') || (!toggle && checked === 'true')) {
            await control.click()
        }
    }

    private async clickButton (title: string, part: 'find' | 'replace') {
        if (part !== 'find' && part !== 'replace') {
            throw new Error('"part" parameter needs to be "find" or "replace"')
        }

        const element = part === 'find'
            ? await this.findPart$
            : await this.replacePart$

        if (part === 'replace') {
            await this.toggleReplace(true)
        }

        const btn = await element.$(this.locators.button(title))
        await btn.click()
        // eslint-disable-next-line wdio/no-pause
        await browser.pause(100)
    }

    private async setText (text: string, composite: WebdriverIO.Element) {
        const input = await composite.$(this.locators.input)
        await input.setValue(text)
    }

    private async getInputText (composite: WebdriverIO.Element) {
        const input = await composite.$(this.locators.content)
        return input.getAttribute('innerHTML')
    }
}
