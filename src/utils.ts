import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import type { Dirent, Stats } from 'node:fs'

import { VSCODE_CAPABILITY_KEY } from './constants.js'
import type { VSCodeLocatorMap } from './pageobjects/utils.js'
import type { VSCodeCapabilities } from './types.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function getLocators (version: string): Promise<VSCodeLocatorMap> {
    if (version === 'insiders') {
        return import('./locators/insiders.js') as any as Promise<VSCodeLocatorMap>
    }

    const files = (await fs.readdir(path.join(__dirname, 'locators'), { encoding: 'utf-8' }))
        .filter((filename) => filename.endsWith('.js') && !filename.endsWith('.d.ts'))
        .map((filename) => filename.slice(0, -3))

    const [major, minor] = version.split('.')
    const sanitizedVersion = `${major}.${minor}.0`

    const locatorFile = files.find((f, i) => (
        f === sanitizedVersion
        || (files[i + 1] && files[i + 1] > sanitizedVersion)
    )) || files[files.length - 1]
    return import(`./locators/${locatorFile}.js`) as Promise<VSCodeLocatorMap>
}

export function fileExist (filepath: string) {
    return fs.access(filepath).then(() => true, () => false)
}

export async function directoryExists (directoryPath: string) {
    try {
        const stats = await fs.stat(directoryPath)
        return stats.isDirectory()
    } catch {
        return false
    }
}

export function getValueSuffix (value: string | boolean) {
    if (typeof value === 'boolean' && value) {
        return ''
    }
    return `=${value}`
}

export function isVSCodeCapability (cap: VSCodeCapabilities) {
    return Boolean(cap[VSCODE_CAPABILITY_KEY])
}

enum FileType {
    Unknown = 0,
    File = 1,
    Directory = 2,
    SymbolicLink = 64
}

export function getFileType (stats: Stats | Dirent) {
    if (stats.isFile()) {
        return FileType.File
    }

    if (stats.isDirectory()) {
        return FileType.Directory
    }

    if (stats.isSymbolicLink()) {
        return FileType.SymbolicLink
    }

    return FileType.Unknown
}

export const isMultiremote = (obj: any) => typeof obj === 'object' && !Array.isArray(obj)
export const isChrome = (cap: VSCodeCapabilities) => cap.browserName && cap.browserName.toLowerCase() === 'chrome'
