class Workbench {
    get window () {
        return $('.monaco-workbench')
    }

    // /**
    //  * Open the VS Code command line prompt
    //  * @returns Promise resolving to InputBox (vscode 1.44+) or QuickOpenBox (vscode up to 1.43) object
    //  */
    // async openCommandPrompt(): Promise<QuickOpenBox | InputBox> {
    //     const webview = await new EditorView().findElements(EditorView.locators.EditorView.webView);
    //     if (webview.length > 0) {
    //         const tab = await new EditorView().getActiveTab();
    //         if (tab) {
    //             await tab.sendKeys(Key.F1);
    //             return InputBox.create();
    //         }
    //     }
    //     await this.getDriver().actions().sendKeys(Key.F1).perform();
    //     if (Workbench.versionInfo.browser.toLowerCase() === 'vscode' && Workbench.versionInfo.version >= '1.44.0') {
    //         return InputBox.create();
    //     }
    //     return QuickOpenBox.create();
    //  }

    // /**
    //  * Open the command prompt, type in a command and execute
    //  * @param command text of the command to be executed
    //  * @returns Promise resolving when the command prompt is confirmed
    //  */
    // async executeCommand(command: string): Promise<void> {
    //     const prompt = await this.openCommandPrompt();
    //     await prompt.setText(`>${command}`);
    //     await prompt.confirm();
    // }
}

export default new Workbench()