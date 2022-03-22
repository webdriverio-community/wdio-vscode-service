<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO loves VSCode" src="https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/.github/assets/banner.png">
    </a>
</p>

# WDIO VSCode Service [![CI](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml/badge.svg)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml)

> WebdriverIO service for testing VSCode extensions.

This WebdriverIO service allows you to seamlessly test your VSCode extensions from end to end. You only need to provide a path to your extension and the service does the rest by:

- Installing VSCode (either `stable`, `insiders` or a specified version)
- Downloading Chromedriver specific to given VSCode version
- Starting VSCode with custom user settings
- Bootstraping page objects with locators matching your VSCode version

This project was highly inspired by the [vscode-extension-tester](https://www.npmjs.com/package/vscode-extension-tester) project which is based on Selenium. This package takes the idea and adapts it for WebdriverIO.

## Installation

To initiate a new WebdriverIO project, run:

```bash
npm create wdio ./
```

An installation wizard will guide you through the process. Ensure you select TypeScript as compiler and don't have it generate page objects for you given this project comes with all page objects needed. Then make sure to select `vscode` within the list of services:

![Install Demo](https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/.github/assets/demo.gif "Install Demo")

For more information on how to install `WebdriverIO`, please check the [project docs](https://webdriver.io/docs/gettingstarted).

## Example Configuration

To use the service you need to add `vscode` to your services array, followed by a configuration object:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    services: [
        ['vscode', {
            extensionPath: __dirname,
            vscode: {
                version: 'insiders' // or "stable" for latest VSCode version
            },
            userSettings: {
                "editor.fontSize": 14
            }
        }]
    ],
    // ...
};
```

In your `tsconfig.json` make sure to add `wdio-vscode-service` to your list of types:

```json
{
    "compilerOptions": {
        "types": [
            "node",
            "webdriverio/async",
            "@wdio/mocha-framework",
            "expect-webdriverio",
            "wdio-vscode-service"
        ],
        "target": "es2019",
        "moduleResolution": "node",
        "esModuleInterop": true
    }
}
```

You can then use the `getWorkspace` method to access the page objects for the locators matching your desired VSCode version:

```ts
describe('WDIO VSCode Service', () => {
    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toBe('[Extension Development Host] - README.md - wdio-vscode-service - Visual Studio Code')
    })
})
```

For the full page object documentation, check out the [docs](https://webdriverio-community.github.io/wdio-vscode-service/modules.html).

## Configuration

Through service configuration you can manage the VSCode version as well as user settings for VSCode:

### `vscode`

Define which VSCode application should be used for testing.

Type: `ServiceDownloadOptions`<br />
Default: `{ version: "stable" }`

### `cachePath`

Define a cache path to avoid re-downloading all bundles. This is useful for CI/CD to avoid re-downloading VSCode and Chromedriver for every testrun.

Type: `string`<br />
Default: `process.cwd()`

### `extensionPath`

Define the directory to the extension you want to test.

Type: `string`

### `userSettings`

Define custom user settings to be applied to VSCode.

Type: `Record<string, number | string | object | boolean>`<br />
Default: `{}`

### `workspacePath`

Opens VSCode for a specific workspace. If not provided VSCode starts without a workspace opened.

Type: `string`

### `filePath`

Opens VSCode with a specific file opened.

Type: `string`

### `args`

Additional start-up arguments. See [`argv.ts`](https://github.com/microsoft/vscode/blob/ef70f99af7c90bb37f6dbb797c36de76a51ba73b/src/vs/platform/environment/common/argv.ts#L6-L113) for all supported arguments.

Type: `string[]`<br />
Default: `[]`
