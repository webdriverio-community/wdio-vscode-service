import type { ChainablePromiseElement } from 'webdriverio'

import { BottomBarPanel } from '..'
import {
    BasePage, ElementWithContextMenu, PageDecorator, IPageDecorator, VSCodeLocatorMap
} from '../utils'
import { ProblemsView as ProblemsViewLocators, Marker as MarkerLocators } from '../../locators/1.73.0'

export interface ProblemsView extends IPageDecorator<typeof ProblemsViewLocators> {}
/**
 * Problems view in the bottom panel.
 *
 * ```ts
 * const bottomBar = workbench.getBottomBar()
 * const outputView = await bottomBar.openProblemsView()
 * console.log(await outputView.setFilter('Error'))
 * ```
 *
 * @category BottomBar
 */
@PageDecorator(ProblemsViewLocators)
export class ProblemsView extends BasePage<typeof ProblemsViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'ProblemsView' as const

    constructor (
        locators: VSCodeLocatorMap,
        public panel = new BottomBarPanel(locators)
    ) {
        super(locators)
        this.setParentElement(this.panel.elem)
    }

    /**
     * Set the filter using the input box on the problems view
     * @param pattern filter to use, preferably a glob pattern
     * @returns Promise resolving when the filter pattern is filled in
     */
    async setFilter (pattern: string): Promise<void> {
        const filterField = await this.clearFilter()
        await filterField.setValue(pattern)
    }

    /**
     * Clear all filters
     * @returns Promise resolving to the filter field WebElement
     */
    async clearFilter () {
        const filterField = await this.panel.elem
            .$(this.locatorMap.BottomBarPanel.actions as string)
            .$(this.locators.markersFilter)
            .$(this.locators.input)
        await filterField.clearValue()
        return filterField
    }

    /**
     * Collapse all collapsible markers in the problems view
     * @returns Promise resolving when the collapse all button is pressed
     */
    async collapseAll (): Promise<void> {
        const button = await this.panel.elem
            .$(this.locatorMap.BottomBarPanel.actions as string)
            .$(this.locators.collapseAll)
        await button.click()
    }

    /**
     * @deprecated The method should not be used and getAllVisibleMarkers() should be used instead.
     */
    async getAllMarkers (): Promise<Marker[]> {
        return this.getAllVisibleMarkers(MarkerType.Any)
    }

    /**
     * Get all visible markers from the problems view with the given type.
     * Warning: this only returns the markers that are visible, and not the
     * entire list, so calls to this function may change depending on the
     * environment  in which the tests are running in.
     * To get all markers regardless of type, use MarkerType.Any
     * @param type type of markers to retrieve
     * @returns Promise resolving to array of Marker objects
     */
    async getAllVisibleMarkers (type: MarkerType): Promise<Marker[]> {
        const markers: Marker[] = []
        const elements = await this.markerRow$$
        for (const element of elements) {
            const isExpandable = typeof (await element.getAttribute('aria-expanded')) === 'string'
            if (isExpandable) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const marker = await new Marker(this.locatorMap, element as any, this).wait()
                if (type === MarkerType.Any || type === await marker.getType()) {
                    markers.push(marker)
                }
                continue
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            markers[markers.length - 1].problems.push(new Problem(this.locatorMap, element as any))
        }
        return markers
    }

    /**
     * Gets the count badge
     * @returns Promise resolving to the WebElement representing the count badge
     */
    getCountBadge (): Promise<WebdriverIO.Element> {
        return this.changeCount$
    }
}

export interface Marker extends IPageDecorator<typeof MarkerLocators> {}
/**
 * Page object for marker in problems view
 *
 * @category BottomBar
 */
@PageDecorator(MarkerLocators)
export class Marker extends ElementWithContextMenu<typeof MarkerLocators> {
    /**
     * @private
     */
    public locatorKey = 'Marker' as const
    public problems: Problem[] = []

    constructor (
        locators: VSCodeLocatorMap,
        element: ChainablePromiseElement<WebdriverIO.Element>,
        public view: ProblemsView
    ) {
        super(locators, element, view.elem)
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     * @returns Promise resolving to a MarkerType
     */
    async getType (): Promise<MarkerType> {
        const twist = await this.elem.$(this.locatorMap.ProblemsView.markerTwistie as string)
        if ((await twist.getAttribute('class')).indexOf('collapsible') > -1) {
            return MarkerType.File
        }
        const text = await this.getText()
        if (text.startsWith('Error')) {
            return MarkerType.Error
        }

        return MarkerType.Warning
    }

    /**
     * Get the name of the file that has problems
     * @returns name of file containing problems
     */
    getFileName (): Promise<string> {
        return this.fileName$.getText()
    }

    /**
     * Get the error count of the file that has problems
     * @returns error count of file containing problems
     */
    getProblemCount (): Promise<string> {
        return this.problemCount$.getText()
    }

    /**
     * Get the full text of the marker
     * @returns Promise resolving to marker text
     */
    async getText (): Promise<string> {
        return this.elem.getAttribute(this.locators.rowLabel)
    }

    /**
     * Expand/Collapse the marker if possible
     * @param expand true to expand, false to collapse
     * @returns Promise resolving when the expand/collapse twistie is clicked
     */
    async toggleExpand (expand: boolean): Promise<void> {
        const klass = await this.markerTwistie$.getAttribute('class')
        if ((klass.indexOf('collapsed') > -1) === expand) {
            await this.elem.click()
        }
    }
}

export interface Problem extends IPageDecorator<typeof MarkerLocators> {}
/**
 * Page object for marker in problems view
 *
 * @category BottomBar
 */
@PageDecorator(MarkerLocators)
export class Problem extends ElementWithContextMenu<typeof MarkerLocators> {
    /**
     * @private
     */
    public locatorKey = 'Marker' as const

    /**
     * Problem details
     * @returns problem description
     */
    getText () {
        return this.detailsText$.getText()
    }

    /**
     * Type of file where the problem is located
     * @returns source file type
     */
    getSource () {
        return this.detailsSource$.getText()
    }

    /**
     * Location problem
     * @returns location of error as Array [line, column]
     */
    async getLocation () {
        const locationText = await this.detailsLine$.getText()
        return locationText
            .slice(1, -1)
            .split(',')
            .map((loc) => parseInt(loc.split(' ').pop() as string, 10))
    }

    /**
     * Get the type of the marker
     * Possible types are: File, Error, Warning
     * @returns Promise resolving to a MarkerType
     */
    async getType (): Promise<MarkerType> {
        const label = await this.elem.getAttribute('aria-label')
        if (!label) {
            return MarkerType.Unknown
        }
        if (label.startsWith('Error')) {
            return MarkerType.Error
        }
        return MarkerType.Warning
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
    Unknown = 'unknown',
    Error = 'error',
    Warning = 'warning',
    Any = 'any'
}
