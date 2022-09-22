import { Editor, EditorLocators } from './Editor'
import { ContextMenu } from '../menu/ContextMenu'
import { EditorView, EditorGroup } from '..'

import {
    PageDecorator, IPageDecorator, BasePage, VSCodeLocatorMap, sleep
} from '../utils'
import { SettingsEditor as SettingsEditorLocators } from '../../locators/1.70.0'

export interface SettingsEditor extends IPageDecorator<EditorLocators> {}
/**
 * Page object representing the internal VSCode settings editor
 *
 * @category Editor
 */
@PageDecorator(SettingsEditorLocators)
export class SettingsEditor extends Editor<EditorLocators> {
    /**
     * @private
     */
    public locatorKey = 'SettingsEditor' as const
    public view: EditorView | EditorGroup

    constructor (
        locators: VSCodeLocatorMap,
        view?: EditorView | EditorGroup
    ) {
        super(locators, view?.elem)
        this.view = view || new EditorView(this.locatorMap)
    }

    /**
     * Search for a setting with a particular title and category.
     * Returns an appropriate Setting object if the label is found,
     * undefined otherwise.
     *
     * If your setting has nested categories (i.e `example.general.test`),
     * pass in each category as a separate string.
     *
     * @param title title of the setting
     * @param categories category of the setting
     * @returns Promise resolving to a Setting object if found, undefined otherwise
     */
    async findSetting (title: string, ...categories: string[]): Promise<Setting> {
        const category = categories.join(' › ')
        const searchBox = await this.elem.$(this.locatorMap.Editor.inputArea as string)
        await searchBox.setValue(`${category}: ${title}`)

        const count = await this.itemCount$
        let textCount = await count.getText()

        await browser.waitUntil(async () => {
            await sleep(1500)
            const text = await count.getText()
            if (text !== textCount) {
                textCount = text
                return false
            }
            return true
        })

        let setting!: Setting
        const items = await this.itemRow$$
        for (const item of items) {
            try {
                return await (await this.createSetting(item, title, category)).wait()
            } catch (err) {
                // ignore
            }
        }
        return setting
    }

    /**
     * Switch between settings perspectives
     * Works only if your vscode instance has both user and workspace settings available
     *
     * @param perspective User or Workspace
     * @returns Promise that resolves when the appropriate button is clicked
     */
    async switchToPerspective (perspective: 'User' | 'Workspace'): Promise<void> {
        await this.header$
            .$(this.locators.tabs)
            .$(this.locators.actions)
            .$(this.locators.action(perspective))
            .click()
    }

    /**
     * Context menu is disabled in this editor, throw an error
     */
    openContextMenu (): Promise<ContextMenu> {
        throw new Error('Operation not supported')
    }

    private async createSetting (element: WebdriverIO.Element, title: string, category: string): Promise<Setting> {
        if (!await element.$(this.locators.settingConstructor(title, category)).isExisting()) {
            throw new Error('Setting not found')
        }

        // try a combo setting
        if (await element.$(this.locators.comboSetting).isExisting()) {
            return new ComboSetting(this.locatorMap, title, category, this)
        }

        // try text setting
        if (await element.$(this.locators.textSetting).isExisting()) {
            return new TextSetting(this.locatorMap, title, category, this)
        }

        // try checkbox setting
        if (await element.$(this.locators.checkboxSetting).isExisting()) {
            return new CheckboxSetting(this.locatorMap, title, category, this)
        }

        // try link setting
        if (await element.$(this.locators.linkButton).isExisting()) {
            return new LinkSetting(this.locatorMap, title, category, this)
        }

        throw new Error('Setting type not supported')
    }
}

export interface Setting extends IPageDecorator<typeof SettingsEditorLocators> {}
/**
 * Abstract item representing a Setting with title, description and
 * an input element (combo/textbox/checkbox/link)
 *
 * @category Editor
 */
export abstract class Setting extends BasePage<typeof SettingsEditorLocators> {
    private title: string
    private category: string

    constructor (
        locators: VSCodeLocatorMap,
        title: string,
        category: string,
        public settings: SettingsEditor
    ) {
        super(locators, (locators.SettingsEditor.settingConstructor as Function)(title, category) as string)
        this.title = title
        this.category = category
    }

    /**
     * Get the value of the setting based on its input type
     *
     * @returns promise that resolves to the current value of the setting
     */
    abstract getValue (): Promise<string | boolean>

