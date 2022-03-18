import { ViewTitlePart } from "./ViewTitlePart";
import { ViewContent } from './ViewContent';
import { PluginDecorator, IPluginDecorator, BasePage, LocatorComponents } from '../utils'
import { SideBarView as SideBarViewLocators } from '../../locators/1.61.0';

/**
 * Page object for the side bar view
 */
export interface SideBarView<T> extends IPluginDecorator<typeof SideBarViewLocators> { }
@PluginDecorator(SideBarViewLocators)
export class SideBarView<T> extends BasePage<T> {
    public locatorKey = 'SideBarView' as LocatorComponents

    /**
     * Get the top part of the open view (contains title and possibly some buttons)
     * @returns ViewTitlePart object
     */
    getTitlePart(): ViewTitlePart {
        return new ViewTitlePart(this.locatorMap, this);
    }

    /**
     * Get the content part of the open view
     * @returns ViewContent object
     */
    getContent(): ViewContent {
        return new ViewContent(this.locatorMap, this);
    }
}