import { EditorView, EditorGroup, EditorTab } from './EditorView'
import { ElementWithContextMenu, IPluginDecorator } from '../utils'
import { Locators } from "../../types";
import { editor } from 'locators/1.61.0';
import { ChainablePromiseElement } from 'webdriverio';

export type EditorLocators = (
    typeof editor.Editor &
    typeof editor.SettingsEditor &
    typeof editor.TextEditor &
    typeof editor.DiffEditor &
    typeof editor.WebView
)

/**
 * Abstract representation of an editor tab
 */
export interface Editor extends IPluginDecorator<EditorLocators> { }
export abstract class Editor extends ElementWithContextMenu {
    public view: EditorView | EditorGroup
    constructor(
        locators: Locators,
        element?: ChainablePromiseElement<WebdriverIO.Element> | string,
        view?: EditorView | EditorGroup
    ) {
        super(locators, element, view?.elem);
        this.view = view || new EditorView(this.locatorMap.editor.EditorView)
        this.setParentElement(this.view.elem)
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