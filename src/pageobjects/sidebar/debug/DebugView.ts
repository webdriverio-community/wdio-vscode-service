import { SideBarView } from '../SideBarView'
import { PageDecorator, IPageDecorator } from '../../utils'
import { DebugView as DebugViewLocators } from '../../../locators/1.70.0'

export interface DebugView extends IPageDecorator<typeof DebugViewLocators> { }
/**
 * Page object representing the Run/Debug view in the side bar
 *
 * @category Sidebar
 */
@PageDecorator(DebugViewLocators)
export class DebugView extends SideBarView<typeof DebugViewLocators> {
    /**
     * @private
     */
    public locatorKey = 'DebugView' as const

    /**
     * Get the title of the selected launch configuration
     * @returns Promise resolving to the title
     */
    async getLaunchConfiguration (): Promise<string> {
        const action = await this.getTitlePart().elem.$(this.locators.launchCombo)
        const combo = await action.$(this.locators.launchSelect)
        return combo.getAttribute('title')
    }

    /**
     * Get titles of all available launch configurations
     * @returns Promise resolving to list of titles
     */
    async getLaunchConfigurations (): Promise<string[]> {
        const action = await this.getTitlePart().elem.$(this.locators.launchCombo)
        const combo = await action.$(this.locators.launchSelect)
        const configs: string[] = []
        const options = await combo.$$(this.locators.launchOption)

        for (const option of options) {
            if (await option.isEnabled()) {
                configs.push(await option.getAttribute('value'))
            }
        }

        return configs
    }

    /**
     * Select a given launch configuration
     * @param title title of the configuration to select
     */
    async selectLaunchConfiguration (title: string): Promise<void> {
        const action = await this.getTitlePart().elem.$(this.locators.launchCombo)
        const combo = await action.$(this.locators.launchSelect)
        const option = await combo.$(this.locators.optionByName(title))
        await option.click()
    }

    /**
     * Start Debugging using the current launch configuration
     */
    async start (): Promise<void> {
        const action = await this.getTitlePart().elem.$(this.locators.launchCombo)
        await action.$(this.locators.startButton).click()
    }
}
