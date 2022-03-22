// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { PluginDecorator, IPluginDecorator, BasePage } from 'wdio-vscode-service'

const locators = {
    marquee: {
        elem: 'ul[aria-label="Active View Switcher"]',
        menuitems: 'li'
    }
}

interface TestPageObject extends IPluginDecorator<typeof locators.marquee> {}
@PluginDecorator(locators.marquee)
class TestPageObject extends BasePage<typeof locators.marquee, typeof locators> {
    public locatorKey = 'marquee' as const

    itemCnt () {
        return this.menuitems$$.length
    }
}

describe('WDIO VSCode Service', () => {
    it('exports necessary components for custom pageobjects', () => {
        expect(typeof PluginDecorator).toBe('function')
        expect(typeof BasePage).toBe('function')
    })

    it('can use exported page object structure', async () => {
        const page = new TestPageObject(locators)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const menuItemCnt = await page.itemCnt()
        expect(menuItemCnt).toBe(await page.menuitems$$.length)
    })

    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toBe('[Extension Development Host] - README.md - wdio-vscode-service - Visual Studio Code')
    })
})
