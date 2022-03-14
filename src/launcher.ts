import path from 'path'
import { format } from 'util'

import downloadBundle from 'download'
import logger from '@wdio/logger'
import { request } from 'undici'
import { download } from '@vscode/test-electron'
import { SevereServiceError } from 'webdriverio'
import { launcher as ChromedriverServiceLauncher } from 'wdio-chromedriver-service'
import type { Options, Capabilities } from '@wdio/types'

import { validatePlatform } from './utils'
import {
    DEFAULT_CHANNEL, VSCODE_RELEASES, VSCODE_MANIFEST_URL, CHROMEDRIVER_RELEASES,
    CHROMEDRIVER_DOWNLOAD_PATH, DEFAULT_CACHE_PATH
} from './constants'
import type { ServiceOptions, ServiceCapabilities, VSCodeChannel } from './types'

const log = logger('wdio-vscode-service/launcher')
export default class VSCodeServiceLauncher extends ChromedriverServiceLauncher {
    constructor (
        private _options: ServiceOptions,
        capabilities: Capabilities.Capabilities,
        config: Options.Testrunner
    ) {
        super(_options, capabilities, config)
    }

    // @ts-expect-error
    async onPrepare(_: never, capabilities: ServiceCapabilities[]) {
        const version = this._options.vscode?.version || DEFAULT_CHANNEL
        
        const serviceArgs = {} as any
        serviceArgs.version = await this._setupChromedriver(version)
        serviceArgs.path = await this._setupVSCode(serviceArgs.version)
        
        for (const cap of capabilities) {
            cap['wdio:vscodeService'] = serviceArgs
        }

        return super.onPrepare()
    }

    /**
     * Downloads Chromedriver bundle for given VSCode version
     * @param desiredReleaseChannel either release channel (e.g. "stable" or "insiders") or a concrete version e.g. 1.66.0
     * @returns "insiders" if `desiredReleaseChannel` is set to this otherwise a concrete version
     */
    private async _setupChromedriver (desiredReleaseChannel?: VSCodeChannel) {
        const version = await this._fetchVSCodeVersion(desiredReleaseChannel)

        try {
            const chromedriverVersion = await this._fetchChromedriverVersion(version)

            log.info(`Download Chromedriver (v${chromedriverVersion})`)
            await downloadBundle(
                format(CHROMEDRIVER_DOWNLOAD_PATH, chromedriverVersion, validatePlatform()),
                DEFAULT_CACHE_PATH,
                { extract: true, strip: 1 }
            )
            // @ts-expect-error
            this.chromedriverCustomPath = path.join(DEFAULT_CACHE_PATH, 'chromedriver')

            /**
             * return 'insiders' if desired release channel
             */
            return version === 'main' ? desiredReleaseChannel : version
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't set up Chromedriver ${err.message}`)
        }
    }

    /**
     * Download VSCode bundle
     * @param version VSCode version
     * @returns path to downloaded VSCode bundle
     */
    private async _setupVSCode (version: string) {
        try {
            log.info(`Download VSCode (stable)`)
            return await download({
                cachePath: DEFAULT_CACHE_PATH,
                version: version
            })
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't set up VSCode: ${err.message}`)
        }
    }

    /**
     * Get VSCode version based on desired channel or validate version if provided
     * @param desiredReleaseChannel either release channel (e.g. "stable" or "insiders") or a concrete version e.g. 1.66.0
     * @returns "main" if `desiredReleaseChannel` is "insiders" otherwise a concrete VSCode version
     */
    private async _fetchVSCodeVersion (desiredReleaseChannel?: VSCodeChannel) {
        if (desiredReleaseChannel === 'insiders') {
            return 'main'
        }

        try {
            log.info(`Fetch releases from ${VSCODE_RELEASES}`)
            const { body: versions } = await request(VSCODE_RELEASES, {})
            const availableVersions: string[] = await versions.json()

            if (desiredReleaseChannel) {
                /**
                 * validate provided VSCode version
                 */
                if (!availableVersions.includes(desiredReleaseChannel)) {
                    throw new Error(
                        `Desired version "${desiredReleaseChannel}" to existent, available versions:` +
                        `${availableVersions.slice(0, 5).join(', ')}..., see ${VSCODE_RELEASES}`)
                }

                return desiredReleaseChannel
            }

            return availableVersions[0] as string
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't fetch latest VSCode: ${err.message}`)
        }
    }

    /**
     * Fetches required Chromedriver version for given VSCode version
     * @param vscodeVersion branch or tag version of VSCode repository
     * @returns required Chromedriver version
     */
    private async _fetchChromedriverVersion (vscodeVersion: string) {
        try {
            const { body } = await request(format(VSCODE_MANIFEST_URL, vscodeVersion), {})
            const manifest = await body.json()
            const chromium = manifest.registrations.find((r: any) => r.component.git.name === 'chromium')
            
            const { body: chromedriverVersion } = await request(format(CHROMEDRIVER_RELEASES, chromium.version.split('.')[0]), {})
            return chromedriverVersion.text()
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't fetch Chromedriver version: ${err.message}`)
        }
    }
}
