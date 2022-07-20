import fs from 'fs/promises'
import path from 'path'

import logger from '@wdio/logger'
import getPort from 'get-port'
import fastify, { FastifyRequest } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { request } from 'undici'

import getWorkbench from './workbench.tpl'
import { getWorkbenchOptions } from './utils'
import { getFileType } from '../utils'
import { fsProviderExtensionPrefix } from './constants'
import { DEFAULT_VSCODE_WEB_PORT, DEFAULT_CHANNEL, DEFAULT_VSCODE_WEB_HOSTNAME } from '../constants'
import type { VSCodeOptions, Bundle } from '../types'

const log = logger('wdio-vscode-service/server')

const mountPrefix = '/static/mount'
const webviewHostRegexp = /^https:\/\/[^.]+\.vscode-webview\.net$/

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
        origin: (origin, cb) => cb(null, webviewHostRegexp.test(origin))
    })

    app.addHook('preHandler', async (_, reply) => {
        await reply.header('Access-Control-Allow-Origin', '*')
    })

    // COI
    app.addHook('preHandler', async (req: COIRequest, reply) => {
        const value = req.query['vscode-coi']
        if (value === '1') {
            await reply.header('Cross-Origin-Opener-Policy', 'same-origin')
        } else if (value === '2') {
            await reply.header('Cross-Origin-Embedder-Policy', 'require-corp')
        } else if (value === '3' || value === '') {
            await reply.header('Cross-Origin-Opener-Policy', 'same-origin')
            await reply.header('Cross-Origin-Embedder-Policy', 'require-corp')
        }
    })

    if (options.extensionPath) {
        log.info(`Serving dev extensions from ${options.extensionPath}`)
        await app.register(fastifyStatic, {
            prefix: '/static/devextensions',
            root: options.extensionPath
        })
    }

    await app.register(fastifyStatic, {
        prefix: '/static/build',
        root: standalone.path,
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
        const url = `${host}/${req.url}/out/vs/code/browser/workbench/callback.html`
        const { body } = await request(url, {})
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
                    location: standalone.path,
                    quality: (options.version || DEFAULT_CHANNEL) as 'stable' | 'insider',
                    version: standalone.version
                },
                extensionTestsPath: undefined,
                folderUri: undefined,
                folderMountPath: options.workspacePath,
                printServerLog: true
            }
        )

        const template = getWorkbench({
            baseUrl: `${host}/static/build`,
            webConfiguration: JSON.stringify(webConfiguration).replace(/"/g, '&quot;'),
            authSession: '',
            builtinExtensions: '[]'
        })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        reply.header('Content-Type', 'text/html')
        return reply.send(template)
    })

    await app.listen(port)
    log.info(`VSCode server started on port ${port}`)
    return port
}
