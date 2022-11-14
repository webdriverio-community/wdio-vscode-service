import {
    BottomBarViews as BottomBarViewsImport
} from './1.70.0'

export * from './1.70.0'
export const locatorVersion = '1.73.0'
export const BottomBarViews = {
    ...BottomBarViewsImport,
    outputChannels: 'select[title="Tasks"]'
}
