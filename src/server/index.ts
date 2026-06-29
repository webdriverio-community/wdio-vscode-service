import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import getPort from 'get-port'
import fastify, { FastifyRequest } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { request } from 'undici'

import getWorkbench from './workbench.tpl.js'
import { getWorkbenchOptions } from './utils.js'
import { getFileType } from '../utils.js'
import { fsProviderExtensionPrefix } from './constants.js'
import { DEFAULT_VSCODE_WEB_PORT, DEFAULT_CHANNEL, DEFAULT_VSCODE_WEB_HOSTNAME } from '../constants.js'
import type { VSCodeOptions, Bundle } from '../types.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const log = logger('wdio-vscode-service/server')

const mountPrefix = '/static/mount'
const webviewHostRegexp = /^https:\/\/[^.]+\.vscode-webview\.net$/

// eslint-disable-next-line max-len
const workbenchBootstrapModule = `import { create, URI } from '../../../workbench/workbench.web.main.internal.js';
(function () {
    const configElement = document.getElementById('vscode-workbench-web-configuration');
    const configElementAttribute = configElement ? configElement.getAttribute('data-settings') : undefined;
    if (!configElement || !configElementAttribute) {
        throw new Error('Missing web configuration element');
    }
    const config = JSON.parse(configElementAttribute);
    let workspace;
    if (config.folderUri) {
        workspace = { folderUri: URI.revive(config.folderUri) };
    } else if (config.workspaceUri) {
        workspace = { workspaceUri: URI.revive(config.workspaceUri) };
    }
    if (config.additionalBuiltinExtensions) {
        config.additionalBuiltinExtensions = config.additionalBuiltinExtensions.map(
            function (ext) { return ext && ext.scheme ? URI.revive(ext) : ext; }
        );
    }
    if (config.developmentOptions && config.developmentOptions.extensions) {
        config.developmentOptions.extensions = config.developmentOptions.extensions.map(
            function (ext) { return URI.revive(ext); }
        );
    }
    create(document.body, {
        ...config,
        settingsSyncOptions: config.settingsSyncOptions ? { enabled: config.settingsSyncOptions.enabled } : undefined,
        workspaceProvider: {
            workspace,
            trusted: true,
            open: async () => false
        }
    });
})();
`

type COIRequest = FastifyRequest<{
    Querystring: {
        'vscode-coi': '1' | '2' | '3'
    }
}>

/**
 * ToDo(Christian): missing capabilities:
 *   - allow serve VSCode sources from path location or CDN
 *   - allow to include additional extensions (#20)
 */
