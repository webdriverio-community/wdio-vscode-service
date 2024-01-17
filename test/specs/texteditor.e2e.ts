/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import path from 'node:path'
import { browser, expect } from '@wdio/globals'

import {
    TextEditor, FindWidget
} from '../../dist/index.js'

/**
     * started to fail in web environment with VS Code v1.83.0
     */
describe.skip('TextEditor', () => {
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
