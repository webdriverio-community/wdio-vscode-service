/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

import {
    BottomBarPanel

} from '../../dist/index.js'
import { skip } from './utils.js'

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

    skip('CI')('can read from terminal @skipWeb', async () => {
        const terminalView = await bottomBar.openTerminalView()
        const text = await terminalView.getText()
        expect(text).toContain(':wdio-vscode-service')
    })
})
