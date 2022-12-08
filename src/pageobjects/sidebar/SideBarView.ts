import { ViewContent, ViewTitlePart } from '../index.js'
import {
    PageDecorator, IPageDecorator, BasePage, LocatorComponents
} from '../utils.js'
import { SideBarView as SideBarViewLocators } from '../../locators/1.73.0.js'

export interface SideBarView<T> extends IPageDecorator<typeof SideBarViewLocators> { }
/**
 * Page object for the side bar view
 *
 * @category Sidebar
 */
@PageDecorator(SideBarViewLocators)
export class SideBarView<T> extends BasePage<T> {
    /**
     * @private
     */
    public locatorKey = 'SideBarView' as LocatorComponents

    /**
     * Get the top part of the open view (contains title and possibly some buttons)
     * @returns ViewTitlePart object
     */
    getTitlePart (): ViewTitlePart {
        return new ViewTitlePart(this.locatorMap, this)
    }

    /**
     * Get the content part of the open view
     * @returns ViewContent object
     */
    getContent (): ViewContent {
        return new ViewContent(this.locatorMap, this)
    }
}
