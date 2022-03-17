import { ViewTitlePart } from "./ViewTitlePart";
import { ViewContent } from './ViewContent';
import { PluginDecorator, IPluginDecorator, BasePage } from '../utils'
import { sideBar } from 'locators/1.61.0';

export type PageLocators = typeof sideBar.SideBarView & typeof sideBar.DebugView & typeof sideBar.ScmView

/**
 * Page object for the side bar view
 */
export interface SideBarView extends IPluginDecorator<PageLocators> { }
@PluginDecorator(sideBar.SideBarView)
export class SideBarView extends BasePage {
    /**
     * Get the top part of the open view (contains title and possibly some buttons)
     * @returns ViewTitlePart object
     */
    getTitlePart(): ViewTitlePart {
        return new ViewTitlePart(this.locatorMap.sideBar.ViewTitlePart, this);
    }

    /**
     * Get the content part of the open view
     * @returns ViewContent object
     */
    getContent(): ViewContent {
        return new ViewContent(this.locatorMap.sideBar.ViewContent, this);
    }
}