    /**
     * Set the value of the setting based on its input type
     *
     * @param value boolean for checkboxes, string otherwise
     */
    abstract setValue (value: string | boolean): Promise<void>

    /**
     * Get the category of the setting
     * All settings are labeled as Category: Title
     */
    getCategory (): string {
        return this.category
    }

    /**
     * Get description of the setting
     * @returns Promise resolving to setting description
     */
    async getDescription (): Promise<string> {
        return this.settingDesctiption$.getText()
    }

    /**
     * Get title of the setting
     */
    getTitle (): string {
        return this.title
    }
}

/**
 * Setting with a combo box
 *
 * @category Editor
 */
@PageDecorator(SettingsEditorLocators)
export class ComboSetting extends Setting {
    /**
     * @private
     */
    public locatorKey = 'SettingsEditor' as const

    getValue (): Promise<string> {
        return this.comboSetting$.getAttribute('title')
    }

    async setValue (value: string): Promise<void> {
        const rows = await this.getOptions()
        for (let i = 0; i < rows.length; i += 1) {
            if ((await rows[i].getAttribute('class')).indexOf('disabled') < 0) {
                const text = await rows[i].$(this.locators.comboOption).getText()
                if (value === text) {
                    await rows[i].click()
                    return
                }
            }
        }
    }

    /**
     * Get the labels of all options from the combo
     * @returns Promise resolving to array of string values
     */
    async getValues (): Promise<string[]> {
        const values = []
        const rows = await this.getOptions()

        for (const row of rows) {
            values.push(await row.$(this.locators.comboOption).getText())
        }
        return values
    }

    private async getOptions () {
        const menu = await this.openCombo()
        return menu.$$(this.locators.itemRow)
    }

    private async openCombo () {
        const combo = await this.comboSetting$
        const workbench = await browser.$(this.locatorMap.Workbench.elem as string)
        const menus = await workbench.$$(this.locatorMap.ContextMenu.contextView as string)
        let menu!: WebdriverIO.Element

        if (menus.length < 1) {
            await combo.click()
            menu = await workbench.$(this.locatorMap.ContextMenu.contextView as string)
            return menu
        }
        if (await menus[0].isDisplayed()) {
            await combo.click()
            // eslint-disable-next-line wdio/no-pause
            await browser.pause(200)
        }
        await combo.click()
        menu = await workbench.$(this.locatorMap.ContextMenu.contextView as string)
        return menu
    }
}

export interface TextSetting extends IPageDecorator<typeof SettingsEditorLocators> {}
/**
 * Setting with a text box input
 *
 * @category Editor
 */
@PageDecorator(SettingsEditorLocators)
export class TextSetting extends Setting {
    /**
     * @private
     */
    public locatorKey = 'SettingsEditor' as const

    async getValue (): Promise<string> {
        return this.textSetting$.getAttribute('value')
    }

    async setValue (value: string): Promise<void> {
        const input = await this.textSetting$
        await input.setValue(value)
    }
}

export interface TextSetting extends IPageDecorator<typeof SettingsEditorLocators> {}
/**
 * Setting with a checkbox
 *
 * @category Editor
 */
@PageDecorator(SettingsEditorLocators)
export class CheckboxSetting extends Setting {
    /**
     * @private
     */
    public locatorKey = 'SettingsEditor' as const

    async getValue (): Promise<boolean> {
        const checked = await this.checkboxSetting$.getAttribute(this.locators.checkboxChecked)
        if (checked === 'true') {
            return true
        }
        return false
    }

    async setValue (value: boolean): Promise<void> {
        if (await this.getValue() !== value) {
            await this.checkboxSetting$.click()
        }
    }
}

export interface LinkSetting extends IPageDecorator<typeof SettingsEditorLocators> {}
/**
 * Setting with no value, with a link to settings.json instead
 *
 * @category Editor
 */
@PageDecorator(SettingsEditorLocators)
export class LinkSetting extends Setting {
    /**
     * @private
     */
    public locatorKey = 'SettingsEditor' as const

    getValue (): Promise<string> {
        throw new Error('Method getValue is not available for LinkSetting')
    }

    setValue (): Promise<void> {
        throw new Error('Method setValue is not available for LinkSetting')
    }

    /**
     * Open the link that leads to the value in settings.json
     * @returns Promise resolving when the link has been clicked
     */
    async openLink (): Promise<void> {
        await this.linkButton$.click()
    }
}
