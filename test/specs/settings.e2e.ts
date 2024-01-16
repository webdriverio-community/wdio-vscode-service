/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

import {
    SettingsEditor
} from '../../dist/index.js'

describe('settings @skipWeb', () => {
    let settings: SettingsEditor

    it('openSettings', async () => {
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
