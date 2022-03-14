import child_process from 'child_process'

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