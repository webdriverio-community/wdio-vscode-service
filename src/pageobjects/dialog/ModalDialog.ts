import { PageDecorator, IPageDecorator, BasePage } from '../utils.js'
import { Dialog as DialogLocators } from '../../locators/1.73.0.js'

export interface ModalDialog extends IPageDecorator<typeof DialogLocators> {}
/**
 * Page Object for Custom Style Modal Dialogs (non-native)
 *
 * @category Dialog
 */
@PageDecorator(DialogLocators)
export class ModalDialog extends BasePage<typeof DialogLocators> {
    /**
     * @private
     */
    public locatorKey = 'Dialog' as const

    /**
     * Get the dialog's message in a Promise
     */
    async getMessage (): Promise<string> {
        return this.message$.getText()
    }

    /**
     * Get the details message in a Promise
     */
    async getDetails (): Promise<string> {
        return this.details$.getText()
    }

    /**
     * Get the list of buttons as WebElements
     *
     * @returns Promise resolving to Array of WebElement items representing the buttons
     */
    async getButtons () {
        return this.buttonContainer$.$$(this.locators.button)
    }

    /**
     * Push a button with given title if it exists
     *
     * @param title title/text of the button
     */
    async pushButton (title: string): Promise<void> {
        const buttons = await this.getButtons()
        const titles = await Promise.all(buttons.map(async (btn) => btn.getAttribute('title')))
        const index = titles.findIndex((value) => value === title)
        if (index > -1) {
            await buttons[index].click()
        }
    }

    /**
     * Close the dialog using the 'cross' button
     */
    async close (): Promise<void> {
        return this.closeButton$.click()
    }
}
