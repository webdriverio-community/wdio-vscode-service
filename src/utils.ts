import fs from 'fs/promises'
import path from 'path'
import child_process from 'child_process'
import type { Dirent, Stats } from 'fs'

import { VSCODE_CAPABILITY_KEY } from './constants'
import type { VSCodeLocatorMap } from './pageobjects/utils'
import type { VSCodeCapabilities } from './types'

function isEmulatedRosettaEnvironment () {
    const archName = child_process.spawnSync('uname', ['-m']).stdout.toString().trim()

    if (archName !== 'x86_64') {
        return false
    }

    const processTranslated = child_process.spawnSync('sysctl', ['-in', 'sysctl.proc_translated'])
        .stdout.toString()
        .trim()
    return processTranslated === '1'
}

function getMacOsRealArch () {
    if (process.arch === 'arm64' || isEmulatedRosettaEnvironment()) {
        return 'mac64_m1'
    }

    if (process.arch === 'x64') {
        return 'mac64'
    }

    return null
}

export function validatePlatform () {
    if (process.platform === 'linux') {
        if (process.arch === 'arm64' || process.arch === 'x64') {
            return `${process.platform}64`
        }

        throw new Error('Only Linux 64 bits supported.')
    }

    if (process.platform === 'darwin' || process.platform === 'freebsd') {
        const osxPlatform = getMacOsRealArch()

        if (!osxPlatform) {
            throw new Error('Only Mac 64 bits supported.')
        }

        return osxPlatform
    }

    if (process.platform !== 'win32') {
        throw new Error(`Unexpected platform or architecture: ${process.platform}, ${process.arch}`)
    }

    return process.platform
}

export async function getLocators (version: string): Promise<VSCodeLocatorMap> {
    if (version === 'insiders') {
        return import('./locators/insiders') as any as Promise<VSCodeLocatorMap>
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
    return import(`./locators/${locatorFile}`) as Promise<VSCodeLocatorMap>
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
