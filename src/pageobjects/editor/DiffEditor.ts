import { Editor, EditorLocators } from './Editor.js'
import { TextEditor } from './TextEditor.js'
import { EditorView } from './EditorView.js'
import { PageDecorator, IPageDecorator } from '../utils.js'
import { DiffEditor as DiffEditorLocators } from '../../locators/1.73.0.js'

export interface DiffEditor extends IPageDecorator<EditorLocators> {}
/**
 * Page object representing a diff editor
 *
 * @category Editor
 */
@PageDecorator(DiffEditorLocators)
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
        return new TextEditor(
            this.locatorMap,
            element,
            new EditorView(this.locatorMap)
        ).wait()
    }

    /**
     * Gets the text editor corresponding to the modified side.
     * (The right side of the diff editor)
     * @returns Promise resolving to TextEditor object
     */
    async getModifiedEditor (): Promise<TextEditor> {
        const element = this.view.elem.$(this.locators.modifiedEditor)
        return new TextEditor(
            this.locatorMap,
            element,
            new EditorView(this.locatorMap)
        ).wait()
    }
}
