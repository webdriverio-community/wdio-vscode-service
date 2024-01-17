/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { expect } from '@wdio/globals'

import {
    PageDecorator, BasePage
} from '../../dist/index.js'
import { TestPageObject, locators } from './utils.js'

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
