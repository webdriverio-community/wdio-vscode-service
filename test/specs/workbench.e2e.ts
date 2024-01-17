/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'
import { skip } from './utils.js'

describe('workbench', () => {
    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        const title = await workbench.getTitleBar().getTitle()

        if (await browser.isVSCodeWebSession()) {
            // works only in web session
            expect(title).toContain('[Test Files]')
        } else {
            // doesn't work in web session
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
