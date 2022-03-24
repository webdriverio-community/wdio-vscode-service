import { ElementWithContextMenu } from '../utils'

/**
 * View with channel selector/**
 *
 * @category BottomBar
 */
export abstract class ChannelView<T> extends ElementWithContextMenu<T> {
    protected actionsLabel!: string

    /**
    * Get names of all selectable channels
    * @returns Promise resolving to array of strings - channel names
    */
    async getChannelNames (): Promise<string[]> {
        const select = await this.parent.$(this.locatorMap.BottomBarViews.outputChannels as string)
        await select.click()
        const channels = await this.parent.$$(`${this.locatorMap.BottomBarViews.outputChannels} option`)

        const names = []
        for (const channel of channels) {
            names.push(await channel.getAttribute('value'))
        }
        return names
    }

    /**
     * Get name of the current channel
     * @returns Promise resolving to the current channel name
     */
    async getCurrentChannel (): Promise<string> {
        const combo = await this.parent.$(this.locatorMap.BottomBarViews.channelCombo as string)
        return combo.getAttribute('title')
    }

    /**
     * Select a channel using the selector combo
     * @param name name of the channel to open
     */
    async selectChannel (name: string): Promise<void> {
        const select = await this.parent.$(this.locatorMap.BottomBarViews.outputChannels as string)
        await select.click()
        const channels = await this.parent.$$(`${this.locatorMap.BottomBarViews.outputChannels} option`)
        for (const channel of channels) {
            const val = await channel.getValue()
            if (val === name) {
                await channel.click()
                // eslint-disable-next-line wdio/no-pause
                await browser.pause(200)
                await browser.keys(['Escape'])
                return
            }
        }
        throw new Error(`Channel ${name} not found`)
    }
}

/**
 * View with channel selection and text area
 */
export abstract class TextView<T> extends ChannelView<T> {
    protected actionsLabel!: string

    /**
     * Get all text from the currently open channel
     * @returns Promise resolving to the view's text
     */
    async getText (): Promise<string[]> {
        const lines = await this.elem.$(this.locatorMap.OutputView.lines as string)
        const textLines = await browser.execute(
            (elem) => Array.from(
                (elem as any as HTMLDivElement).children as any as ArrayLike<HTMLDivElement>
            ).map((l) => l.innerText),
            lines
        )

        return textLines
            // strip empty lines (usually the last one)
            .filter(Boolean)
            // replace `\u00A0` characters with white space
            // eslint-disable-next-line no-control-regex
            .map((l) => l.replace(/\u00A0/g, ' '))
    }

    /**
     * Clear the text in the current channel
     * @returns Promise resolving when the clear text button is pressed
     */
    async clearText (): Promise<void> {
        await this.parent
            .$((this.locatorMap.BottomBarViews.actionsContainer as Function)(this.actionsLabel) as string)
            .$(this.locatorMap.BottomBarViews.clearText as string)
            .click()
    }
}
