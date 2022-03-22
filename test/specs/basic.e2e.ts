// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { PluginDecorator, BasePage } from 'wdio-vscode-service'

describe('WDIO VSCode Service', () => {
    it('exports necessary components for custom pageobjects', () => {
        expect(typeof PluginDecorator).toBe('function')
        expect(typeof BasePage).toBe('function')
    })

    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toBe('[Extension Development Host] - README.md - wdio-vscode-service - Visual Studio Code')
    })
})
