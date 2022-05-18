import fs from 'fs/promises'
import path from 'path'

import logger from '@wdio/logger'
import getPort from 'get-port'
import fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { request } from 'undici'

import getWorkbench from './workbench.tpl'
import { getWorkbenchOptions } from './utils'
import { getFileType } from '../utils'
import { fsProviderExtensionPrefix } from './constants'
import { DEFAULT_VSCODE_WEB_PORT, DEFAULT_CHANNEL } from '../constants'
import type { VSCodeOptions, Bundle } from '../types'

const log = logger('wdio-vscode-service/server')

const mountPrefix = '/static/mount'

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
        origin: (origin) => {
            if (/^https:\/\/[^.]+\.vscode-webview\.net$/.test(origin)) {
                return origin
            }
            return undefined
        }
    })

    app.addHook('preHandler', async (_, reply, done) => {
        await reply.header('Access-Control-Allow-Origin', '*')
        done()
    })

    log.info(`Serving dev extensions from ${options.extensionPath}`)
    await app.register(fastifyStatic, {
        prefix: '/static/devextensions',
        root: options.extensionPath
    })

    await app.register(fastifyStatic, {
        prefix: '/static/build',
        root: standalone.path
    })

    if (options.workspacePath) {
        log.info(`Serve workspace from ${options.workspacePath}`)
        await app.register(fastifyStatic, {
            prefix: mountPrefix,
            root: options.workspacePath
        })
        await app.register(fastifyStatic, {
            prefix: fsProviderExtensionPrefix,
            root: path.join(__dirname, 'fs-provider')
        })
        app.get(`${mountPrefix}(/.*)?`, async (req, reply) => {
            if (!options.workspacePath) {
                return null
            }

            const p = path.join(options.workspacePath, req.url.slice(mountPrefix.length))
            try {
                const stats = await fs.stat(p)

                if (stats.isFile()) {
                    return reply.serialize({
                        type: getFileType(stats),
                        ctime: stats.ctime.getTime(),
                        mtime: stats.mtime.getTime(),
                        size: stats.size
                    })
                }

                if (stats.isDirectory()) {
                    const entries = await fs.readdir(p, { withFileTypes: true })
                    return reply.serialize(
                        entries.map((d) => ({ name: d.name, type: getFileType(d) }))
                    )
                }

                return null
            } catch (e) {
                return reply.serialize({
                    error: (e as NodeJS.ErrnoException).code
                })
            }
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
        const host = `${req.protocol}://${req.hostname}:${port}`
        const url = `${host}/${req.url}/out/vs/code/browser/workbench/callback.html`
        const { body } = await request(url, {})
        await reply.send(body)
    })

    app.get('/', async (req, reply) => {
        const host = `${req.protocol}://${req.hostname}:${port}`
        const config = {
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
        const webConfiguration = getWorkbenchOptions(
            { protocol: req.protocol, host },
            config
        )
        const template = getWorkbench({
            baseUrl: `${req.protocol}://${req.hostname}/${req.url}`,
            webConfiguration: JSON.stringify(webConfiguration),
            authSession: '',
            builtinExtensions: '[]',
            main: '<script>require([\'vs/code/browser/workbench/workbench\'], function() {});</script>'
        })
        await reply.send(template)
    })

    await app.listen(port)
    return port
}
