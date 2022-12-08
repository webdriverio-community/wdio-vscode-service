/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable node/no-unpublished-import */
/**
 * VS Code doesn't support ESM yet, therefor we need this CJS entry point
 */
const vscode: typeof import('vscode') = require('vscode')

exports.run = async () => {
    const { run } = await import('../index.js')
    return run(vscode)
}
