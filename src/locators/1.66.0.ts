import {
    BottomBarViews as BottomBarViewsImport
} from './1.61.0'

export * from './1.61.0'
export const locatorVersion = '1.66.0'
export const BottomBarViews = {
    ...BottomBarViewsImport,
    outputChannels: 'select[aria-label="Output Channels"]'
}