export default async function startServer (standalone: Bundle, options: VSCodeOptions) {
    const app = fastify({ logger: true })
    const port = await getPort({ port: options.serverOptions?.port || DEFAULT_VSCODE_WEB_PORT })
    await app.register(fastifyCors, {
        methods: ['GET'],
        credentials: true,
        origin: (origin, cb) => cb(null, webviewHostRegexp.test(origin || ''))
    })

    app.addHook('preHandler', async (req: COIRequest, reply) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        reply.header('Access-Control-Allow-Origin', '*')

        const value = req.query['vscode-coi']
        if (value === '1') {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Cross-Origin-Opener-Policy', 'same-origin')
        } else if (value === '2') {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Cross-Origin-Embedder-Policy', 'require-corp')
        } else if (value === '3' || value === '') {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Cross-Origin-Opener-Policy', 'same-origin')
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Cross-Origin-Embedder-Policy', 'require-corp')
        }
    })

    let bundlePath = standalone.path
    let workbenchHtmlPath = path.join(bundlePath, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html')
    let hasEsmWorkbench = await fs.access(workbenchHtmlPath).then(() => true, () => false)

    if (!hasEsmWorkbench) {
        const topEntries = await fs.readdir(bundlePath).catch(() => [] as string[])
        log.info(`Bundle root contents: ${topEntries.join(', ')}`)
        if (topEntries.length === 1 && !topEntries[0].includes('.')) {
            const nestedBase = path.join(bundlePath, topEntries[0])
            const nestedPath = path.join(nestedBase, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html')
            hasEsmWorkbench = await fs.access(nestedPath).then(() => true, () => false)
            if (hasEsmWorkbench) {
                workbenchHtmlPath = nestedPath
                bundlePath = nestedBase
            }
        }
    }
    log.info(`ESM workbench detection: ${hasEsmWorkbench} (path: ${bundlePath})`)

    if (hasEsmWorkbench) {
        app.get('/static/build/out/vs/code/browser/workbench/workbench.css', async (req, reply) => {
            const cssPath = path.join(bundlePath, 'out', 'vs', 'workbench', 'workbench.web.main.internal.css')
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Content-Type', 'text/css')
            return reply.send(await fs.readFile(cssPath))
        })

        app.get('/static/build/out/vs/code/browser/workbench/workbench.js', async (req, reply) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Content-Type', 'application/javascript')
            return reply.send(workbenchBootstrapModule)
        })
    }

    if (options.extensionPath) {
        log.info(`Serving dev extensions from ${options.extensionPath}`)
        await app.register(fastifyStatic, {
            prefix: '/static/devextensions',
            root: options.extensionPath
        })
    }

    await app.register(fastifyStatic, {
        prefix: '/static/build',
        root: bundlePath,
        decorateReply: false // the reply decorator has been added by the first plugin registration
    })

    if (options.workspacePath) {
        log.info(`Serve workspace from ${options.workspacePath}`)
        app.addHook('preHandler', async (req, reply) => {
            const filePath = (req.params as { '*': string })['*']
            const queries = Object.keys(req.query as Record<string, string>)

            if (!options.workspacePath || !filePath || !req.url.startsWith(mountPrefix)) {
                return null
            }

            const p = path.join(
                options.workspacePath,
                filePath === mountPrefix.slice(1)
                    ? filePath.slice(mountPrefix.length - 1)
                    : filePath
            )
            if (queries.includes('stat')) {
                try {
                    const stats = await fs.stat(p)
                    // eslint-disable-next-line @typescript-eslint/return-await
                    return reply.send(JSON.stringify({
                        type: getFileType(stats),
                        ctime: stats.ctime.getTime(),
                        mtime: stats.mtime.getTime(),
                        size: stats.size
                    }))
                } catch (e: any) {
                    log.warn(e.stack)
                    return reply.send(JSON.stringify({
                        error: (e as NodeJS.ErrnoException).code
                    }))
                }
            }

            if (queries.includes('readdir')) {
                try {
                    const entries = await fs.readdir(p, { withFileTypes: true })
                    // eslint-disable-next-line @typescript-eslint/return-await
                    return reply.send(JSON.stringify(
                        entries.map((d) => ({ name: d.name, type: getFileType(d) }))
                    ))
                } catch (e: any) {
                    log.warn(e.stack)
                    return reply.send(JSON.stringify({
                        error: (e as NodeJS.ErrnoException).code
                    }))
                }
            }

            return null
        })

        await app.register(fastifyStatic, {
            prefix: `${mountPrefix}/`,
            root: options.workspacePath,
            dotfiles: 'allow',
            decorateReply: false // the reply decorator has been added by the first plugin registration
        })
        await app.register(fastifyStatic, {
            prefix: fsProviderExtensionPrefix,
            root: path.join(__dirname, '..', '..', 'src', 'server', 'fs-provider'),
            decorateReply: false // the reply decorator has been added by the first plugin registration
        })
    }

    /**
     * mount additional extensions here, e.g.:
     * ```
     * if (config.extensionPaths) {
     *   config.extensionPaths.forEach((extensionPath, index) => {
     *     console.log('Serving additional built-in extensions from ' + extensionPath);
     *     app.use(kmount(`/static/extensions/${index}`, kstatic(extensionPath, serveOptions)));
     *   });
     * }
     * ```
     * when working on https://github.com/webdriverio-community/wdio-vscode-service/issues/20
     */

    /**
     * Workbench
     */
    app.get('/callback', async (req, reply) => {
        const host = `${req.protocol}://${req.hostname || DEFAULT_VSCODE_WEB_HOSTNAME}:${port}`
        const cbUrl = `${host}/${req.url}/out/vs/code/browser/workbench/callback.html`
        const { body } = await request(cbUrl, {})
        await reply.send(body)
    })

    app.get('/', async (req, reply) => {
        const hostname = req.hostname || DEFAULT_VSCODE_WEB_HOSTNAME
        const host = `${req.protocol}://${hostname}`
        const webConfiguration = await getWorkbenchOptions(
            { protocol: req.protocol, host: hostname },
            {
                /**
                 * modify when support additional extension
                 */
                extensionPaths: [],
                extensionIds: [], // GalleryExtensionInfo[] | undefined
                extensionDevelopmentPath: options.extensionPath,
                build: {
                    type: 'static' as const,
                    location: bundlePath,
                    quality: (options.version || DEFAULT_CHANNEL) as 'stable' | 'insider',
                    version: standalone.version
                },
                extensionTestsPath: undefined,
                folderUri: undefined,
                folderMountPath: options.workspacePath,
                printServerLog: true
            }
        )

        const baseUrl = `${host}/static/build`

        if (hasEsmWorkbench) {
            let html = await fs.readFile(workbenchHtmlPath, 'utf-8')
            const nlsUrl = `${baseUrl}/out/nls.messages.js`
            html = html
                .replace(/\{\{WORKBENCH_WEB_BASE_URL\}\}/g, baseUrl)
                .replace(
                    /\{\{WORKBENCH_WEB_CONFIGURATION\}\}/g,
                    JSON.stringify(webConfiguration).replace(/"/g, '&quot;')
                )
                .replace(/\{\{WORKBENCH_AUTH_SESSION\}\}/g, '')
                .replace(/\{\{WORKBENCH_NLS_FALLBACK_URL\}\}/g, nlsUrl)
                .replace(/\{\{WORKBENCH_NLS_URL\}\}/g, nlsUrl)
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            reply.header('Content-Type', 'text/html')
            return reply.send(html)
        }

        const template = getWorkbench({
            baseUrl,
            webConfiguration: JSON.stringify(webConfiguration).replace(/"/g, '&quot;'),
            authSession: '',
            builtinExtensions: '[]'
        })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        reply.header('Content-Type', 'text/html')
        return reply.send(template)
    })

    await app.listen({ port })
    log.info(`VSCode server started on port ${port}`)
    return port
}
