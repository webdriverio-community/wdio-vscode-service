// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import {
    PluginDecorator, IPluginDecorator, BasePage, BottomBarPanel
} from '../..'

const skipWindows = process.platform === 'win32' ? it.skip : it

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

    skipWindows('is able to read guinea pig notification', async () => {
        const workbench = await browser.getWorkbench()
        await browser.waitUntil(async () => {
            const notifs = await workbench.getNotifications()
            const messages = await Promise.all(notifs.map((n) => n.getMessage()))
            return messages.includes('Hello World!')
        }, {
            timeoutMsg: 'Could not find test extension notification'
        })
    })

    describe('activity bar', () => {
        it('should show all activity bar items', async () => {
            const workbench = await browser.getWorkbench()
            const viewControls = await workbench.getActivityBar().getViewControls()
            expect(await Promise.all(viewControls.map((vc) => vc.getTitle()))).toEqual([
                'Explorer',
                'Search',
                'Source Control',
                'Run and Debug',
                'Extensions'
            ])
        })

        it('can open extension view and check that first installed extension is our guinea pig', async () => {
            const workbench = await browser.getWorkbench()
            const extensionView = await workbench.getActivityBar().getViewControl('Extensions')
            await extensionView?.openView()
            const sidebar = workbench.getSideBar()
            const sidebarView = sidebar.getContent()
            await sidebarView.getSection('EXTENSIONS')

            /**
             * for some reason the developed extension doesn't show up
             * in the installed extension section when running in a
             * prestine environmnet
             */
            // const installedExtensions = await extensionViewSection.getVisibleItems()
            // expect(await installedExtensions[0].getTitle()).toBe('Guinea Pig')
        })

        it('should be able to get global options', async () => {
            const workbench = await browser.getWorkbench()
            const viewControls = await workbench.getActivityBar().getGlobalActions()
            expect(await Promise.all(viewControls.map((vc) => vc.getTitle()))).toEqual([
                'Accounts',
                'Manage'
            ])
        })
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
            expect(channels).toContain('Log (Extension Host)')

            const currentChannel = await outputView.getCurrentChannel()
            expect(currentChannel).toEqual(channels[0])
        })

        /**
         * ToDo(Christian): investigate why extension isn't loading on Windows
         * https://github.com/webdriverio-community/wdio-vscode-service/issues/4
         */
        it('can get extension logs (ignore in win32)', async () => {
            const outputView = await bottomBar.openOutputView()
            await outputView.selectChannel('Guinea Pig')
            expect(await outputView.getText()).toEqual(['Hello World!'])
        })
    })
})
