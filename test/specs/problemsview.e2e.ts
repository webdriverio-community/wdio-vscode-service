/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

import {
    TextEditor, MarkerType,
    ProblemsView, EditorView
} from '../../dist/index.js'
import { skip } from './utils.js'

describe('ProblemsView', () => {
    let problemsView: ProblemsView
    let editorView: EditorView

    it('should show no problems in the beginning', async () => {
        const workbench = await browser.getWorkbench()
        const bottomBar = workbench.getBottomBar()

        problemsView = await bottomBar.openProblemsView()
        expect(await problemsView.getAllVisibleMarkers(MarkerType.Any)).toHaveLength(0)
    })

    it.skip('should create problems @skipWeb', async () => {
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

    skip('CI')('can access problem information @skipWeb', async () => {
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
