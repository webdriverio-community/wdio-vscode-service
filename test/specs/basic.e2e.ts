/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import path from 'node:path'
import { browser, expect, $ } from '@wdio/globals'

import {
    PageDecorator, IPageDecorator, BasePage, BottomBarPanel,
    StatusBar, SettingsEditor, TextEditor, FindWidget, MarkerType,
    ProblemsView, EditorView, WebView, SideBarView, CustomTreeItem,
    DefaultTreeItem, ViewSection, TreeItem, sleep, TitleBar
} from '../../dist/index.js'
import { Workbench } from '../../dist/locators/1.37.0.js'

const isWebTest = Boolean(parseInt(process.env.VSCODE_WEB_TESTS || '', 10))

function skip (param: string | string[] = process.platform) {
    const platforms = Array.isArray(param) ? param : [param]
    return platforms.includes(process.platform) ? it.skip : it
}
const skipCI = process.env.CI ? it.skip : it

const locators = {
    marquee: {
        elem: 'ul[aria-label="Active View Switcher"]',
        menuitems: 'li'
    }
}

interface TestPageObject extends IPageDecorator<typeof locators.marquee> {}
@PageDecorator(locators.marquee)
class TestPageObject extends BasePage<typeof locators.marquee, typeof locators> {
    public locatorKey = 'marquee' as const

    itemCnt () {
        return this.menuitems$$.length
    }
}

