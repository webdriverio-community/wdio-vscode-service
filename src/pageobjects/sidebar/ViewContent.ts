import { SideBarView, ViewSection } from '..'
import { DefaultTreeSection } from './tree/default/DefaultTreeSection'
import { CustomTreeSection } from './tree/custom/CustomTreeSection'
import { ExtensionsViewSection } from './extensions/ExtensionsViewSection'
import {
    PluginDecorator, IPluginDecorator, BasePage, VSCodeLocatorMap
} from '../utils'
import { ViewContent as ViewContentLocators } from '../../locators/1.61.0'

export interface ViewContent extends IPluginDecorator<typeof ViewContentLocators> { }
/**
 * Page object representing the view container of a side bar view
 *
 * @category Sidebar
 */
@PluginDecorator(ViewContentLocators)
export class ViewContent extends BasePage<typeof ViewContentLocators> {
    /**
     * @private
     */
    public locatorKey = 'ViewContent' as const

    constructor (
        locators: VSCodeLocatorMap,
        driver: WebdriverIO.Browser,
        public view: SideBarView<any> = new SideBarView(locators, driver)
    ) {
        super(locators, driver, view.elem)
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
            const sectionTitle = await this.sectionTitle$.getText()
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
        const section: ViewSection = this.load(
            DefaultTreeSection,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            panel as any,
            this
        )

        if (await section.elem.$(this.locators.defaultView).isExisting()) {
            return section
        }
        if (await section.elem.$(this.locators.extensionsView).isExisting()) {
            return this.load(
                ExtensionsViewSection,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                panel as any,
                this
            )
        }

        return this.load(
            CustomTreeSection,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            panel as any,
            this
        )
    }
}
