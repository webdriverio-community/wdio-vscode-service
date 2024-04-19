import {
    PageDecorator, BasePage, IPageDecorator
} from '../../dist/index.js'

export const isWebTest = Boolean(parseInt(process.env.VSCODE_WEB_TESTS || '', 10))

type ToSkip = NodeJS.Platform | 'CI'

/**
 * Skips tests on certain platforms or CI
 * @param param platforms to skip the test on or 'CI' to skip on CI
 * @returns it or it.skip function
 */
export function skip (param: ToSkip | ToSkip[] = process.platform) {
    const toSkip = Array.isArray(param) ? param : [param]
    return toSkip.includes(process.platform) || (toSkip.includes('CI') && process.env.CI) ? it.skip : it
}

export const locators = {
    marquee: {
        elem: 'ul[aria-label="Active View Switcher"]',
        menuitems: 'li'
    }
}

export interface TestPageObject extends IPageDecorator<typeof locators.marquee> {}
@PageDecorator(locators.marquee)
export class TestPageObject extends BasePage<typeof locators.marquee, typeof locators> {
    public locatorKey = 'marquee' as const

    itemCnt (): Promise<number> {
        return this.menuitems$$.length
    }
}
