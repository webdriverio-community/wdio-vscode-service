import { BottomBarViews as BottomBarViewsImport } from './1.84.0.js'

export * from './1.84.0.js'
export const locatorVersion = '1.87.0'

export const BottomBarViews = {
    ...BottomBarViewsImport,
    outputChannels: 'ul[aria-label="Output actions"] select'
}
