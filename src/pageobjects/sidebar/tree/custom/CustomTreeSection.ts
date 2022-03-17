import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../ViewItem";
import { CustomTreeItem } from "./CustomTreeItem";
import { ViewSectionLocators } from '../../ViewSection'

import { PluginDecorator, IPluginDecorator } from '../../../utils'
import { sideBar } from 'locators/1.61.0';

/**
 * Custom tree view, e.g. contributed by an extension
 */
export interface CustomTreeSection extends IPluginDecorator<ViewSectionLocators> { }
@PluginDecorator(sideBar.CustomTreeSection)
export class CustomTreeSection extends TreeSection {

    async getVisibleItems(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const elements = await this.itemRow$$;
        for (const element of elements) {
            items.push(await new CustomTreeItem(this.locatorMap.sideBar.CustomTreeItem, element as any, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        
        const container = await this.rowContainer$
        await container.waitForExist({ timeout: 5000 })
        
        await container.addValue(['Home']);
        let item: TreeItem | undefined = undefined;
        
        const elements = await container.$$(this.locators.itemRow);
        for (const element of elements) {
            const temp = await element.$$(this.locators.rowWithLabel(label));
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(this.locatorMap.sideBar.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = await new CustomTreeItem(this.locatorMap.sideBar.CustomTreeItem, element as any, this).wait();
                } 
            }
        }            
        return item;
    }
}