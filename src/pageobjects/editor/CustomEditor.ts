import { Key } from 'webdriverio'

import { Editor, InputBox } from '../index.js'
import { PageDecorator, IPageDecorator } from '../utils.js'
import { Editor as EditorLocators } from '../../locators/1.73.0.js'
import { CMD_KEY } from '../../constants.js'

export interface CustomEditor extends IPageDecorator<typeof EditorLocators> {}
/**
 * Page object for custom editors
 *
 * @category Editor
 */
@PageDecorator(EditorLocators)
export class CustomEditor extends Editor<typeof EditorLocators> {
    /**
     * @private
     */
    public locatorKey = 'Editor' as const

    /**
     * Check if the editor has unsaved changes
     * @returns Promise resolving to true if there are unsaved changes, false otherwise
     */
    async isDirty (): Promise<boolean> {
        const tab = await this.getTab()
        const klass = await tab.elem.getAttribute('class')
        return klass.includes('dirty')
    }

    /**
     * Save the editor
     */
    async save (): Promise<void> {
        const tab = await this.getTab()
        await tab.elem.click()
        await browser.action('key')
            .down(CMD_KEY).down('s')
            .up(CMD_KEY).up('s')
            .perform()
    }

    /**
     * Open the Save as prompt
     *
     * @returns InputBox serving as a simple file dialog
     */
    async saveAs (): Promise<InputBox> {
        const tab = await this.getTab()

        await tab.elem.click()
        await browser.action('key')
            .down(CMD_KEY).down(Key.Shift).down('s')
            .up(CMD_KEY).down(Key.Shift).up('s')
            .perform()

        const inputBox = browser.$(this.locatorMap.InputBox.elem as string)
        await inputBox.waitForExist({ timeout: 5000 })
        return new InputBox(this.locatorMap)
    }
}
