import { Editor, InputBox, WebView } from '..'
import { PageDecorator, IPageDecorator } from '../utils'
import { Editor as EditorLocators } from '../../locators/1.61.0'
import { CMD_KEY } from '../../constants'

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
     * Get the WebView object contained in the editor
     * @returns WebView page object
     */
    getWebView (): WebView {
        return new WebView(this.locatorMap)
    }

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
        await tab.elem.addValue([CMD_KEY, 's'])
    }

    /**
     * Open the Save as prompt
     *
     * @returns InputBox serving as a simple file dialog
     */
    async saveAs (): Promise<InputBox> {
        const tab = await this.getTab()
        await tab.elem.addValue([CMD_KEY, 'Shift', 's'])
        const inputBox = browser.$(this.locatorMap.InputBox.elem as string)
        await inputBox.waitForExist({ timeout: 5000 })
        return new InputBox(this.locatorMap)
    }
}
