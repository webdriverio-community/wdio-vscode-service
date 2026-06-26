import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { format } from 'node:util'
import { execFileSync } from 'node:child_process'

import downloadBundle, { DownloadOptions } from '@xhmikosr/downloader'
import logger from '@wdio/logger'
import { setGlobalDispatcher, request, ProxyAgent } from 'undici'
import { download } from '@vscode/test-electron'
import { SevereServiceError } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import { HttpsProxyAgent } from 'hpagent'

import startServer from './server/index.js'
import { fileExist, directoryExists } from './utils.js'
import {
    DEFAULT_CHANNEL, VSCODE_RELEASES, VSCODE_MANIFEST_URL,
    DEFAULT_CACHE_PATH, VSCODE_CAPABILITY_KEY, VSCODE_WEB_STANDALONE, DEFAULT_VSCODE_WEB_HOSTNAME
} from './constants.js'
import type {
    ServiceOptions, VSCodeCapabilities, WebStandaloneResponse,
    Bundle, CoverageOptions
} from './types.js'

interface BundleInformation {
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
type Versions = { [desiredVersion: string]: BundleInformation | undefined }

// set up proxy if environment variable HTTPS_PROXY or https_proxy is set
let downloadAgentConfiguration: Partial<DownloadOptions> | undefined
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.npm_config_proxy
if (httpsProxy) {
    const proxyUrl = new URL(httpsProxy)
    const token = proxyUrl.username && proxyUrl.password
        ? `Basic ${btoa(`${proxyUrl.username}:${proxyUrl.password}`)}`
        : undefined

    setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl.protocol + proxyUrl.host, token }))
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
    private _coverageOptions?: CoverageOptions
    private _coverageTempDir?: string

    constructor (private _options: ServiceOptions) {
        this._cachePath = this._options.cachePath || DEFAULT_CACHE_PATH
        this._coverageOptions = this._options.coverage
    }

    async onPrepare (_: never, capabilities: Capabilities.TestrunnerCapabilities) {
        if (this._coverageOptions?.enabled) {
            const tmpDir = path.resolve(process.cwd(), '.wdio-v8-coverage')
            await fs.mkdir(tmpDir, { recursive: true })
            this._coverageTempDir = tmpDir
            process.env.NODE_V8_COVERAGE = tmpDir
            log.info(`V8 coverage enabled, collecting to ${tmpDir}`)
        }
        const caps: VSCodeCapabilities[] = Array.isArray(capabilities)
            ? capabilities.map((c) => ((c as Capabilities.W3CCapabilities).alwaysMatch || c) as VSCodeCapabilities)
            : Object.values(capabilities).map((c) => (c as any).capabilities as VSCodeCapabilities)

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
            cap[VSCODE_CAPABILITY_KEY].version = version

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
                cap.browserVersion = chromedriverVersion
                cap[VSCODE_CAPABILITY_KEY].version = version === 'insiders' ? 'insiders' : vscodeVersion
                cap[VSCODE_CAPABILITY_KEY].binary ||= await this._downloadVSCode(vscodeVersion)
                return
            }
        }

        let vscodeVersion = await this._fetchVSCodeVersion(version)
        let chromedriverVersion: string | undefined
        try {
            chromedriverVersion = await this._fetchChromedriverVersion(vscodeVersion)
        } catch {
            const match = vscodeVersion.match(/^(\d+)\.(\d+)\.\d+$/)
            if (match) {
                const fallbackVersion = `${match[1]}.${parseInt(match[2], 10) - 1}.0`
                log.info(`Manifest not available for ${vscodeVersion}, falling back to ${fallbackVersion}`)
                vscodeVersion = fallbackVersion
                chromedriverVersion = await this._fetchChromedriverVersion(vscodeVersion)
            } else {
                throw new SevereServiceError(
                    `Couldn't fetch Chromedriver version for VS Code ${vscodeVersion}`
                )
            }
        }

        cap.browserVersion = chromedriverVersion
        cap[VSCODE_CAPABILITY_KEY].version = version === 'insiders' ? 'insiders' : vscodeVersion
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

        const maxRetries = 3
        for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
            try {
                log.info(`Fetch releases from ${VSCODE_RELEASES}`)
                const { statusCode, body: versions } = await request(VSCODE_RELEASES, {})
                if (statusCode !== 200) {
                    const text = await versions.text()
                    throw new Error(
                        `VS Code releases API returned HTTP ${statusCode}: ${
                            text.slice(0, 200)}`
                    )
                }
                const availableVersions: string[] = await versions.json() as string[]
                if (!Array.isArray(availableVersions) || availableVersions.length === 0) {
                    const data = JSON.stringify(availableVersions)
                    throw new Error(
                        `VS Code releases API returned unexpected data: ${
                            data.slice(0, 200)}`
                    )
                }

                if (desiredReleaseChannel) {
                    const newDesiredReleaseChannel = desiredReleaseChannel === 'stable'
                        ? availableVersions[0]
                        : desiredReleaseChannel
                    if (!availableVersions.includes(newDesiredReleaseChannel)) {
                        throw new Error(
                            `Desired version "${newDesiredReleaseChannel}" is not existent, `
                            + `available versions: ${availableVersions.slice(0, 5).join(', ')}..., `
                            + `see ${VSCODE_RELEASES}`
                        )
                    }

                    return newDesiredReleaseChannel
                }

                return availableVersions[0]
            } catch (err: any) {
                if (attempt < maxRetries) {
                    const msg = err.message || String(err)
                    log.warn(
                        `Attempt ${attempt}/${maxRetries} to fetch VSCode version failed: `
                        + `${msg}, retrying...`
                    )
                    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
                    continue
                }
                throw new SevereServiceError(
                    `Couldn't fetch latest VSCode after ${maxRetries} attempts: `
                    + `${err.message || String(err)}`
                )
            }
        }
        throw new SevereServiceError(
            'Couldn\'t fetch latest VSCode: unexpected control flow'
        )
    }

    /**
     * Fetches required Chromedriver version for given VSCode version
     * @param vscodeVersion branch or tag version of VSCode repository
     * @returns required Chromedriver version
     */
    private async _fetchChromedriverVersion (vscodeVersion: string) {
        const normalizedVersion = vscodeVersion.replace(/^(\d+\.\d+)\.\d+$/, '$1.0')
        const url = format(VSCODE_MANIFEST_URL, normalizedVersion)
        try {
            const { statusCode, body } = await request(url, {})
            if (statusCode !== 200) {
                const text = await body.text()
                throw new Error(
                    `Manifest request returned HTTP ${statusCode} for ${normalizedVersion}: ${text.slice(0, 200)}`
                )
            }
            const manifest = await body.json() as Manifest
            const chromium = manifest.registrations.find((r: any) => r.component.git.name === 'chromium')

            if (!chromium) {
                throw new Error('Can\'t find chromium version in manifest response')
            }

            return chromium.version.split('.')[0]
        } catch (err: any) {
            throw new SevereServiceError(
                `Couldn't fetch Chromedriver version for ${normalizedVersion}: ${err.message || String(err)}`
            )
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

    async onComplete () {
        if (!this._coverageOptions?.enabled || !this._coverageTempDir) {
            return
        }

        const reportsDir = path.resolve(
            process.cwd(),
            this._coverageOptions.reportsDirectory || './coverage/wdio'
        )
        const reporters = this._coverageOptions.reporter || ['lcov', 'text']

        try {
            const entries = await fs.readdir(this._coverageTempDir)
            if (entries.length === 0) {
                log.warn('No V8 coverage data found; skipping report generation')
                return
            }

            const c8Args = [
                'report',
                '--temp-directory', this._coverageTempDir,
                '--reports-dir', reportsDir,
                '--exclude-after-remap',
                ...reporters.flatMap((r) => ['--reporter', r])
            ]

            if (this._coverageOptions.sourceDirectories) {
                for (const dir of this._coverageOptions.sourceDirectories) {
                    c8Args.push('--src', dir)
                }
            }
            if (this._coverageOptions.include) {
                for (const pattern of this._coverageOptions.include) {
                    c8Args.push('--include', pattern)
                }
            }
            if (this._coverageOptions.exclude) {
                for (const pattern of this._coverageOptions.exclude) {
                    c8Args.push('--exclude', pattern)
                }
            }

            log.info(`Generating coverage reports: ${reporters.join(', ')}`)
            const ownRequire = createRequire(import.meta.url)
            const c8Main = path.join(
                path.dirname(ownRequire.resolve('c8/package.json')),
                'bin',
                'c8.js'
            )
            execFileSync(
                process.execPath,
                [c8Main, ...c8Args],
                {
                    cwd: process.cwd(),
                    stdio: 'inherit'
                }
            )
            log.info(`Coverage reports written to ${reportsDir}`)
        } catch (err: any) {
            log.error(`Coverage report generation failed: ${err.message}`)
        }
    }
}
