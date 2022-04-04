// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import path from 'path'
import {
    PluginDecorator, IPluginDecorator, BasePage, BottomBarPanel,
    StatusBar, SettingsEditor, TextEditor, FindWidget
} from '../..'

function skip (param: string | string[] = process.platform) {
    const platforms = Array.isArray(param) ? param : [param]
    return platforms.includes(process.platform) ? it.skip : it
}

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
    describe('page objects', () => {
        it('exports necessary components for custom pageobjects', () => {
            expect(typeof PluginDecorator).toBe('function')
            expect(typeof BasePage).toBe('function')
        })

        it('can use exported page object structure', async () => {
            const page = new TestPageObject(locators)
            const menuItemCnt = await page.itemCnt()
            expect(menuItemCnt).toBe(await page.menuitems$$.length)
        })
    })

    describe('workbench', () => {
        it('should be able to load VSCode', async () => {
            const workbench = await browser.getWorkbench()
            const title = await workbench.getTitleBar().getTitle()
            expect(title).toContain('README.md')
            expect(title).toContain('wdio-vscode-service')
        })

        it('is able to read guinea pig notification', async () => {
            const workbench = await browser.getWorkbench()
            await browser.waitUntil(async () => {
                const notifs = await workbench.getNotifications()
                const messages = await Promise.all(notifs.map((n) => n.getMessage()))
                return messages.includes('Hello World!')
            }, {
                timeoutMsg: 'Could not find test extension notification'
            })
        })

        it('is able to close all notifications', async () => {
            const workbench = await browser.getWorkbench()
            const notifs = await workbench.getNotifications()
            for (const notif of notifs) {
                await notif.dismiss()
            }
            expect(await workbench.hasNotifications()).toBe(false)
        })

        skip('linux')('executeCommand', async () => {
            const workbench = await browser.getWorkbench()
            await workbench.executeCommand('Find in Files')
            const selectedView = await workbench.getActivityBar().getSelectedViewAction()
            expect(await selectedView.getTitle()).toBe('Search')
        })
    })

    describe('settings', () => {
        let settings: SettingsEditor

        skip('linux')('openSettings', async () => {
            const workbench = await browser.getWorkbench()
            settings = await workbench.openSettings()
            const setting = await settings.findSetting('Cursor Style', 'Editor')
            expect(await setting.getValue()).toBe('line')
        })

        after(async () => {
            /**
             * close settings view again after test
             */
            if (settings && await settings.elem.isExisting()) {
                const CMD_KEY = process.platform === 'win32' ? 'Control' : 'Meta'
                await browser.keys([CMD_KEY, 'w'])
            }
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

            const selectedView = await workbench.getActivityBar().getSelectedViewAction()
            expect(await selectedView.getTitle()).toBe('Extensions')

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

        it('can get extension logs', async () => {
            const outputView = await bottomBar.openOutputView()
            await outputView.selectChannel('Guinea Pig')
            expect(await outputView.getText()).toEqual(['Hello World!'])
        })
    })

    describe('statusbar', () => {
        let statusBar: StatusBar

        before(async () => {
            const workbench = await browser.getWorkbench()
            statusBar = workbench.getStatusBar()
        })

        it('can receive all items', async () => {
            // eslint-disable-next-line wdio/no-pause
            await browser.pause(1000)
            const items = await statusBar.getItems()
            expect(items).toContain('Markdown')
            expect(items).toContain('Ln 1, Col 1')
        })

        it('can get line ending', async () => {
            expect(await statusBar.getCurrentLineEnding()).toBe('LF')
        })

        it('can get current position', async () => {
            expect(await statusBar.getCurrentPosition()).toBe('Ln 1, Col 1')
        })

        it('can get current line indentation', async () => {
            expect(await statusBar.getCurrentIndentation()).toBe('Spaces: 4')
        })

        it('can get current encoding', async () => {
            expect(await statusBar.getCurrentEncoding()).toBe('UTF-8')
        })

        it('can get current language', async () => {
            expect(await statusBar.getCurrentLanguage()).toBe('Markdown')
        })
    })

    describe('TextEditor', () => {
        let tab: TextEditor
        before(async () => {
            const workbench = await browser.getWorkbench()
            const editorView = workbench.getEditorView()
            tab = await editorView.openEditor('README.md') as TextEditor
        })

        it('getFilePath', async () => {
            expect(await tab.getFilePath())
                .toContain(`wdio-vscode-service${path.sep}README.md`)
        })

        it('getFileUri', async () => {
            expect(await tab.getFileUri())
                .toContain(`wdio-vscode-service${path.sep}README.md`)
        })

        it('getText', async () => {
            expect(await tab.getText())
                .toContain('For more information on WebdriverIO check out the project')
        })

        it('setText', async () => {
            await tab.setText('Hello World!\n\nThis is an automated text change.\n\nEnd of conversation.')
            const newText = await tab.getText()
            expect(newText).not.toContain('For more information on WebdriverIO check out the project')
            expect(newText).toContain('Hello World')
        })

        it('getTextAtLine', async () => {
            const textOnLine3 = await tab.getTextAtLine(3)
            expect(textOnLine3).toBe('This is an automated text change.')
        })

        it('setTextAtLine', async () => {
            const err = await tab.setTextAtLine(99, 'foobar')
                .catch((error) => error as Error)
            expect(err?.message).toBe('Line number 99 does not exist')

            await tab.setTextAtLine(3, 'foobar')
            expect(await tab.getTextAtLine(3)).toBe('foobar')
        })

        it('getLineOfText', async () => {
            expect(await tab.getLineOfText('foobar')).toBe(3)
        })

        it('selectText / getSelectedText', async () => {
            await tab.selectText('foobar')
            expect(await tab.getSelectedText()).toBe('foobar')
        })

        it('typeTextAt', async () => {
            await tab.typeTextAt(3, 4, 'loo')
            expect(await tab.getTextAtLine(3)).toBe('fooloobar')
        })

        it('typeText', async () => {
            await tab.moveCursor(3, 7)
            await tab.typeText('boo')
            expect(await tab.getTextAtLine(3)).toBe('foolooboobar')
        })

        it('getCoordinates', async () => {
            await tab.moveCursor(3, 7)
            expect(await tab.getCoordinates()).toEqual([3, 7])
        })

        it('getNumberOfLines', async () => {
            expect(await tab.getNumberOfLines()).toBe(5)
        })

        it('clearText', async () => {
            await tab.clearText()
            const clearedText = await tab.getText()
            expect(clearedText).toBe('')
        })

        describe('openFindWidget', () => {
            let findWidget: FindWidget

            before(async () => {
                await tab.setText('Hello World!\n\nThis is an automated text change.\n\nEnd of conversation.')
                findWidget = await tab.openFindWidget()
            })

            it('should be able to find text', async () => {
                await findWidget.setSearchText('automated text')
                expect(await findWidget.getSearchText())
                    .toBe('automated text')
            })

            it('getResultCount', async () => {
                expect(await findWidget.getResultCount()).toEqual([1, 1])
            })

            it('setReplaceText', async () => {
                await findWidget.setReplaceText('manual text')
                await findWidget.replace()
                expect(await tab.getTextAtLine(3)).toBe('This is an manual text change.')
            })
        })
    })
})
