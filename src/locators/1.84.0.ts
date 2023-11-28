import {
    BottomBarPanel as BottomBarPanelImport
} from './1.73.0.js'

export * from './1.73.0.js'
export const locatorVersion = '1.84.0'

export const BottomBarPanel = {
    ...BottomBarPanelImport,
    tabContainer: '.bottom ul[aria-label="Active View Switcher"]'
}
