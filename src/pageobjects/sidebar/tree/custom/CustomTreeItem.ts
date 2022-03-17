import { TreeItem, TreeItemLocators } from "../../ViewItem";
import { TreeSection } from "../TreeSection";

import { PluginDecorator, IPluginDecorator } from '../../../utils'
import { sideBar } from 'locators/1.61.0';
import { ChainablePromiseElement } from "webdriverio";

/**
 * View item in a custom-made content section (e.g. an extension tree view)
 */
export interface CustomTreeItem extends IPluginDecorator<TreeItemLocators> { }
@PluginDecorator(sideBar.CustomTreeItem)
export class CustomTreeItem extends TreeItem {
    constructor(
        locators: typeof sideBar.CustomTreeItem,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public viewPart: TreeSection
    ) {
        super(locators, element, viewPart.elem);
    }

    async getLabel(): Promise<string> {
        return this.elem.$(this.locatorMap.sideBar.CustomTreeSection.itemLabel).getText();
    }

    async getTooltip(): Promise<string> {
        return this.elem.getAttribute(this.locators.tooltipAttribute);
    }

    async getDescription(): Promise<string> {
        return this.description$.getText();
    }

    async isExpanded(): Promise<boolean> {
        const attr = await this.elem.getAttribute(this.locators.expandedAttr);
        return attr === this.locators.expandedValue;
    }

    async getChildren(): Promise<TreeItem[]> {
        const rows = await this.getChildItems(this.locatorMap.sideBar.DefaultTreeSection.itemRow);
        const items = await Promise.all(
            rows.map(async row => (
                new CustomTreeItem(this.locators, row as any, this.viewPart as TreeSection).wait()
            ))
        );
        return items;
    }

    async isExpandable(): Promise<boolean> {
        const attr = await this.elem.getAttribute(this.locators.expandedAttr);
        return attr !== null;
    }
}