import { Notification, CenterNotification, NotificationType } from './Notification'
import { BasePage, PluginDecorator, IPluginDecorator } from '../utils'
import { NotificationsCenter as NotificationsCenterLocator } from '../../locators/1.61.0'

/**
 * Notifications center page object
 */
export interface NotificationsCenter extends IPluginDecorator<typeof NotificationsCenterLocator> {}
@PluginDecorator(NotificationsCenterLocator)
export class NotificationsCenter extends BasePage<typeof NotificationsCenterLocator> {
    public locatorKey = 'NotificationsCenter' as const
    /**
     * Close the notifications center
     * @returns Promise resolving when the center is closed
     */
    async close (): Promise<void> {
        if (await this.elem.isDisplayed()) {
            await this.closeBtn$.click();
        }
    }

    /**
     * Clear all notifications in the notifications center
     * Note that this will also hide the notifications center
     * @returns Promise resolving when the clear all button is pressed
     */
    async clearAllNotifications(): Promise<void> {
        return this.clear$.click();
    }

    /**
     * Get all notifications of a given type
     * @param type type of the notifications to look for,
     * NotificationType.Any will retrieve all notifications
     * 
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications(type: NotificationType): Promise<Notification[]> {
        const notifications: Notification[] = [];
        const elements = await this.row$$;

        for (const element of elements) {
            const not = new CenterNotification(this.locatorMap, element as any);
            if (type === NotificationType.Any || await not.getType() === type) {
                notifications.push(await not.wait());
            }
        }
        return notifications;
    }
}
