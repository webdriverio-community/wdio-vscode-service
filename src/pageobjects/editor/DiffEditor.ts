import { Editor, EditorLocators } from './Editor'
import { TextEditor } from './TextEditor'
import { EditorView } from './EditorView'
import { PluginDecorator, IPluginDecorator } from '../utils'
import { DiffEditor as DiffEditorLocators } from '../../locators/1.61.0'

export interface DiffEditor extends IPluginDecorator<EditorLocators> {}
/**
 * Page object representing a diff editor
 *
 * @category Editor
 */
@PluginDecorator(DiffEditorLocators)
export class DiffEditor extends Editor<EditorLocators> {
    /**
     * @private
     */
    public locatorKey = 'DiffEditor' as const

    /**
     * Gets the text editor corresponding to the originalside.
     * (The left side of the diff editor)
     * @returns Promise resolving to TextEditor object
     */
    getOriginalEditor (): Promise<TextEditor> {
        const element = this.view.elem.$(this.locators.originalEditor)
        return this.load(
            TextEditor,
            element,
            this.load(EditorView)
        ).wait()
    }

    /**
     * Gets the text editor corresponding to the modified side.
     * (The right side of the diff editor)
     * @returns Promise resolving to TextEditor object
     */
    async getModifiedEditor (): Promise<TextEditor> {
        const element = this.view.elem.$(this.locators.modifiedEditor)
        return this.load(
            TextEditor,
            element,
            this.load(EditorView)
        ).wait()
    }
}
