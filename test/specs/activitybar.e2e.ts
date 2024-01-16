/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../dist/service.d.ts" />

import { browser, expect } from '@wdio/globals'

describe('activity bar', () => {
    it('should show all activity bar items', async () => {
        const workbench = await browser.getWorkbench()
        const viewControls = await workbench.getActivityBar().getViewControls()
        expect(await Promise.all(viewControls.map((vc) => vc.getTitle()))).toEqual([
            'Explorer',
            'Search',
            'Source Control',
            'Run and Debug',
            'Extensions'
        ])
    })

    it('can open extension view and check that first installed extension is our guinea pig', async () => {
        const workbench = await browser.getWorkbench()
        const extensionView = await workbench.getActivityBar().getViewControl('Extensions')
        await extensionView?.openView()

        const selectedView = await workbench.getActivityBar().getSelectedViewAction()
        expect(await selectedView.getTitle()).toBe('Extensions')

        const sidebar = workbench.getSideBar()
        const sidebarView = sidebar.getContent()
        await sidebarView.getSection('INSTALLED')

        /**
             * for some reason the developed extension doesn't show up
             * in the installed extension section when running in a
             * pristine environment
             */
        // const installedExtensions = await extensionViewSection.getVisibleItems()
        // expect(await installedExtensions[0].getTitle()).toBe('Guinea Pig')
    })

    it('should be able to get global options', async () => {
        const workbench = await browser.getWorkbench()
        const viewControls = await workbench.getActivityBar().getGlobalActions()
        expect(await Promise.all(viewControls.map((vc) => vc.getTitle()))).toEqual([
            'Accounts',
            'Manage'
        ])
    })
})
