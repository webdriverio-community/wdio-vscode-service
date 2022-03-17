import { workbench } from 'locators/1.61.0'
import { TitleBar } from "../menu/TitleBar";
import { SideBarView } from "../sidebar/SideBarView";
import { ActivityBar } from "../activityBar/ActivityBar";
import { StatusBar } from "../statusBar/StatusBar";
import { EditorView } from "../editor/EditorView";
import { BottomBarPanel } from "../bottomBar/BottomBarPanel";
import { Notification, StandaloneNotification } from "./Notification";
import { NotificationsCenter } from "./NotificationsCenter";
import { QuickOpenBox } from "./input/QuickOpenBox";
import { SettingsEditor } from "../editor/SettingsEditor";
import { InputBox } from "./input/InputBox";

import { PluginDecorator, IPluginDecorator, BasePage } from '../utils'

/**
 * Page object representing the custom VSCode title bar
 */
export interface Workbench extends IPluginDecorator<typeof workbench.Workbench> {}
@PluginDecorator(workbench.Workbench)
export class Workbench extends BasePage {
    /**
     * Get a title bar handle
     */
    getTitleBar(): TitleBar {
        return new TitleBar(this.locatorMap.menu.TitleBar);
    }

    /**
     * Get a side bar handle
     */
    getSideBar(): SideBarView {
        return new SideBarView(this.locatorMap.sideBar.SideBarView);
    }

    /**
     * Get an activity bar handle
     */
    getActivityBar(): ActivityBar {
        return new ActivityBar(this.locatorMap.activityBar.ActivityBar);
    }

    /**
     * Get a status bar handle
     */
    getStatusBar(): StatusBar {
        return new StatusBar(this.locatorMap.statusBar.StatusBar);
    }

    /**
     * Get a bottom bar handle
     */
    getBottomBar(): BottomBarPanel {
        return new BottomBarPanel(this.locatorMap.bottomBar.BottomBarPanel);
    }

    /**
     * Get a handle for the editor view
     */
    getEditorView(): EditorView {
        return new EditorView(this.locatorMap.editor.EditorView);
    }

    /**
     * Get all standalone notifications (notifications outside the notifications center)
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications(): Promise<Notification[]> {
        const notifications: Notification[] = [];
        const container = await this.notificationContainer$

        if (!await container.isExisting()) {
            return []
        }
        const elements = await container.$$(this.locators.notificationItem);
        
        for (const element of elements) {
            notifications.push(await new StandaloneNotification(this.locatorMap.workbench.Notification, element as any).wait());
        }
        return notifications;
    }

    /**
     * Opens the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    openNotificationsCenter(): Promise<NotificationsCenter> {
        return new StatusBar(this.locatorMap.statusBar.StatusBar).openNotificationsCenter();
    }
    
    /**
     * Opens the settings editor
     *
     * @returns promise that resolves to a SettingsEditor instance
     */
    async openSettings(): Promise<SettingsEditor> {
        await this.executeCommand('open user settings');
        await new EditorView(this.locatorMap.editor.EditorView).openEditor('Settings');
        await this.elem.$(this.locatorMap.editor.Editor.elem).waitForExist();
        await new Promise((res) => setTimeout(res, 500));
        return new SettingsEditor(this.locatorMap.editor.SettingsEditor);
    }

    /**
     * Open the VS Code command line prompt
     * @returns Promise resolving to InputBox (vscode 1.44+) or QuickOpenBox (vscode up to 1.43) object
     */
    async openCommandPrompt(): Promise<QuickOpenBox | InputBox> {
        const editorView = await new EditorView(this.locatorMap.editor.EditorView)
        const webview = await editorView.webView$$;
        if (webview.length > 0) {
            const tab = await editorView.getActiveTab();
            if (tab) {
                await tab.elem.addValue(['F1']);
                const inputBox = new InputBox(this.locatorMap.input.InputBox).wait()
                return inputBox;
            }
        }
        await browser.keys(['F1']);
        // @ts-expect-error
        if (await browser.getVSCodeChannel() === 'vscode' && browser.getVSCodeVersion() >= '1.44.0') {
            return new InputBox(this.locatorMap.input.InputBox).wait();
        }
        return new QuickOpenBox(this.locatorMap.input.QuickOpenBox).wait();
     }

    /**
     * Open the command prompt, type in a command and execute
     * @param command text of the command to be executed
     * @returns Promise resolving when the command prompt is confirmed
     */
    async executeCommand(command: string): Promise<void> {
        const prompt = await this.openCommandPrompt();
        await prompt.setText(`>${command}`);
        await prompt.confirm();
    }
}
