/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

import {
    TitleBar
} from '../../dist/index.js'
import { skip } from './utils.js'

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
    skip(['darwin', 'CI'])('can click top level item', async () => {
        const workbench = await browser.getWorkbench()
        const itemHelp = await titleBar.getItem('Help')
        const menuHelp = await itemHelp?.select()
        const itemWelcome = await menuHelp?.getItem('Welcome')
        await itemWelcome?.select()

        const activeTab = await workbench.getEditorView().getActiveTab()
        expect(await activeTab?.getTitle()).toEqual('Welcome')
    })

    /**
         * started to fail in web environment with VS Code v1.83.0
         */
    it.skip('can click nested item', async () => {
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
