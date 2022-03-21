import { TreeItem, ViewItemLocators } from "../../ViewItem";
import { TreeSection } from "../TreeSection";

import { PluginDecorator, IPluginDecorator, LocatorMap } from '../../../utils'
import { DefaultTreeItem as DefaultTreeItemLocators } from '../../../../locators/1.61.0';
import { ChainablePromiseElement } from "webdriverio";

export interface DefaultTreeItem extends IPluginDecorator<ViewItemLocators> { }
/**
 * Default tree item base on the items in explorer view
 *
 * @category Sidebar
 */
@PluginDecorator(DefaultTreeItemLocators)
export class DefaultTreeItem extends TreeItem {
    /**
     * @private
     */
    public locatorKey = 'DefaultTreeItem' as const

    constructor(
        locators: LocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public viewPart: TreeSection
    ) {
        super(locators, element, viewPart.elem);
    }

    async getLabel(): Promise<string> {
        return this.elem.getAttribute(this.locatorMap.DefaultTreeSection.itemLabel as string);
    }

    async getTooltip(): Promise<string> {
        return this.tooltip$.getAttribute('title');
    }

    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.twistie$.getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

    async getChildren(): Promise<TreeItem[]> {
        const rows = await this.getChildItems(this.locatorMap.DefaultTreeSection.itemRow as string);
        const items = await Promise.all(
            rows.map(async row => (
                new DefaultTreeItem(this.locatorMap, row as any, this.viewPart as TreeSection).wait()
            ))
        );
        return items;
    }

    async isExpandable(): Promise<boolean> {
        const twistieClass = await this.twistie$.getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }
}