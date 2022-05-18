import fs from 'fs/promises'
import path from 'path'

import logger from '@wdio/logger'
import getPort from 'get-port'
import fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'

import { getFileType } from '../utils'
import { DEFAULT_VSCODE_WEB_PORT } from '../constants'
import type { VSCodeOptions } from '../types'

const log = logger('wdio-vscode-service/server')

const mountPrefix = '/static/mount'

/**
 * ToDo(Christian): missing capabilities:
 *   - allow serve VSCode sources from path location or CDN
 *   - allow to include additional extensions (#20)
 */
export default async function startServer (sourcePath: string, options: VSCodeOptions) {
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

    const proxyPath = path.join(__dirname, 'proxy')
    log.info(`Serving proxy from ${proxyPath}`)
    await app.register(fastifyStatic, {
        prefix: '/static/devextensions',
        root: proxyPath
    })

    await app.register(fastifyStatic, {
        prefix: '/static/build',
        root: sourcePath
    })

    if (options.workspacePath) {
        log.info(`Serve workspace path from ${options.workspacePath}`)
        await app.register(fastifyStatic, {
            prefix: mountPrefix,
            root: options.workspacePath
        })
        await app.register(fastifyStatic, {
            prefix: '/static/extensions/fs',
            root: path.join(__dirname, 'fs-provider')
        })
        app.get(`${mountPrefix}(/.*)?`, async (req, reply) => {
            const p = path.join(options.workspacePath!, req.url.slice(mountPrefix.length))
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
     * ToDo(Christian): implement workbench
     */
    // app.use(workbench(config));

    await app.listen(port)
    return port
}
