import fs from 'fs/promises'
import path from 'path'
import child_process from 'child_process'

import type { LocatorMap } from './pageobjects/utils'

function isEmulatedRosettaEnvironment() {
    const archName = child_process.spawnSync('uname', ['-m']).stdout.toString().trim();

    if (archName !== 'x86_64') {
        return false;
    }

    const processTranslated = child_process.spawnSync('sysctl', ['-in', 'sysctl.proc_translated'])
        .stdout.toString()
        .trim();
    return processTranslated === '1';
}

function getMacOsRealArch() {
    if (process.arch === 'arm64' || isEmulatedRosettaEnvironment()) {
        return 'mac64_m1';
    }

    if (process.arch === 'x64') {
        return 'mac64';
    }

    return null;
}

export function validatePlatform() {
    if (process.platform === 'linux') {
        if (process.arch === 'arm64' || process.arch === 'x64') {
            return `${process.platform}64`;
        }

        throw new Error('Only Linux 64 bits supported.');
    }
    
    if (process.platform === 'darwin' || process.platform === 'freebsd') {
        const osxPlatform = getMacOsRealArch();

        if (!osxPlatform) {
            console.log('Only Mac 64 bits supported.');
            process.exit(1);
        }

        return osxPlatform;
    } else if (process.platform !== 'win32') {
        throw new Error(`Unexpected platform or architecture: ${process.platform}, ${process.arch}`);
    }

    return process.platform;
}

export async function getLocators (version: string): Promise<LocatorMap> {
    const files = (await fs.readdir(path.join(__dirname, 'locators'), { encoding: 'utf-8' }))
        .filter((filename) => filename.endsWith('.js') && !filename.endsWith('.d.ts'))
        .map((filename) => filename.slice(0, -3))
    
    const [major, minor] = version.split('.')
    const sanitizedVersion = `${major}.${minor}.0`
    const locatorFile = files.find((f) => f >= sanitizedVersion) || files[files.length - 1]
    return import(`./locators/${locatorFile}`)
}

export function fileExist (path: string) {
    return fs.access(path).then(() => true, () => false)
}