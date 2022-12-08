import {
    BottomBarViews as BottomBarViewsImport
} from './1.70.0.js'

export * from './1.70.0.js'
export const locatorVersion = '1.73.0'
export const BottomBarViews = {
    ...BottomBarViewsImport,
    outputChannels: 'select[title="Tasks"]'
}
