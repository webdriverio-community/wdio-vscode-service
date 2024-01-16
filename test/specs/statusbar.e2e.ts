/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

import {
    StatusBar
} from '../../dist/index.js'

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
