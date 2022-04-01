import os from 'os'
import fs from 'fs/promises'
import path from 'path'
import { format } from 'util'

import downloadBundle from 'download'
import logger from '@wdio/logger'
import { request } from 'undici'
import { download } from '@vscode/test-electron'
import { SevereServiceError } from 'webdriverio'
import { launcher as ChromedriverServiceLauncher } from 'wdio-chromedriver-service'
import type { Options, Capabilities } from '@wdio/types'

import { validatePlatform, fileExist } from './utils'
import {
    DEFAULT_CHANNEL, VSCODE_RELEASES, VSCODE_MANIFEST_URL, CHROMEDRIVER_RELEASES,
    CHROMEDRIVER_DOWNLOAD_PATH, DEFAULT_CACHE_PATH
} from './constants'
import type {
    ServiceOptions, ServiceCapability, ServiceCapabilities, VSCodeChannel
} from './types'

interface BundeInformation {
    chromedriver: string
    vscode: string
}
interface Manifest {
    registrations: Registration[]
}
interface Registration {
    version: string
    component: {
        git: {
            name: string
        }
    }
}
type Versions = { [desiredVersion: string]: BundeInformation | undefined }

const VERSIONS_TXT = 'versions.txt'
const log = logger('wdio-vscode-service/launcher')
export default class VSCodeServiceLauncher extends ChromedriverServiceLauncher {
    private _cachePath: string

    constructor (
        private _options: Omit<ServiceOptions, 'args'>,
        capabilities: Capabilities.Capabilities,
        config: Options.Testrunner
    ) {
        super(_options, capabilities, config)
        this._cachePath = this._options.cachePath || DEFAULT_CACHE_PATH
    }

    async onPrepare (_: never, capabilities: ServiceCapabilities[]) {
        const version = this._options.vscode?.version || DEFAULT_CHANNEL

        /**
         * check if for given version we already have all bundles
         * and continue without download if possible
         */
        const versionsFilePath = path.join(this._cachePath, VERSIONS_TXT)
        const versionsFileExist = await fileExist(versionsFilePath)
        if (versionsFileExist) {
            const content = JSON.parse((await fs.readFile(versionsFilePath)).toString()) as Versions
            const chromedriverPath = path.join(this._cachePath, `chromedriver-${content[version]?.chromedriver}`)
            const vscodePath = path.join(this._cachePath, `vscode-${process.platform}-${content[version]?.vscode}`)

            if (content[version] && await fileExist(chromedriverPath) && await fileExist(vscodePath)) {
                log.info(
                    `Skipping download, bundles for VSCode v${content[version]?.vscode} `
                    + `and Chromedriver v${content[version]?.chromedriver} already exist`
                )

                this.chromedriverCustomPath = chromedriverPath
                this._populateCaps(capabilities, {
                    chromedriver: { version: content[version]!.chromedriver, path: chromedriverPath },
                    vscode: {
                        version: content[version]!.vscode,
                        path: await this._setupVSCode(content[version]!.vscode)
                    }
                })
                return super.onPrepare()
            }
        }

        const [vscodeVersion, chromedriverVersion, chromedriverPath] = await this._setupChromedriver(version)
        this.chromedriverCustomPath = chromedriverPath
        const serviceArgs: ServiceCapability = {
            chromedriver: { version: chromedriverVersion, path: chromedriverPath },
            vscode: { version: vscodeVersion, path: await this._setupVSCode(vscodeVersion) }
        }

        this._populateCaps(capabilities, serviceArgs)
        await this._updateVersionsTxt(version, serviceArgs, versionsFileExist)
        return super.onPrepare()
    }

    private _populateCaps (capabilities: ServiceCapabilities[], serviceArgs: ServiceCapability) {
        for (const cap of capabilities) {
            cap['wdio:vscodeService'] = serviceArgs
        }
    }

    /**
     * Downloads Chromedriver bundle for given VSCode version
     * @param desiredReleaseChannel either release channel (e.g. "stable" or "insiders")
     *                              or a concrete version e.g. 1.66.0
     * @returns "insiders" if `desiredReleaseChannel` is set to this otherwise a concrete version
     */
    private async _setupChromedriver (desiredReleaseChannel: VSCodeChannel) {
        const version = await this._fetchVSCodeVersion(desiredReleaseChannel)

        try {
            const chromedriverVersion = await this._fetchChromedriverVersion(version)

            log.info(`Download Chromedriver (v${chromedriverVersion})`)
            await downloadBundle(
                format(CHROMEDRIVER_DOWNLOAD_PATH, chromedriverVersion, validatePlatform()),
                this._cachePath,
                { extract: true, strip: 1 }
            )

            const ext = os.platform().startsWith('win') ? '.exe' : ''
            const chromedriverPath = path.join(this._cachePath, `chromedriver-${chromedriverVersion}${ext}`)
            await fs.rename(path.join(this._cachePath, `chromedriver${ext}`), chromedriverPath)

            /**
             * return 'insiders' if desired release channel
             */
            return version === 'main'
                ? [desiredReleaseChannel, chromedriverVersion, chromedriverPath]
                : [version, chromedriverVersion, chromedriverPath]
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
            log.info('Download VSCode (stable)')
            return await download({
                cachePath: this._cachePath,
                version
            })
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't set up VSCode: ${err.message}`)
        }
    }

    /**
     * Get VSCode version based on desired channel or validate version if provided
     * @param desiredReleaseChannel either release channel (e.g. "stable" or "insiders")
     *                              or a concrete version e.g. 1.66.0
     * @returns "main" if `desiredReleaseChannel` is "insiders" otherwise a concrete VSCode version
     */
    private async _fetchVSCodeVersion (desiredReleaseChannel?: VSCodeChannel | string) {
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
                const newDesiredReleaseChannel = desiredReleaseChannel === 'stable'
                    ? availableVersions[0]
                    : desiredReleaseChannel
                if (!availableVersions.includes(newDesiredReleaseChannel)) {
                    throw new Error(
                        `Desired version "${newDesiredReleaseChannel}" is not existent, available versions:`
                        + `${availableVersions.slice(0, 5).join(', ')}..., see ${VSCODE_RELEASES}`
                    )
                }

                return newDesiredReleaseChannel
            }

            return availableVersions[0]
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
            const manifest: Manifest = await body.json()
            const chromium = manifest.registrations.find((r: any) => r.component.git.name === 'chromium')

            const { body: chromedriverVersion } = await request(
                format(CHROMEDRIVER_RELEASES, chromium!.version.split('.')[0]),
                {}
            )
            return await chromedriverVersion.text()
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't fetch Chromedriver version: ${err.message}`)
        }
    }

    private async _updateVersionsTxt (version: string, serviceArgs: ServiceCapability, versionsFileExist: boolean) {
        const newContent: Versions = {
            [version]: {
                chromedriver: serviceArgs.chromedriver.version,
                vscode: serviceArgs.vscode.version
            }
        }
        const versionsTxtPath = path.join(this._cachePath, VERSIONS_TXT)
        if (!versionsFileExist) {
            return fs.writeFile(
                versionsTxtPath,
                JSON.stringify(newContent, null, 4),
                'utf-8'
            )
        }

        const content = JSON.parse((await fs.readFile(versionsTxtPath, 'utf-8')).toString())
        return fs.writeFile(
            versionsTxtPath,
            JSON.stringify({ ...content, ...newContent }, null, 4),
            'utf-8'
        )
    }
}
