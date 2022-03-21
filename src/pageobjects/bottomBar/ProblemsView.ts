import type { ChainablePromiseElement } from "webdriverio";

import { BottomBarPanel } from "..";
import { BasePage, ElementWithContextMenu, PluginDecorator, IPluginDecorator, LocatorMap } from "../utils";
import { ProblemsView as ProblemsViewLocators } from '../../locators/1.61.0'

export interface ProblemsView extends IPluginDecorator<typeof ProblemsViewLocators> {}
/**
 * Problems view in the bottom panel.
 * 
 * ```ts
 * const bottomBar = workbench.getBottomBar()
 * const outputView = await bottomBar.openProblemsView()
 * console.log(await outputView.setFilter('Error'));
 * ```
 * 
 * @category BottomBar
 */
@PluginDecorator(ProblemsViewLocators)
export class ProblemsView extends BasePage<typeof ProblemsViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ProblemsView' as const

    constructor(
        locators: LocatorMap,
        public panel = new BottomBarPanel(locators)
    ) {
        super(locators);
        this.setParentElement(this.panel.elem)
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
            .$(this.locatorMap.BottomBarPanel.actions as string)
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
            .$(this.locatorMap.BottomBarPanel.actions as string)
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
        const elements = await this.markerRow$$;
        for (const element of elements) {
            const marker = await new Marker(this.locatorMap, element as any, this).wait();
            if (type === MarkerType.Any || type === await marker.getType()) {
                markers.push(marker);
            }
        }
        return markers;
    }
}

export interface Marker extends IPluginDecorator<typeof ProblemsViewLocators> {}
/**
 * Page object for marker in problems view
 * 
 * @category BottomBar
 */
@PluginDecorator(ProblemsViewLocators)
export class Marker extends ElementWithContextMenu<typeof ProblemsViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ProblemsView' as const

    constructor(
        locators: LocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public view: ProblemsView
    ) {
        super(locators, element, view.elem);
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     * @returns Promise resolving to a MarkerType
     */
    async getType(): Promise<MarkerType> {
        const twist = await this.markerTwistie$;
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
            const klass = await this.markerTwistie$.getAttribute('class');
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
 * 
 * @hidden
 */
export enum MarkerType {
    File = 'file',
    Error = 'error',
    Warning = 'warning',
    Any = 'any'
}