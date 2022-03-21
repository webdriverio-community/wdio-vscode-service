<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO loves VSCode" src="https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/.github/assets/banner.png">
    </a>
</p>

# WDIO VSCode Service [![CI](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml/badge.svg)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml)

> WebdriverIO service for testing VSCode extensions.

This WebdriverIO service allows you to seamlessly test your VSCode extensions e2e. You only need to provide a path to your extension and the service does the rest, e.g. installing VSCode (either latest, insiders or a specified version), downloads Chromedriver and provides you with a set of page objects that help you focus writing tests.

This project was highly inspired by the [vscode-extension-tester](https://www.npmjs.com/package/vscode-extension-tester) project which is based on Selenium. This package takes the idea and adapts it for WebdriverIO.

## Installation

```bash
npm i -D wdio-vscode-service
```

```bash
yarn i -D wdio-vscode-service
```

```bash
pnpm i -D wdio-vscode-service
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

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

For the full page object documentation, check out the [docs](/).

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
