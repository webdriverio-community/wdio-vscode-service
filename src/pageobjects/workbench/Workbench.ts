import { TitleBar } from '../menu/TitleBar'
import { SideBarView } from '../sidebar/SideBarView'
import { ActivityBar } from '../activityBar/ActivityBar'
import { StatusBar } from '../statusBar/StatusBar'
import { EditorView } from '../editor/EditorView'
import { BottomBarPanel } from '../bottomBar/BottomBarPanel'
import { Notification, StandaloneNotification } from './Notification'
import { NotificationsCenter } from './NotificationsCenter'
import { QuickOpenBox, InputBox } from './Input'
import { SettingsEditor } from '../editor/SettingsEditor'

import { PluginDecorator, IPluginDecorator, BasePage } from '../utils'
import { Workbench as WorkbenchLocators } from '../../locators/1.61.0'

export interface Workbench extends IPluginDecorator<typeof WorkbenchLocators> {}
/**
 * Page object representing the custom VSCode title bar
 *
 * @category Workbench
 */
@PluginDecorator(WorkbenchLocators)
export class Workbench extends BasePage<typeof WorkbenchLocators> {
    /**
     * @private
     */
    public locatorKey = 'Workbench' as const

    /**
     * Get a title bar handle
     */
    getTitleBar (): TitleBar {
        return this.load(TitleBar)
    }

    /**
     * Get a side bar handle
     */
    getSideBar (): SideBarView<any> {
        return this.load(SideBarView)
    }

    /**
     * Get an activity bar handle
     */
    getActivityBar (): ActivityBar {
        return this.load(ActivityBar)
    }

    /**
     * Get a status bar handle
     */
    getStatusBar (): StatusBar {
        return this.load(StatusBar)
    }

    /**
     * Get a bottom bar handle
     */
    getBottomBar (): BottomBarPanel {
        return this.load(BottomBarPanel)
    }

    /**
     * Get a handle for the editor view
     */
    getEditorView (): EditorView {
        return this.load(EditorView)
    }

    /**
     * Get all standalone notifications (notifications outside the notifications center)
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications (): Promise<Notification[]> {
        const notifications: Notification[] = []
        const containers = await this.notificationContainer$$

        if (containers.length === 0) {
            return []
        }

        for (const container of containers) {
            const elements = await container.$$(this.locators.notificationItem)

            for (const element of elements) {
                notifications.push(
                    await this.load(
                        StandaloneNotification,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        element as any
                    ).wait()
                )
            }
        }

        return notifications
    }

    /**
     * Verifies if any notifications are shown
     * @returns true if workbench has notifications, false otherwise
     */
    hasNotifications (): Promise<boolean> {
        return this.notificationContainer$.isExisting()
    }

    /**
     * Opens the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    openNotificationsCenter (): Promise<NotificationsCenter> {
        const statusBar = this.load(StatusBar)
        return statusBar.openNotificationsCenter()
    }

    /**
     * Opens the settings editor
     *
     * @returns promise that resolves to a SettingsEditor instance
     */
    async openSettings (): Promise<SettingsEditor> {
        await this.executeCommand('open user settings')
        await this.load(EditorView).openEditor('Settings')
        await this.elem.$(this.locatorMap.Editor.elem as string).waitForExist()
        await new Promise((res) => setTimeout(res, 500))
        return this.load(SettingsEditor)
    }

    /**
     * Open the VS Code command line prompt
     * @returns Promise resolving to InputBox (vscode 1.44+) or QuickOpenBox (vscode up to 1.43) object
     */
    async openCommandPrompt (): Promise<QuickOpenBox | InputBox> {
        const editorView = await this.load(EditorView).wait()
        const webview = await editorView.webView$$
        if (webview.length > 0) {
            const tab = await editorView.getActiveTab()
            if (tab) {
                await tab.elem.addValue(['F1'])
                const inputBox = this.load(InputBox).wait()
                return inputBox
            }
        }
        await this._driver.keys(['F1'])
        if (
            await this._driver.getVSCodeChannel() === 'vscode'
            && await this._driver.getVSCodeVersion() >= '1.44.0'
        ) {
            return this.load(InputBox).wait()
        }
        return this.load(QuickOpenBox).wait()
    }

    /**
     * Open the command prompt, type in a command and execute
     * @param command text of the command to be executed
     * @returns Promise resolving when the command prompt is confirmed
     */
    async executeCommand (command: string): Promise<void> {
        const prompt = await this.openCommandPrompt()
        await prompt.setText(`>${command}`)
        await prompt.confirm()
    }
}
