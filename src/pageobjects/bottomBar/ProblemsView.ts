import type { ChainablePromiseElement } from "webdriverio";

import { BottomBarPanel } from "./BottomBarPanel";
import { BasePage, ElementWithContextMenu, PluginDecorator, IPluginDecorator } from "../utils";
import { bottomBar } from '../../locators/1.61.0'

/**
 * Problems view in the bottom panel
 */
export interface ProblemsView extends IPluginDecorator<typeof bottomBar.ProblemsView> {}
@PluginDecorator(bottomBar.ProblemsView)
export class ProblemsView extends BasePage {
    public panel: BottomBarPanel

    constructor(locators: typeof bottomBar.ProblemsView) {
        super(locators, locators.elem);
        this.panel = new BottomBarPanel(this.locatorMap.bottomBar.BottomBarPanel)
    }

    /**
     * Set the filter using the input box on the problems view
     * @param pattern filter to use, prefferably a glob pattern
     * @returns Promise resolving when the filter pattern is filled in
     */
    async setFilter(pattern: string): Promise<void> {
        const filterField = await this.clearFilter();
        await filterField.setValue(pattern);
    }

    /**
     * Clear all filters
     * @returns Promise resolving to the filter field WebElement 
     */
    async clearFilter() {
        const filterField = await this.panel.elem
            .$(this.locatorMap.bottomBar.BottomBarPanel.actions)
            .$(this.locators.markersFilter)
            .$(this.locators.input);
        await filterField.clearValue();
        return filterField;
    }

    /**
     * Collapse all collapsible markers in the problems view
     * @returns Promise resolving when the collapse all button is pressed
     */
    async collapseAll(): Promise<void> {
        const button = await this.panel.elem
            .$(this.locatorMap.bottomBar.BottomBarPanel.actions)
            .$(this.locators.collapseAll);
        await button.click();
    }

    /**
     * Get all markers from the problems view with the given type.
     * To get all markers regardless of type, use MarkerType.Any
     * @param type type of markers to retrieve
     * @returns Promise resolving to array of Marker objects
     */
    async getAllMarkers(type: MarkerType): Promise<Marker[]> {
        const markers: Marker[] = [];
        const elements = await this.elem.$$(this.locators.markerRow);
        for (const element of elements) {
            const marker = await new Marker(this.locators, element as any, this).wait();
            if (type === MarkerType.Any || type === await marker.getType()) {
                markers.push(marker);
            }
        }
        return markers;
    }
}

/**
 * Page object for marker in problems view
 */
export interface Marker extends IPluginDecorator<typeof bottomBar.ProblemsView> {}
@PluginDecorator(bottomBar.ProblemsView)
export class Marker extends ElementWithContextMenu {
    constructor(
        locators: typeof bottomBar.ProblemsView,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public view: ProblemsView
    ) {
        super(locators, element);
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     * @returns Promise resolving to a MarkerType
     */
    async getType(): Promise<MarkerType> {
        const twist = await this.elem.$(this.locators.markerTwistie);
        if ((await twist.getAttribute('class')).indexOf('collapsible') > -1) {
            return MarkerType.File;            
        }
        const text = await this.getText();
        if (text.startsWith('Error')) {
            return MarkerType.Error;
        } else {
            return MarkerType.Warning;
        }
    }

    /**
     * Get the full text of the marker
     * @returns Promise resolving to marker text
     */
    async getText(): Promise<string> {
        return await this.elem.getAttribute(this.locators.rowLabel);
    }

    /**
     * Expand/Collapse the marker if possible
     * @param expand true to expand, false to collapse
     * @returns Promise resolving when the expand/collapse twistie is clicked
     */
    async toggleExpand(expand: boolean): Promise<void> {
        if (await this.getType() === MarkerType.File) {
            const klass = await this.elem.$(this.locators.markerTwistie).getAttribute('class');
            if ((klass.indexOf('collapsed') > -1) === expand) {
                await this.elem.click();
            }
        }
    }
}

/**
 * Possible types of markers
 *  - File = expandable item representing a file
 *  - Error = an error marker
 *  - Warning = a warning marker
 *  - Any = any of the above
 */
export enum MarkerType {
    File = 'file',
    Error = 'error',
    Warning = 'warning',
    Any = 'any'
}