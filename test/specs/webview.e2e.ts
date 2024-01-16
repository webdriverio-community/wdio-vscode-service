/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect, $ } from '@wdio/globals'

import {
    WebView
} from '../../dist/index.js'

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