describe('WDIO VSCode Service', () => {
    describe('page objects', () => {
        it('exports necessary components for custom pageobjects', () => {
            expect(typeof PageDecorator).toBe('function')
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

            /**
             * doesn't work in web session
             */
            if (!await browser.isVSCodeWebSession()) {
                expect(title).toContain('wdio-vscode-service')
            }
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
            await browser.waitUntil(async () => {
                const notifs = await workbench.getNotifications()
                for (const notif of notifs) {
                    await notif.dismiss()
                }
                return !(await workbench.hasNotifications())
            })

            expect(await workbench.hasNotifications()).toBe(false)
        })

        skip('linux')('executeCommand @skipWeb', async () => {
            const workbench = await browser.getWorkbench()
            await workbench.executeCommand('Find in Files')
            const selectedView = await workbench.getActivityBar().getSelectedViewAction()
            expect(await selectedView.getTitle()).toBe('Search')
        })

        skip('linux')('executeQuickPick @skipWeb', async () => {
            const workbench = await browser.getWorkbench()
            await workbench.executeQuickPick('Search: Find in Files')
            const selectedView = await workbench.getActivityBar().getSelectedViewAction()
            expect(await selectedView.getTitle()).toBe('Search')
        })

        it('can access VSCode API through service interface @skipWeb', async () => {
            const workbench = await browser.getWorkbench()
            await browser.executeWorkbench((vscode) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                vscode.window.showInformationMessage('I am an API call!')
            })
            await browser.waitUntil(async () => {
                const notifs = await workbench.getNotifications()
                const messages = await Promise.all(notifs.map((n) => n.getMessage()))
                return messages.includes('I am an API call!')
            }, {
                timeoutMsg: 'Could not find custom notification'
            })

            await browser.executeWorkbench((vscode) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                vscode.window.showInformationMessage('I am an another API call!')
            })
            await browser.waitUntil(async () => {
                const notifs = await workbench.getNotifications()
                const messages = await Promise.all(notifs.map((n) => n.getMessage()))
                return messages.includes('I am an another API call!')
            }, {
                timeoutMsg: 'Could not find another custom notification'
            })
        })

        it('can send parameters to VSCode API invocation @skipWeb', async () => {
            const workbench = await browser.getWorkbench()
            const message = 'I passed this message as a parameter!'

            let messages: string[] = []
            await browser.waitUntil(async () => {
                await browser.executeWorkbench((vscode, msg) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    vscode.window.showInformationMessage(msg)
                }, message)
                const notifs = await workbench.getNotifications()
                messages = await Promise.all(notifs.map((n) => n.getMessage()))
                return messages.includes(message)
            }, {
                timeoutMsg: (
                    'Could not find custom notification: '
                    + `expected "${message}" but received "${messages.join('", "')}"`
                ),
                timeout: 5000
            })
        })
    })

    describe('settings @skipWeb', () => {
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
            await sidebarView.getSection('INSTALLED')

            /**
             * for some reason the developed extension doesn't show up
             * in the installed extension section when running in a
             * pristine environment
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
            expect(channels).toContain('Guinea Pig')
        })

        it('can get extension logs', async () => {
            const outputView = await bottomBar.openOutputView()
            await outputView.selectChannel('Guinea Pig')
            expect(await outputView.getCurrentChannel()).toBe('Guinea Pig')
            expect(await outputView.getText()).toEqual(['Hello World!'])
        })

        skipCI('can read from terminal @skipWeb', async () => {
            const terminalView = await bottomBar.openTerminalView()
            const text = await terminalView.getText()
            expect(text).toContain(':wdio-vscode-service')
        })
    })

    describe('titlebar', () => {
        let titleBar: TitleBar

        before(async () => {
            const workbench = await browser.getWorkbench()
            titleBar = workbench.getTitleBar()
        })

        skip('darwin')('can find all items', async () => {
            const items = await titleBar.getItems()
            expect(await items[0].getLabel()).toBe('File')
            expect(await items[1].getLabel()).toBe('Edit')
            expect(await items[items.length - 1].getLabel()).toBe('Help')
        })

        skip('darwin')('can select item by name', async () => {
            const item = await titleBar.getItem('Help')
            expect(await item?.getLabel()).toBe('Help')
        })

        // skipped because it changes editor content which breaks other tests
        skipCI('can click top level item', async () => {
            const workbench = await browser.getWorkbench()
            const itemHelp = await titleBar.getItem('Help')
            const menuHelp = await itemHelp?.select()
            const itemWelcome = await menuHelp?.getItem('Welcome')
            await itemWelcome?.select()

            const activeTab = await workbench.getEditorView().getActiveTab()
            expect(await activeTab?.getTitle()).toEqual('Welcome')
        })

        skip('darwin')('can click nested item', async () => {
            const workbench = await browser.getWorkbench()

            const itemEdit = await titleBar.getItem('Edit')
            const menuEdit = await itemEdit?.select()
            const itemCopyAs = await menuEdit?.getItem('Copy As')
            const menuCopyAs = await itemCopyAs?.select()
            const itemCallMe = await menuCopyAs?.getItem('Call Me!')
            await itemCallMe?.select()

            await browser.waitUntil(async () => {
                const notifs = await workbench.getNotifications()
                for (const n of notifs) {
                    if ((await n.getMessage()).includes('I got called!')) {
                        await n.dismiss()
                        return true
                    }
                }
                return false
            }, {
                timeoutMsg: 'Could not find notification as reaction to action item click'
            })
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

        it('getFilePath @skipWeb', async () => {
            expect(await tab.getFilePath())
                .toContain(`wdio-vscode-service${path.sep}README.md`)
        })

        it('getFileUri', async () => {
            expect(await tab.getFileUri()).toContain(
                await browser.isVSCodeWebSession()
                    ? 'vscode-test-web://mount/README.md'
                    : 'wdio-vscode-service/README.md'
            )
        })

        it('getText @skipWebCI', async () => {
            expect(await tab.getText())
                .toContain('For more information on WebdriverIO check out the project')
        })

        it('setText @skipWebCI', async () => {
            await tab.setText('Hello World!\n\nThis is an automated text change.\n\nEnd of conversation.')
            const newText = await tab.getText()
            expect(newText).not.toContain('For more information on WebdriverIO check out the project')
            expect(newText).toContain('Hello World')
        })

        it('getTextAtLine @skipWebCI', async () => {
            const textOnLine3 = await tab.getTextAtLine(3)
            expect(textOnLine3).toBe('This is an automated text change.')
        })

        it('setTextAtLine @skipWebCI', async () => {
            const err = await tab.setTextAtLine(99, 'foobar')
                .catch((error) => error as Error)
            expect(err?.message).toBe('Line number 99 does not exist')

            await tab.setTextAtLine(3, 'foobar')
            expect(await tab.getTextAtLine(3)).toBe('foobar')
        })

        it('getLineOfText @skipWebCI', async () => {
            expect(await tab.getLineOfText('foobar')).toBe(3)
        })

        it('selectText / getSelectedText @skipWebCI', async () => {
            await tab.selectText('foobar')
            expect(await tab.getSelectedText()).toBe('foobar')
        })

        it('typeTextAt @skipWebCI', async () => {
            await tab.typeTextAt(3, 4, 'loo')
            expect(await tab.getTextAtLine(3)).toBe('fooloobar')
        })

        it('typeText @skipWebCI', async () => {
            await tab.moveCursor(3, 7)
            await tab.typeText('boo')
            expect(await tab.getTextAtLine(3)).toBe('foolooboobar')
        })

        it('getCoordinates @skipWebCI', async () => {
            await tab.moveCursor(3, 7)
            expect(await tab.getCoordinates()).toEqual([3, 7])
        })

        it('getNumberOfLines @skipWebCI', async () => {
            expect(await tab.getNumberOfLines()).toBe(5)
        })

        it('clearText @skipWeb', async () => {
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

            it('getResultCount @skipWebCI', async () => {
                expect(await findWidget.getResultCount()).toEqual([1, 1])
            })

            it('setReplaceText @skipWebCI', async () => {
                await findWidget.setReplaceText('manual text')
                await findWidget.replace()
                expect(await tab.getTextAtLine(3)).toBe('This is an manual text change.')
            })
        })
    })

    describe('ProblemsView', () => {
        let problemsView: ProblemsView
        let editorView: EditorView

        it('should show no problems in the beginning', async () => {
            const workbench = await browser.getWorkbench()
            const bottomBar = workbench.getBottomBar()

            problemsView = await bottomBar.openProblemsView()
            expect(await problemsView.getAllVisibleMarkers(MarkerType.Any)).toHaveLength(0)
        })

        it('should create problems @skipWeb', async () => {
            await browser.executeWorkbench(async (vscode) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const doc = await vscode.workspace.openTextDocument(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    vscode.Uri.file(`${vscode.workspace.rootPath}/test/wdio.conf.ts`)
                )
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return vscode.window.showTextDocument(doc, {
                    viewColumn: vscode.ViewColumn.Active
                })
            })
            const workbench = await browser.getWorkbench()
            editorView = workbench.getEditorView()
            const tab = await editorView.openEditor('wdio.conf.ts') as TextEditor
            await tab.setText('I am creating problems')

            await browser.waitUntil(async () => {
                const markers = await problemsView.getAllVisibleMarkers(MarkerType.Any)
                return markers.length > 0
            })

            /**
             * ensure deprecated command works in the same way
             */
            expect((await problemsView.getAllMarkers()).length)
                .toEqual((await problemsView.getAllVisibleMarkers(MarkerType.Any)).length)
        })

        it('can access problem information @skipWeb', async () => {
            const [marker] = await problemsView.getAllVisibleMarkers(MarkerType.Any)
            expect(await marker.getFileName()).toBe('wdio.conf.ts')
            expect(await marker.getText()).toContain('problems in file wdio.conf.ts of folder test')

            expect(await marker.problems[0].getText()).toBe('Unexpected keyword or identifier.')
            expect(await marker.problems[0].getSource()).toBe('ts')
            expect(await marker.problems[0].getLocation()).toEqual([1, 1])
            expect(await marker.problems[0].getType()).toBe(MarkerType.Error)

            await editorView.closeEditor('wdio.conf.ts')
        })
    })

    describe('WebView', () => {
        let webviews: WebView[] = []

        it('should have no webviews in the beginning', async () => {
            const workbench = await browser.getWorkbench()
            expect(await workbench.getAllWebviews()).toHaveLength(0)
        })

        it('should be able to open webview @skipWeb', async () => {
            const workbench = await browser.getWorkbench()
            await workbench.executeCommand('Test Extension: Open WebView')

            await browser.waitUntil(async () => (await workbench.getAllWebviews()).length > 0)
            webviews = await workbench.getAllWebviews()
            expect(webviews).toHaveLength(1)
            await webviews[0].open()

            expect(await browser.getPageSource()).toContain('My WebView')
            await expect($('h1')).toHaveText('Hello World!')
        })

        it('should be able to leave the webview context @skipWeb', async () => {
            await webviews[0].close()
            expect(await browser.getPageSource()).not.toContain('My WebView')
        })

        it('should be able to find webview by title @skipWeb', async () => {
            const workbench = await browser.getWorkbench()
            const webview = await workbench.getWebviewByTitle('My WebView')
            await webview.open()
            await expect($('h1')).toHaveText('Hello World!')
            await webview.close()
        })
    })

    describe('TreeView', () => {
        let treeViewSection: ViewSection
        it('should be able to find the extension tree view', async () => {
            const workbench = await browser.getWorkbench()

            const explorerView = await workbench.getActivityBar().getViewControl('Explorer')
            const explorerSideBarView = await explorerView?.openView()
            expect(explorerSideBarView).toBeInstanceOf(SideBarView)

            const sidebar = workbench.getSideBar()

            const sections = await sidebar.getContent().getSections()
            expect(sections.length).toBeGreaterThan(1) // explorer and our tree view at least

            treeViewSection = await sidebar.getContent().getSection('TEST EXTENSION TREEVIEW')
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await expect(treeViewSection.elem).toBePresent()

            expect(await treeViewSection.getTitle()).toBe('Test Extension Treeview')
        })

        let customTreeItem: CustomTreeItem
        it('should be able to expand the tree and iterate over the tree items', async () => {
            await treeViewSection.expand()
            expect(await treeViewSection.isExpanded()).toBe(true)
            await browser.waitUntil(async () => (await treeViewSection.getVisibleItems()).length > 0)

            const visItems = await treeViewSection.getVisibleItems()
            visItems.forEach((visItem) => expect(visItem).toBeInstanceOf(TreeItem))
            expect(visItems.length).toBe(2)

            expect(await Promise.all(visItems.map(
                async (item) => `${item.locatorKey} "${await (item as TreeItem).getLabel()}"`
            ))).toEqual([
                'TreeItem,CustomTreeItem "Item 1"',
                'TreeItem,CustomTreeItem "Item 2"'
            ])

            expect(visItems[0]).toBeInstanceOf(CustomTreeItem)
            customTreeItem = visItems[0] as CustomTreeItem
        })

        it('should be able to click the action button within a tree item element', async () => {
            const actions = await customTreeItem.getActionButtons()
            expect(actions.length).toBe(1)

            expect(actions[0].getLabel()).toBe('Call Me!')

            await customTreeItem.select()
            await actions[0].elem.click()

            const workbench = await browser.getWorkbench()
            await browser.waitUntil(async () => {
                const notifs = await workbench.getNotifications()
                const messages = await Promise.all(notifs.map((n) => n.getMessage()))
                return messages.includes('I got called!')
            }, {
                timeoutMsg: 'Could not find notification as reaction to action item click'
            })
        })

        it('should be able to iterate over child items from tree item element', async () => {
            expect(await customTreeItem.isExpandable()).toBe(true)
            await customTreeItem.expand()
            expect(await customTreeItem.isExpanded()).toBe(true)
            expect(await customTreeItem.hasChildren()).toBe(true)
            const childItems = await customTreeItem.getChildren()
            expect(childItems.length).toBe(1)
            expect(await childItems[0].getLabel()).toBe('Item 1.1')
            expect(await childItems[0].getTooltip()).toBe('Tooltip for item 1.1')
            expect(await childItems[0].getDescription()).toBe('Description for item 1.1')
        })

        it('should be able to find the explorer tree view', async () => {
            const workbench = await browser.getWorkbench()

            const explorerView = await workbench.getActivityBar().getViewControl('Explorer')
            const explorerSideBarView = await explorerView?.openView()
            expect(explorerSideBarView).toBeInstanceOf(SideBarView)

            const sidebar = workbench.getSideBar()

            const sectionName = isWebTest ? '/ [TEST FILES]' : 'WDIO-VSCODE-SERVICE'
            treeViewSection = await sidebar.getContent().getSection(sectionName)
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await expect(treeViewSection.elem).toBePresent()

            // one would expect 'mount' here (aria-label)
            const sectionTitle = isWebTest ? 'mount' : 'wdio-vscode-service'
            expect(await treeViewSection.getTitle()).toBe(sectionTitle)

            await treeViewSection.expand()
            expect(await treeViewSection.isExpanded()).toBe(true)
        })

        it('should be able to iterate over the (default) tree items', async () => {
            if (treeViewSection !== undefined) {
                const visItems = await treeViewSection.getVisibleItems()
                visItems.forEach((visItem) => expect(visItem).toBeInstanceOf(TreeItem))
                expect(visItems.length).toBeGreaterThanOrEqual(1) // at least README.md

                /* gives a read ECONNRESET RequestError... often
                const labels = await Promise.all(visItems.map(
                    async (item) => [await (item as TreeItem).getLabel(), item]
                )) */
                let readmeItem: TreeItem | undefined
                for (const visItem of visItems as TreeItem[]) {
                    // slow down a bit to avoid ECONNRESET... (todo investigate better way)
                    await sleep(50)
                    const label = await visItem.getLabel()
                    if (label === 'README.md') {
                        readmeItem = visItem
                        break
                    }
                }
                expect(readmeItem).toBeDefined()
                if (readmeItem !== undefined) {
                    expect(readmeItem).toBeInstanceOf(DefaultTreeItem)
                    expect(await readmeItem.isExpandable()).toBe(false)
                    expect(await readmeItem.hasChildren()).toBe(false)
                    expect((await readmeItem.getTooltip())?.endsWith(('README.md'))).toBe(true)
                    expect(await readmeItem.getDescription()).toBeUndefined()
                }
            }
        })
    })
})
