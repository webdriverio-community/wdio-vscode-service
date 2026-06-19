#!/usr/bin/env node
/* eslint-disable node/shebang, @typescript-eslint/no-var-requires */

/**
 * we require here because `pkg` doesn't support ESM yet
 * see https://github.com/vercel/pkg/pull/1323
 */
const childProcess: typeof import('node:child_process') = require('node:child_process')
const argvParser: typeof import('yargs-parser') = require('yargs-parser')

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

    /**
     * Flags injected by ChromeDriver that VS Code's Electron binary does not recognise.
     * Passing them causes onUnknownOption → console.warn → EPIPE → crash (see issue #60).
     */
    const CHROMIUM_ONLY_FLAGS = new Set([
        // Added by ChromeDriver automatically
        'log-level', 'test-type', 'password-store', 'use-mock-keychain',
        'no-service-autorun', 'no-first-run', 'enable-automation',
        'remote-debugging-address', 'flag-switches-begin', 'flag-switches-end',
        'disable-field-trial-config', 'allow-pre-commit-input',
        'origin-trial-disabled-features', 'variations-seed-version',
        // Chrome-specific behaviour flags passed by wdio-vscode-service Chrome options
        'disable-background-networking', 'disable-client-side-phishing-detection',
        'disable-default-apps', 'disable-hang-monitor', 'disable-popup-blocking',
        'disable-prompt-on-repost', 'disable-sync', 'disable-updates',
        // Chrome-specific: must NOT reach VS Code (conflicts with disableExtensions: false)
        'disable-extensions',
        // Chrome feature-flag overrides — not valid VS Code CLI flags
        'enable-features', 'disable-features',
    ])

    const params = Object.entries(argv)
        .filter(([key, value]) =>
            // yargs-parser produces both kebab-case and camelCase keys; drop the camelCase duplicates
            !/[A-Z]/.test(key) &&
            // drop the internal routing flag consumed above
            key !== 'vscode-binary-path' &&
            // drop ChromeDriver-injected flags that VS Code doesn't understand
            !CHROMIUM_ONLY_FLAGS.has(key) &&
            // drop flags explicitly set to false / 'false'
            value !== false &&
            value !== 'false'
        )
        .flatMap(([key, value]) => {
            // Array values (e.g. extensionDevelopmentPath) → one --flag=val per element
            if (Array.isArray(value)) {
                const items = (value as unknown[]).filter((v) => v !== false && v !== 'false')
                return items.map((v) =>
                    typeof v === 'boolean' && v ? `--${key}` : `--${key}=${v}`
                )
            }
            if (typeof value === 'boolean' && value) {
                return [`--${key}`]
            }
            return [`--${key}=${value}`]
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
