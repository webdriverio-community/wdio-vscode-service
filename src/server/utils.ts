import fs from 'node:fs/promises'
import path from 'node:path'

import { fsProviderExtensionPrefix, fsProviderFolderUri } from './constants.js'

const { URI } = (await import('vscode-uri')).default

export interface IConfig {
    readonly extensionPaths: string[] | undefined
    readonly extensionIds: GalleryExtensionInfo[] | undefined
    readonly extensionDevelopmentPath: string | undefined
    readonly extensionTestsPath: string | undefined
    readonly build: Sources | Static | CDN
    readonly folderUri: string | undefined
    readonly folderMountPath: string | undefined
    readonly printServerLog: boolean
}

export interface GalleryExtensionInfo {
    readonly id: string
    readonly preRelease?: boolean
}

export interface Sources {
    readonly type: 'sources'
    readonly location: string
}

export interface Static {
    readonly type: 'static'
    readonly location: string
    readonly quality: 'stable' | 'insider'
    readonly version: string
}

export interface CDN {
    readonly type: 'cdn'
    readonly uri: string
}

interface IDevelopmentOptions {
    extensionTestsPath?: URIComponents
    extensions?: URIComponents[]
}

interface URIComponents {
    scheme: string
    authority: string
    path: string
}

interface IWorkbenchOptions {
    additionalBuiltinExtensions?: (string | URIComponents | GalleryExtensionInfo)[]
    developmentOptions?: IDevelopmentOptions
    productConfiguration?: { [key: string]: any }

    // options of the builtin workbench (vs/code/browser/workbench/workbench)
    folderUri?: URIComponents
    workspaceUri?: URIComponents
}

export async function getWorkbenchOptions (
    ctx: { protocol: string, host: string },
    config: IConfig
): Promise<IWorkbenchOptions> {
    const options: IWorkbenchOptions = {}
    if (config.extensionPaths) {
        const extensionPromises = config.extensionPaths.map(
            (extensionPath, index) => scanForExtensions(extensionPath, {
                scheme: ctx.protocol,
                authority: ctx.host,
                path: `/static/extensions/${index}`
            })
        )
        options.additionalBuiltinExtensions = (await Promise.all(extensionPromises)).flat()
    }
    if (config.extensionIds) {
        if (!options.additionalBuiltinExtensions) {
            options.additionalBuiltinExtensions = []
        }

        options.additionalBuiltinExtensions.push(...config.extensionIds)
    }
    if (config.extensionDevelopmentPath) {
        const developmentOptions: IDevelopmentOptions = options.developmentOptions = {}

        developmentOptions.extensions = await scanForExtensions(
            config.extensionDevelopmentPath,
            { scheme: ctx.protocol, authority: ctx.host, path: '/static/devextensions' }
        )
        if (config.extensionTestsPath) {
            let relativePath = path.relative(config.extensionDevelopmentPath, config.extensionTestsPath)
            if (process.platform === 'win32') {
                relativePath = relativePath.replace(/\\/g, '/')
            }
            developmentOptions.extensionTestsPath = {
                scheme: ctx.protocol,
                authority: ctx.host,
                path: path.posix.join('/static/devextensions', relativePath)
            }
        }
    }
    if (config.folderMountPath) {
        if (!options.additionalBuiltinExtensions) {
            options.additionalBuiltinExtensions = []
        }
        options.additionalBuiltinExtensions.push({
            scheme: ctx.protocol,
            authority: ctx.host,
            path: fsProviderExtensionPrefix
        })
        options.folderUri = URI.parse(fsProviderFolderUri)
    } else if (config.folderUri) {
        options.folderUri = URI.parse(config.folderUri)
    } else {
        options.workspaceUri = URI.from({ scheme: 'tmp', path: '/default.code-workspace' })
    }
    options.productConfiguration = { enableTelemetry: false }
    return options
}

export async function scanForExtensions (
    rootPath: string,
    serverURI: URIComponents
): Promise<URIComponents[]> {
    const result: URIComponents[] = []
    async function getExtension (relativePosixFolderPath: string): Promise<URIComponents | undefined> {
        try {
            const packageJSONPath = path.join(rootPath, relativePosixFolderPath, 'package.json')
            if ((await fs.stat(packageJSONPath)).isFile()) {
                return {
                    scheme: serverURI.scheme,
                    authority: serverURI.authority,
                    path: path.posix.join(serverURI.path, relativePosixFolderPath)
                }
            }
        } catch {
            return undefined
        }

        return undefined
    }

    async function processFolder (relativePosixFolderPath: string) {
        const extension = await getExtension(relativePosixFolderPath)
        if (extension) {
            result.push(extension)
        } else {
            const folderPath = path.join(rootPath, relativePosixFolderPath)
            const entries = await fs.readdir(folderPath, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name.charAt(0) !== '.') {
                    await processFolder(path.posix.join(relativePosixFolderPath, entry.name))
                }
            }
        }
    }

    await processFolder('')
    return result
}
