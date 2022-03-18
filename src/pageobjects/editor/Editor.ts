import { ChainablePromiseElement } from 'webdriverio';

import { EditorView, EditorGroup, EditorTab } from './EditorView'
import { ElementWithContextMenu, LocatorMap } from '../utils'
import {
    Editor as EditorLocators,
    SettingsEditor as SettingsEditorLocators,
    TextEditor as TextEditorLocators,
    DiffEditor as DiffEditorLocators,
    EditorView as EditorViewLocators,
    WebView as WebViewLocators
} from '../../locators/1.61.0'

export type EditorLocators = (
    typeof EditorLocators &
    typeof SettingsEditorLocators &
    typeof TextEditorLocators &
    typeof DiffEditorLocators &
    typeof WebViewLocators &
    typeof EditorViewLocators
)

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor<T> extends ElementWithContextMenu<T> {
    constructor(
        locators: LocatorMap,
        element?: ChainablePromiseElement<WebdriverIO.Element> | string,
        public view: EditorView | EditorGroup = new EditorView(locators)
    ) {
        super(locators, element);
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