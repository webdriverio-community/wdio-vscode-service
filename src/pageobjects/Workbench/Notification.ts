import { BasePage, IPluginDecorator } from '../utils'
import { workbench } from '../../locators/1.61.0'
import { NotificationType } from '../../types'
import { ChainablePromiseElement } from 'webdriverio';

/**
 * Abstract element representing a notification
 */
export interface Notification extends IPluginDecorator<typeof workbench.Notification> {}
export abstract class Notification extends BasePage {
    /**
     * Get the message of the notification
     * @returns Promise resolving to notification message
     */
    async getMessage(): Promise<string> {
        return await this.elem.$(this.locators.message).getText();
    }

    /**
     * Get the type of the notification
     * @returns Promise resolving to NotificationType
     */
    async getType(): Promise<NotificationType> {
        const iconType = await this.elem.$(this.locators.icon).getAttribute('class');
        if (iconType.indexOf('icon-info') > -1) {
            return NotificationType.Info;
        } else if (iconType.indexOf('icon-warning') > -1) {
            return NotificationType.Warning;
        } else {
            return NotificationType.Error;
        }
    }

    /**
     * Get the source of the notification as text
     * @returns Promise resolving to notification source
     */
    async getSource(): Promise<string> {
        await this.expand();
        return await this.elem.$(this.locators.source).getAttribute('title');
    }

    /**
     * Find whether the notification has an active progress bar
     * @returns Promise resolving to true/false
     */
    async hasProgress(): Promise<boolean> {
        const klass = await this.elem.$(this.locators.progress).getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    /**
     * Dismiss the notification
     * @returns Promise resolving when notification is dismissed
     */
    async dismiss(): Promise<void> {
        const btn = await this.elem.$(this.locators.dismiss)
        await btn.click()
        await btn.waitForDisplayed({ reverse: true, timeout: 2000 })
    }

    /**
     * Get the action buttons of the notification as an array
     * of NotificationButton objects
     * @returns Promise resolving to array of NotificationButton objects
     */
    async getActions(): Promise<NotificationButton[]> {
        const buttons: NotificationButton[] = [];
        const elements = await this.elem.$(this.locators.actions)
            .$$(this.locators.action);

        for (const button of elements) {
            buttons.push(await new NotificationButton(
                this.locatorMap.workbench.Notification,
                await button.getAttribute(this.locators.actionLabel)
            ).wait());
        }
        return buttons;
    }

    /**
     * Click on an action button with the given title
     * @param title title of the action/button
     * @returns Promise resolving when the select button is pressed
     */
    async takeAction(title: string): Promise<void> {
        await new NotificationButton(
            this.locatorMap.workbench.Notification,
            title
        ).elem.click();
    }

    /**
     * Expand the notification if possible
     */
    async expand(): Promise<void> {
        // await this.getDriver().actions().mouseMove(this).perform();
        const exp = await this.elem.$$(this.locators.expand);
        if (exp[0]) {
            await exp[0].click();
        }
    }
}

/**
 * Notification displayed on its own in the notifications-toasts container
 */
export class StandaloneNotification extends Notification {
    constructor(locators: typeof workbench.Notification) {
        super(locators, locators.standaloneContainer);
    }
}

/**
 * Notification displayed within the notifications center
 */
export class CenterNotification extends Notification {
    constructor(locators: typeof workbench.NotificationsCenter, parent: ChainablePromiseElement<WebdriverIO.Element>) {
        super(locators, locators.elem, parent);
    }
}

/**
 * Notification button
 */
class NotificationButton extends BasePage {
    private title: string;

    constructor(
        locators: typeof workbench.Notification,
        title: string
    ) {
        super(locators, locators.buttonConstructor(title));
        this.title = title;
    }

    getTitle(): string {
        return this.title;
    }
}