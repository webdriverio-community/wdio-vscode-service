#!/usr/bin/env node

// eslint-disable-next-line node/shebang
import childProcess from 'child_process'
import argvParser from 'yargs-parser'

/**
 * Chrome wrapper run method
 * @param  {Object} p         Node.js global variable
 * @param  {Object} execFile  child_process.execFile function
 * @return {Object}           child process running chrome
 */
function run (p: NodeJS.Process, execFile: typeof childProcess.execFile) {
    console.info('[FAKE VSCode Binary] init...') // eslint-disable-line no-console

    p.on(
        'uncaughtException',
        /* istanbul ignore next */
        // eslint-disable-next-line no-console
        (err) => console.info(`[FAKE VSCode Binary] Error: ${err.stack}`)
    )

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _: positionalParams, ...argv } = argvParser(process.argv.slice(2), {
        configuration: { 'camel-case-expansion': true, 'boolean-negation': false }
    })

    const binaryPath = argv.vscodeBinaryPath as string
    if (!binaryPath) {
        throw new Error('Missing parameter "--vscode-binary-path=/..."')
    }

    const params = Object.entries(argv).map(([key, value]) => {
        if (typeof value === 'boolean' && value) {
            return `--${key}`
        }
        return `--${key}=${value}`
    })
    const args: string[] = [...params, ...positionalParams.map(String)]

    // eslint-disable-next-line no-console
    console.info(`[FAKE VSCode Binary] starting: ${binaryPath}`, args.join(' '))
    const cp = execFile(binaryPath, args, {
        env: p.env,
        cwd: p.cwd()
    })

    cp.stderr?.on(
        'data',
        // eslint-disable-next-line no-console
        (msg) => console.log(`[FAKE VSCode Binary] STDERR: ${msg}`)
    )
    cp.stdout?.on(
        'data',
        // eslint-disable-next-line no-console
        (msg) => console.log(`[FAKE VSCode Binary] STDOUT: ${msg}`)
    )

    return cp
}

/* istanbul ignore if */
if (require.main === module) {
    run(process, childProcess.execFile)
} else {
    module.exports = run
}
