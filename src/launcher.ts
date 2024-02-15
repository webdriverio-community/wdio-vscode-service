import fs from 'node:fs/promises'
import path from 'node:path'
import { format } from 'node:util'

import downloadBundle, { DownloadOptions } from 'download'
import logger from '@wdio/logger'
import { setGlobalDispatcher, request, ProxyAgent } from 'undici'
import { download } from '@vscode/test-electron'
import { SevereServiceError } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import { HttpsProxyAgent } from 'hpagent'

import startServer from './server/index.js'
import {
    fileExist, directoryExists, isMultiremote, isChrome
} from './utils.js'
import {
    DEFAULT_CHANNEL, VSCODE_RELEASES, VSCODE_MANIFEST_URL, DEFAULT_CACHE_PATH,
    VSCODE_CAPABILITY_KEY, VSCODE_WEB_STANDALONE, DEFAULT_VSCODE_WEB_HOSTNAME
} from './constants.js'
import type {
    ServiceOptions, VSCodeCapabilities, WebStandaloneResponse,
    Bundle
} from './types.js'

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

// set up proxy if environment variable HTTPS_PROXY or https_proxy is set
let downloadAgentConfiguration: Partial<DownloadOptions> | undefined
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.npm_config_proxy
if (httpsProxy) {
    const proxyUrl = new URL(httpsProxy)
    const token = proxyUrl.username && proxyUrl.password
        ? `Basic ${btoa(`${proxyUrl.username}:${proxyUrl.password}`)}`
        : undefined

    setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl.protocol + proxyUrl.host, token }))
    // @ts-expect-error downloadAgentConfiguration is not part of the official API
    downloadAgentConfiguration = { agent: new HttpsProxyAgent({ proxy: proxyUrl }) }
}
// use HTTPS_PROXY or https_proxy for @vscode/test-electron if not already set
if (httpsProxy !== process.env.npm_config_proxy) {
    process.env.npm_config_proxy = httpsProxy
}

const VERSIONS_TXT = 'versions.txt'
const log = logger('wdio-vscode-service/launcher')
export default class VSCodeServiceLauncher {
    private _cachePath: string
    private _vscodeServerPort?: number

    constructor (
        private _options: ServiceOptions,
        private _capabilities: WebdriverIO.Capabilities
    ) {
        this._cachePath = this._options.cachePath || DEFAULT_CACHE_PATH
    }

    async onPrepare (_: never, capabilities: Capabilities.RemoteCapabilities) {
        const caps: VSCodeCapabilities[] = Array.isArray(capabilities)
            ? capabilities.map((c) => ((c as Capabilities.W3CCapabilities).alwaysMatch || c) as VSCodeCapabilities)
            : Object.values(capabilities).map((c) => c.capabilities as VSCodeCapabilities)

        /**
         * Check if we already have the VS Code bundle for the given version
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
            this._mapBrowserCapabilities(this._options)
        }
    }

    /**
     * Set up VSCode for web testing
     * @param versionsFileExist true if we already have information stored about cached VSCode bundles
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
     * @param versionsFileExist true if we already have information stored about cached VSCode bundles
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
            const content = JSON.parse((await fs.readFile(versionsFilePath, 'utf-8')).toString()) as Versions

            const vscodeVersion = content[version]?.vscode
            const chromedriverVersion = content[version]?.chromedriver
            const vscodePath = cap[VSCODE_CAPABILITY_KEY]?.binary
                || path.join(this._cachePath, `vscode-${process.platform}-${process.arch}-${vscodeVersion}`)

            if (vscodeVersion && chromedriverVersion && await fileExist(vscodePath)) {
                log.info(
                    `Skipping download, bundle for VSCode v${vscodeVersion} already exists`
                )

                Object.assign(cap, this._options)
                cap.browserVersion = chromedriverVersion
                cap[VSCODE_CAPABILITY_KEY].binary ||= await this._downloadVSCode(vscodeVersion)
                return
            }
        }

        const vscodeVersion = await this._fetchVSCodeVersion(version)
        const chromedriverVersion = await this._fetchChromedriverVersion(vscodeVersion)

        Object.assign(cap, this._options)
        cap.browserVersion = chromedriverVersion
        cap[VSCODE_CAPABILITY_KEY].binary ||= await this._downloadVSCode(vscodeVersion)
        await this._updateVersionsTxt(version, vscodeVersion, chromedriverVersion, versionsFileExist)
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

            return chromium.version.split('.')[0]
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
                await downloadBundle(info.url, folder, { extract: true, strip: 1, ...downloadAgentConfiguration })
            }

            return { path: folder, vscodeVersion, version: info.version }
        } catch (err: any) {
            throw new SevereServiceError(`Couldn't set up VSCode Web: ${err.message}`)
        }
    }

    private async _updateVersionsTxt (
        version: string,
        vscodeVersion: string,
        chromedriverVersion: string,
        versionsFileExist: boolean
    ) {
        const newContent: Versions = {
            [version]: {
                chromedriver: chromedriverVersion,
                vscode: vscodeVersion
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
            throw new SevereServiceError('This service doesn\'t support multiremote yet')
        }

        for (const cap of this._capabilities as any as WebdriverIO.Capabilities[]) {
            if (isChrome(cap)) {
                Object.assign(cap, options)
            }
        }
    }
}
