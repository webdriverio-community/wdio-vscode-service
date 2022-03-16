import { Editor } from './Editor';
import { TextEditor } from './TextEditor';
import { EditorView } from './EditorView';
import { PluginDecorator, IPluginDecorator } from "../utils";
import { editor } from '../../locators/1.61.0'

/**
 * Page object representing a diff editor
 */
export interface DiffEditor extends IPluginDecorator<typeof editor.DiffEditor> {}
@PluginDecorator(editor.DiffEditor)
export class DiffEditor extends Editor {
    /**
     * Gets the text editor corresponding to the originalside.
     * (The left side of the diff editor)
     * @returns Promise resolving to TextEditor object
     */
    async getOriginalEditor(): Promise<TextEditor> {
        // const element = await this.view.$(this.locators.originalEditor);
        return new TextEditor(
            this.locatorMap.editor.TextEditor,
            new EditorView(this.locatorMap.editor.EditorView),
            /**
             * ToDo(Christian): check if parent is needed
             */
            // element.elem
        );
    }

    /**
     * Gets the text editor corresponding to the modified side.
     * (The right side of the diff editor)
     * @returns Promise resolving to TextEditor object
     */
    async getModifiedEditor(): Promise<TextEditor> {
        // const element = await this.view.$(this.locators.modifiedEditor);
        return new TextEditor(
            this.locatorMap.editor.TextEditor,
            new EditorView(this.locatorMap.editor.EditorView),
            // element
        );
    }
}