/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

describe('editor', () => {
    describe('getOpenTabs', () => {
        it('returns an empty array when no tabs are open', async () => {
            const workbench = await browser.getWorkbench()
            await workbench.getEditorView().closeAllEditors()

            expect(await workbench.getEditorView().getOpenTabs()).toStrictEqual([])
        })
    })
})
