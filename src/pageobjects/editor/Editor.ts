import { ChainablePromiseElement } from 'webdriverio'

import { EditorView, EditorGroup, EditorTab } from '..'
import { ElementWithContextMenu, VSCodeLocatorMap } from '../utils'
import {
    Editor as EditorLocatorsMap,
    SettingsEditor as SettingsEditorLocators,
    TextEditor as TextEditorLocators,
    DiffEditor as DiffEditorLocators,
    EditorView as EditorViewLocators
} from '../../locators/1.73.0'

/**
 * @hidden
 */
export type EditorLocators = (
    typeof EditorLocatorsMap &
    typeof SettingsEditorLocators &
    typeof TextEditorLocators &
    typeof DiffEditorLocators &
    typeof EditorViewLocators
)

/**
 * Abstract representation of an editor tab
 *
 * @category Editor
 */
export abstract class Editor<T> extends ElementWithContextMenu<T> {
    constructor (
        locators: VSCodeLocatorMap,
        element?: ChainablePromiseElement<WebdriverIO.Element> | string,
        public view: EditorView | EditorGroup = new EditorView(locators)
    ) {
        super(locators, element)
        this.setParentElement(this.view.elem)
    }

    /**
     * Get title/name of the open editor
     */
    async getTitle (): Promise<string> {
        const tab = await this.getTab()
        return tab.getTitle()
    }

    /**
     * Get the corresponding editor tab
     */
    async getTab (): Promise<EditorTab> {
        const element = this.view
        return element.getActiveTab() as Promise<EditorTab>
    }
}
