import { EditorView, EditorGroup, EditorTab } from './EditorView'
import { ElementWithContextMenu } from '../utils'
import { Locators } from "../../types";

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor extends ElementWithContextMenu {
    public view: EditorView | EditorGroup
    constructor(
        locators: Locators,
        view: EditorView | EditorGroup
    ) {
        super(locators, locators.elem as string);

        // @ts-expect-error
        this.view = view || new EditorView(this.locatorMap.editor.EditorView)
    }

    /**
     * Get title/name of the open editor
     */
    async getTitle(): Promise<string> {
        const tab = await this.getTab();
        return tab.getTitle();
    }

    /**
     * Get the corresponding editor tab
     */
    async getTab(): Promise<EditorTab> {
        const element = this.view as EditorView | EditorGroup;
        return element.getActiveTab() as Promise<EditorTab>;
    }
}