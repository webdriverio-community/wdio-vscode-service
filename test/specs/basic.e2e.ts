// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import {
    PluginDecorator, IPluginDecorator, BasePage, BottomBarPanel
} from '../..'

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
        const title = await workbench.getTitleBar().getTitle()

        /**
         * actual title is "[Extension Development Host] - README.md - wdio-vscode-service"
         * but test fails on different operating systems due to different "-" chars
         */
        expect(title).toContain('wdio-vscode-service')
    })

    describe('bottombar', () => {
        let bottomBar: BottomBarPanel

        before(async () => {
            const workbench = await browser.getWorkbench()
            bottomBar = workbench.getBottomBar()
            await bottomBar.toggle(true)
        })

        it('can get output channels', async () => {
            const outputView = await bottomBar.openOutputView()
            const channels = await outputView.getChannelNames()
            expect(channels).toContain('Tasks')
            expect(channels).toContain('Extensions')
            expect(channels).toContain('JSON Language Server')
            expect(channels).toContain('Guinea Pig')

            const currentChannel = await outputView.getCurrentChannel()
            expect(currentChannel).toEqual(channels[0])
        })

        it('can get extension logs', async () => {
            const outputView = await bottomBar.openOutputView()
            await outputView.selectChannel('Guinea Pig')
            expect(await outputView.getText()).toEqual(['Hello World!'])
        })
    })
})
