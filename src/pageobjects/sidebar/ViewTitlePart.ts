import { ElementWithContextMenu, PluginDecorator, IPluginDecorator, BasePage, LocatorMap } from '../utils'
import { SideBarView } from './SideBarView'
import { ViewTitlePart as ViewTitlePartLocators } from '../../locators/1.61.0';

/**
 * Page object representing the top (title) part of a side bar view
 */
export interface ViewTitlePart extends IPluginDecorator<typeof ViewTitlePartLocators> { }
@PluginDecorator(ViewTitlePartLocators)
export class ViewTitlePart extends ElementWithContextMenu<typeof ViewTitlePartLocators> {
    public locatorKey = 'ViewTitlePart' as const

    constructor(
        locators: LocatorMap,
        public view: SideBarView<any> = new SideBarView(locators)
    ) {
        super(locators);
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
            actions.push(await new TitleActionButton(this.locatorMap, title, this).wait());
        }
        return actions;
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     * @returns Promise resolving to TitleActionButton object
     */
    async getAction(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(this.locatorMap, title, this);
    }
}

/**
 * Page object representing a button inside the view title part
 */
export interface ViewTitlePart extends IPluginDecorator<typeof ViewTitlePartLocators> { }
@PluginDecorator(ViewTitlePartLocators)
export class TitleActionButton extends BasePage<typeof ViewTitlePartLocators> {
    public locatorKey = 'ViewTitlePart' as const

    constructor(locators: LocatorMap, private title: string, viewTitle: ViewTitlePart) {
        super(locators, (locators['ViewTitlePart'].actionContstructor as Function)(title), viewTitle.elem);
        this.title = title;
    }

    /**
     * Get title of the button
     */
    getTitle(): string {
        return this.title;
    }
}