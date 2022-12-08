import { browser } from '@wdio/globals'

describe('my webview', () => {
    it('should be displayed', async () => {
        console.log('Hello World!')
        // eslint-disable-next-line wdio/no-pause
        await browser.pause(5000)
    })
})
