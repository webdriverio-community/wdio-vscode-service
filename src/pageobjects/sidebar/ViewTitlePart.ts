import { ElementWithContextMenu, PluginDecorator, IPluginDecorator, BasePage } from '../utils'
import { SideBarView } from './SideBarView'
import { sideBar } from 'locators/1.61.0';

/**
 * Page object representing the top (title) part of a side bar view
 */
export interface ViewTitlePart extends IPluginDecorator<typeof sideBar.ViewTitlePart> { }
@PluginDecorator(sideBar.ViewTitlePart)
export class ViewTitlePart extends ElementWithContextMenu {
    public view: SideBarView

    constructor(
        locators: typeof sideBar.ViewTitlePart,
        view: SideBarView
    ) {
        super(locators);
        this.view = view || new SideBarView(this.locatorMap.sideBar.SideBarView)
    }

    /**
     * Returns the displayed title of the view
     * @returns Promise resolving to displayed title
     */
    async getTitle(): Promise<string> {
        return await this.title$.getText();
    }

    /**
     * Finds action buttons inside the view title part
     * @returns Promise resolving to array of TitleActionButton objects
     */
    async getActions(): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = [];
        const elements = await this.action$$;
        for (const element of elements) {
            const title = await element.getAttribute(this.locators.actionLabel);
            actions.push(await new TitleActionButton(this.locators, title, this).wait());
        }
        return actions;
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     * @returns Promise resolving to TitleActionButton object
     */
    async getAction(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(this.locators, title, this);
    }
}

/**
 * Page object representing a button inside the view title part
 */
export interface ViewTitlePart extends IPluginDecorator<typeof sideBar.ViewTitlePart> { }
export class TitleActionButton extends BasePage {
    constructor(locators: typeof sideBar.ViewTitlePart, private title: string, viewTitle: ViewTitlePart) {
        super(locators, locators.actionContstructor(title), viewTitle.elem);
        this.title = title;
    }

    /**
     * Get title of the button
     */
    getTitle(): string {
        return this.title;
    }
}