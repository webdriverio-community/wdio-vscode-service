import os from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'
import { format } from 'node:util'

import downloadBundle from 'download'
import logger from '@wdio/logger'
import { request } from 'undici'
import { download } from '@vscode/test-electron'
import { SevereServiceError } from 'webdriverio'
import { launcher as ChromedriverServiceLauncher } from 'wdio-chromedriver-service'
import type { Options, Capabilities } from '@wdio/types'

import startServer from './server/index.js'
import {
    validatePlatform, fileExist, directoryExists, isMultiremote,
    isChrome
} from './utils.js'
import {
    DEFAULT_CHANNEL, VSCODE_RELEASES, VSCODE_MANIFEST_URL, CHROMEDRIVER_RELEASES,
    CHROMEDRIVER_DOWNLOAD_PATH, DEFAULT_CACHE_PATH, VSCODE_CAPABILITY_KEY,
    VSCODE_WEB_STANDALONE, DEFAULT_VSCODE_WEB_HOSTNAME
} from './constants.js'
import type {
    ServiceOptions, ServiceCapability, VSCodeCapabilities, WebStandaloneResponse,
    Bundle
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
    private _vscodeServerPort?: number

    constructor (
        private _options: ServiceOptions,
        private _capabilities: Capabilities.Capabilities,
        config: Options.Testrunner
    ) {
        super(_options, _capabilities, config)
        this._cachePath = this._options.cachePath || DEFAULT_CACHE_PATH
        this._mapCapabilities = () => {}
    }

    // @ts-expect-error this service uses provided params
    async onPrepare (_: never, capabilities: Capabilities.RemoteCapabilities) {
        const caps: VSCodeCapabilities[] = Array.isArray(capabilities)
            ? capabilities.map((c) => ((c as Capabilities.W3CCapabilities).alwaysMatch || c) as VSCodeCapabilities)
            : Object.values(capabilities).map((c) => c.capabilities as VSCodeCapabilities)

        /**
         * check if for given version we already have all bundles
         * and continue without download if possible
         */
        const versionsFilePath = path.join(this._cachePath, VERSIONS_TXT)
        const versionsFileExist = await fileExist(versionsFilePath)

        for (const cap of caps) {
            /**
             * skip setup if user is not using VSCode as capability
             */
            if (typeof cap.browserName !== 'string' || !cap[VSCODE_CAPABILITY_KEY]) {
                continue
            }

            const version = cap[VSCODE_CAPABILITY_KEY].version || cap.browserVersion || DEFAULT_CHANNEL

            /**
             * setup VSCode Desktop
             */
            if (cap.browserName === 'vscode') {
                await this._setupVSCodeDesktop(versionsFileExist, versionsFilePath, version, cap)
                continue
            }

            /**
             * setup VSCode Web
             */
            await this._setupVSCodeWeb(version, cap)
            this._mapBrowserCapabilities(this.options as ServiceOptions)
        }

        return super.onPrepare()
    }

    /**
     * Set up VSCode for web testing
     * @param versionsFileExist true if we already have information stored about cached VSCode and Chromedriver bundles
     * @param versionsFilePath string with path to cached directory
     * @param cap capabilities used for this test run
     */
    private async _setupVSCodeWeb (
        version: string,
        cap: VSCodeCapabilities
    ) {
        /**
         * no need to do any work if we already started the server
         */
        if (this._vscodeServerPort || !cap[VSCODE_CAPABILITY_KEY]) {
            return
        }

        try {
            const vscodeStandalone = await this._fetchVSCodeWebStandalone(version)
            const port = await startServer(vscodeStandalone, cap[VSCODE_CAPABILITY_KEY])
            cap[VSCODE_CAPABILITY_KEY].serverOptions = {
                ...(cap[VSCODE_CAPABILITY_KEY].serverOptions || {
                    hostname: DEFAULT_VSCODE_WEB_HOSTNAME
                }),
                port
            }
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't start server for VSCode Web: ${err.message}`)
        }
    }

    /**
     * Set up VSCode for desktop testing
     * @param versionsFileExist true if we already have information stored about cached VSCode and Chromedriver bundles
     * @param versionsFilePath string with path to cached directory
     * @param cap capabilities used for this test run
     */
    private async _setupVSCodeDesktop (
        versionsFileExist: boolean,
        versionsFilePath: string,
        version: string,
        cap: VSCodeCapabilities
    ) {
        if (!cap[VSCODE_CAPABILITY_KEY]) {
            throw new Error(`No key "${VSCODE_CAPABILITY_KEY}" found in caps`)
        }

        if (versionsFileExist) {
            const content = JSON.parse((await fs.readFile(versionsFilePath)).toString()) as Versions
            const chromedriverPath = path.join(this._cachePath, `chromedriver-${content[version]?.chromedriver}`)
            const vscodePath = (
                cap[VSCODE_CAPABILITY_KEY]?.binary
                || path.join(this._cachePath, `vscode-${process.platform}-${process.arch}-${content[version]?.vscode}`)
            )
            if (content[version] && await fileExist(chromedriverPath) && await fileExist(vscodePath)) {
                log.info(
                    `Skipping download, bundles for VSCode v${content[version]?.vscode} `
                    + `and Chromedriver v${content[version]?.chromedriver} already exist`
                )

                Object.assign(cap, this.options)
                cap[VSCODE_CAPABILITY_KEY].binary = (
                    cap[VSCODE_CAPABILITY_KEY].binary
                    || await this._downloadVSCode(content[version]?.vscode as string)
                )
                this.chromedriverCustomPath = chromedriverPath
                return
            }
        }

        const [vscodeVersion, chromedriverVersion, chromedriverPath] = await this._setupChromedriver(version)
        this.chromedriverCustomPath = chromedriverPath
        const serviceArgs: ServiceCapability = {
            chromedriver: { version: chromedriverVersion, path: chromedriverPath },
            vscode: {
                version: vscodeVersion,
                path: cap[VSCODE_CAPABILITY_KEY]?.binary || await this._downloadVSCode(vscodeVersion)
            }
        }
        Object.assign(cap, this.options)
        cap[VSCODE_CAPABILITY_KEY].binary = serviceArgs.vscode.path
        await this._updateVersionsTxt(version, serviceArgs, versionsFileExist)
    }

    /**
     * Downloads Chromedriver bundle for given VSCode version
     * @param desiredReleaseChannel either release channel (e.g. "stable" or "insiders")
     *                              or a concrete version e.g. 1.66.0
     * @returns "insiders" if `desiredReleaseChannel` is set to this otherwise a concrete version
     */
    private async _setupChromedriver (desiredReleaseChannel: string) {
        const version = await this._fetchVSCodeVersion(desiredReleaseChannel)

        try {
            const chromedriverVersion = await this._fetchChromedriverVersion(version)

            log.info(`Download Chromedriver (v${chromedriverVersion})`)
            await downloadBundle(
                format(CHROMEDRIVER_DOWNLOAD_PATH, chromedriverVersion, validatePlatform(chromedriverVersion)),
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
    private async _downloadVSCode (version: string) {
        try {
            log.info(`Download VSCode binary (${version})`)
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
    private async _fetchVSCodeVersion (desiredReleaseChannel?: string) {
        if (desiredReleaseChannel === 'insiders') {
            return 'main'
        }

        try {
            log.info(`Fetch releases from ${VSCODE_RELEASES}`)
            const { body: versions } = await request(VSCODE_RELEASES, {})
            const availableVersions: string[] = await versions.json() as string[]

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
            const manifest = await body.json() as Manifest
            const chromium = manifest.registrations.find((r: any) => r.component.git.name === 'chromium')

            if (!chromium) {
                throw new Error('Can\'t find chromium version in manifest response')
            }

            const { body: chromedriverVersion } = await request(
                format(CHROMEDRIVER_RELEASES, chromium.version.split('.')[0]),
                {}
            )
            return await chromedriverVersion.text()
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't fetch Chromedriver version: ${err.message}`)
        }
    }

    /**
     * Fetches VSCode Web files
     * ToDo(Christian): allow to define a local VSCode development path
     *                  to be able to skip this part
     */
    private async _fetchVSCodeWebStandalone (vscodeVersion: string): Promise<Bundle> {
        if (vscodeVersion !== 'stable' && vscodeVersion !== 'insiders') {
            throw new Error('Running VSCode in the browser is only supported for "stable" and "insiders" version')
        }

        try {
            const { body } = await request(format(VSCODE_WEB_STANDALONE, vscodeVersion), {})
            const info = await body.json() as WebStandaloneResponse
            const folder = path.join(this._cachePath, `vscode-web-${vscodeVersion}-${info.version}`)

            if (!(await directoryExists(folder))) {
                await downloadBundle(info.url, folder, { extract: true, strip: 1 })
            }

            return { path: folder, vscodeVersion, version: info.version }
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't set up VSCode Web: ${err.message}`)
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

    private _mapBrowserCapabilities (options: ServiceOptions) {
        if (isMultiremote(this._capabilities)) {
            throw new SevereServiceError('This service deson\'t support multiremote yet')
        }

        for (const cap of this._capabilities as any as Capabilities.Capabilities[]) {
            if (isChrome(cap)) {
                Object.assign(cap, options)
            }
        }
    }
}
