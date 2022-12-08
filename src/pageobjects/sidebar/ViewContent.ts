import { SideBarView, ViewSection } from '../index.js'
import { DefaultTreeSection } from './tree/default/DefaultTreeSection.js'
import { CustomTreeSection } from './tree/custom/CustomTreeSection.js'
import { ExtensionsViewSection } from './extensions/ExtensionsViewSection.js'
import {
    PageDecorator, IPageDecorator, BasePage, VSCodeLocatorMap
} from '../utils.js'
import { ViewContent as ViewContentLocators } from '../../locators/1.73.0.js'

export interface ViewContent extends IPageDecorator<typeof ViewContentLocators> { }
/**
 * Page object representing the view container of a side bar view
 *
 * @category Sidebar
 */
@PageDecorator(ViewContentLocators)
export class ViewContent extends BasePage<typeof ViewContentLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewContent' as const

    constructor (
        locators: VSCodeLocatorMap,
        public view: SideBarView<any> = new SideBarView(locators)
    ) {
        super(locators, view.elem)
    }

    /**
     * Finds whether a progress bar is active at the top of the view
     * @returns Promise resolving to true/false
     */
    async hasProgress (): Promise<boolean> {
        const hidden = await this.progress$.getAttribute('aria-hidden')
        if (hidden === 'true') {
            return false
        }
        return true
    }

    /**
     * Retrieves a collapsible view content section by its title
     * @param title Title of the section
     * @returns Promise resolving to ViewSection object
     */
    async getSection (title: string): Promise<ViewSection> {
        const elements = await this.section$$
        let panel!: WebdriverIO.Element

        const availableSections: Set<string> = new Set()
        for (const element of elements) {
            const sectionTitle = await element.$(this.locators.sectionTitle).getText()
            availableSections.add(sectionTitle)
            if (sectionTitle === title) {
                panel = element
                break
            }
        }
        if (!panel) {
            throw new Error(
                `No section with title '${title}' found, `
                + `available are: ${[...availableSections].join(', ')}`
            )
        }
        return this.createSection(panel)
    }

    /**
     * Retrieves all the collapsible view content sections
     * @returns Promise resolving to array of ViewSection objects
     */
    async getSections (): Promise<ViewSection[]> {
        const sections: ViewSection[] = []
        const elements = await this.section$$
        for (const element of elements) {
            const section = await this.createSection(element)
            sections.push(await section.wait())
        }
        return sections
    }

    private async createSection (panel: WebdriverIO.Element): Promise<ViewSection> {
        const section: ViewSection = new DefaultTreeSection(
            this.locatorMap,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            panel as any,
            this
        )

        if (await section.elem.$(this.locators.defaultView).isExisting()) {
            return section
        }
        if (await section.elem.$(this.locators.extensionsView).isExisting()) {
            return new ExtensionsViewSection(
                this.locatorMap,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                panel as any,
                this
            )
        }

        return new CustomTreeSection(
            this.locatorMap,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            panel as any,
            this
        )
    }
}
