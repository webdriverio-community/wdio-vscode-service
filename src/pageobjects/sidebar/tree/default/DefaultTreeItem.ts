import { TreeItem, TreeItemLocators } from "../../ViewItem";
import { TreeSection } from "../TreeSection";

import { PluginDecorator, IPluginDecorator } from '../../../utils'
import { sideBar } from 'locators/1.61.0';
import { ChainablePromiseElement } from "webdriverio";

/**
 * Default tree item base on the items in explorer view
 */
export interface DefaultTreeItem extends IPluginDecorator<TreeItemLocators> { }
@PluginDecorator(sideBar.DefaultTreeItem)
export class DefaultTreeItem extends TreeItem {
    constructor(
        locators: typeof sideBar.DefaultTreeItem,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public viewPart: TreeSection
    ) {
        super(locators, element, viewPart.elem);
    }

    async getLabel(): Promise<string> {
        return this.elem.getAttribute(this.locatorMap.sideBar.DefaultTreeSection.itemLabel);
    }

    async getTooltip(): Promise<string> {
        return this.tooltip$.getAttribute('title');
    }

    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.twistie$.getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

    async getChildren(): Promise<TreeItem[]> {
        const rows = await this.getChildItems(this.locatorMap.sideBar.DefaultTreeSection.itemRow);
        const items = await Promise.all(
            rows.map(async row => (
                new DefaultTreeItem(this.locatorMap.sideBar.DefaultTreeItem, row as any, this.viewPart as TreeSection).wait()
            ))
        );
        return items;
    }

    async isExpandable(): Promise<boolean> {
        const twistieClass = await this.twistie$.getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }
}