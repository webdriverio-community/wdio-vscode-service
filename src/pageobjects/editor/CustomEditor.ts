import { WebView } from './WebView';
import { Editor } from './Editor';
import { InputBox } from "../workbench/Input";
import { PluginDecorator, IPluginDecorator } from "../utils";
import { Editor as EditorLocators } from '../../locators/1.61.0'

/**
 * Page object for custom editors
 */
export interface CustomEditor extends IPluginDecorator<typeof EditorLocators> {}
@PluginDecorator(EditorLocators)
export class CustomEditor extends Editor<typeof EditorLocators> {
    public locatorKey = 'Editor' as const

    /**
     * Get the WebView object contained in the editor
     * @returns WebView page object
     */
    getWebView(): WebView {
        return new WebView(this.locatorMap);
    }

    /**
     * Check if the editor has unsaved changes
     * @returns Promise resolving to true if there are unsaved changes, false otherwise
     */
    async isDirty(): Promise<boolean> {
        const tab = await this.getTab();
        const klass = await tab.elem.getAttribute('class');
        return klass.includes('dirty');
    }

    /**
     * Save the editor
     */
    async save(): Promise<void> {
        const tab = await this.getTab();
        await tab.elem.addValue(['Control', 's']);
    }

    /**
     * Open the Save as prompt
     * 
     * @returns InputBox serving as a simple file dialog
     */
    async saveAs(): Promise<InputBox> {
        const tab = await this.getTab();
        await tab.elem.addValue(['Control', 'Shift', 's']);
        const inputBox = browser.$(this.locatorMap.InputBox.elem as string);
        await inputBox.waitForExist({ timeout: 5000 })
        return new InputBox(this.locatorMap);
    }
}