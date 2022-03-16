import { ViewSection } from './ViewSection'
import { BasePage, PluginDecorator, IPluginDecorator } from '../utils'
import { welcome } from 'locators/1.61.0'
import { ChainablePromiseElement } from "webdriverio";

/**
 * A button that appears in the welcome content and can be clicked to execute a command.
 *
 * To execute the command bound to this button simply run: `await button.click();`.
 */
export interface WelcomeContentButton extends IPluginDecorator<typeof welcome.WelcomeContent> {}
@PluginDecorator(welcome.WelcomeContent)
export class WelcomeContentButton extends BasePage {
    /**
     * @param panel  The panel containing the button in the welcome section
     * @param welcomeSection  The enclosing welcome section
     */
    constructor(
        locators: typeof welcome.WelcomeContent,
        panel: ChainablePromiseElement<WebdriverIO.Element>,
        public welcomeSection: WelcomeContentSection
    ) {
        super(locators, panel);
    }

    /** Return the title displayed on this button */
    public getTitle(): Promise<string> {
        return this.elem.getText();
    }
}

/**
 * A section in an empty custom view, see:
 * https://code.visualstudio.com/api/extension-guides/tree-view#welcome-content
 *
 * The welcome section contains two types of elements: text entries and buttons that can be bound to commands.
 * The text sections can be accessed via [[getTextSections]], the buttons on the
 * other hand via [[getButtons]].
 * This however looses the information of the order of the buttons and lines
 * with respect to each other. This can be remedied by using [[getContents]],
 * which returns both in the order that they are found (at the expense, that you
 * now must use typechecks to find out what you got).
 */
export interface WelcomeContentSection extends IPluginDecorator<typeof welcome.WelcomeContent> {}
@PluginDecorator(welcome.WelcomeContent)
export class WelcomeContentSection extends BasePage {
    /**
     * @param panel  The panel containing the welcome content.
     * @param parent  The webelement in which the welcome content is embedded.
     */
    constructor(
        locators: typeof welcome.WelcomeContent,
        panel: ChainablePromiseElement<WebdriverIO.Element>,
        parent: ViewSection
    ) {
        super(locators, panel, parent.elem);
    }

    /**
     * Combination of [[getButtons]] and [[getTextSections]]: returns all entries in the welcome view in the order that they appear.
     */
    public async getContents(): Promise<(WelcomeContentButton|string)[]> {
        const elements = await this.buttonOrText$$;
        return Promise.all(elements.map(async (e) => {
            const tagName = await e.getTagName();
            if (tagName === "p") {
                return e.getText();
            } else {
                return new WelcomeContentButton(this.locators, e as any, this);
            }
        }));
    }

    /** Finds all buttons in the welcome content */
    public getButtons(): Promise<WelcomeContentButton[]> {
        return this.button$$.map((elem) => new WelcomeContentButton(this.locators, elem as any, this));
    }

    /**
     * Finds all text entries in the welcome content and returns each line as an
     * element in an array.
     */
    public getTextSections(): Promise<string[]> {
        return this.text$$.map((elem) => elem.getText())
    }
}
