<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO loves VSCode" src="https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/.github/assets/banner.png">
    </a>
</p>

# WDIO VSCode Service [![CI](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml/badge.svg)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml)

Tested on:

[![](https://img.shields.io/badge/VSCode%20Version-insiders%20%2F%20stable%20%2F%20v1.65.0-brightgreen)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml) [![](https://img.shields.io/badge/Platform-windows%20%2F%20macos%20%2F%20ubuntu-brightgreen)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml)

> WebdriverIO service for testing VSCode extensions.

This WebdriverIO service allows you to seamlessly test your VSCode extensions from end to end. You only need to provide a path to your extension and the service does the rest by:

- 🏗️ Installing VSCode (either `stable`, `insiders` or a specified version)
- ⬇️ Downloading Chromedriver specific to given VSCode version
- 🚀 Access to VSCode API from your tests
- 🖥️ Starting VSCode with custom user settings (including support for VSCode on Ubuntu, MacOS and Windows)
- 📔 Bootstraping page objects with locators matching your VSCode version

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

To use the service you need to add `vscode` to your list of services, optionally followed by a configuration object:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    capabilities: [{
        browserName: 'vscode',
        browserVersion: '1.66.0' // "insiders" or "stable" for latest VSCode version
        'wdio:vscodeOptions': {
            extensionPath: __dirname,
            userSettings: {
                "editor.fontSize": 14
            }
        }
    }],
    services: ['vscode'],
    /**
     * optionally you can define the path WebdriverIO stores all
     * VSCode and Chromedriver binaries, e.g.:
     * services: [['vscode', { cachePath: __dirname }]]
     */
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

## Usage

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

### Accessing VSCode APIs

If you like to execute certain automation through the [VSCode API](https://code.visualstudio.com/api/references/vscode-api) you can do that by running remote commands via the custom `executeWorkbench` command. This command allows to remote execute code from your test inside the VSCode environment and enables to access the VSCode API. You can pass arbitrary paramaters into the function which will then be propagated into the function. The `vscode` object will be always passed in as first argument following the outer function parameters. Note that you can not access variables outside of the function scoped as the callback is executed remotely. Here is an example:

```ts
const workbench = await browser.getWorkbench()
await browser.executeWorkbench((vscode, param1, param2) => {
    vscode.window.showInformationMessage(`I am an ${param1} ${param2}!`)
}, 'API', 'call')

const notifs = await workbench.getNotifications()
console.log(await notifs[0].getMessage()) // outputs: "I am an API call!"
```

For the full page object documentation, check out the [docs](https://webdriverio-community.github.io/wdio-vscode-service/modules.html). You can find various usage examples in this [projects test suite](https://github.com/webdriverio-community/wdio-vscode-service/blob/main/test/specs/basic.e2e.ts).

## Configuration

Through service configuration you can manage the VSCode version as well as user settings for VSCode:

### Service Options

Service options are options needed for the service to setup the test environment. They are a superset of the [Chromedriver options](https://webdriver.io/docs/wdio-chromedriver-service#options) which can be applied for this service as well.

#### `cachePath`

Define a cache path to avoid re-downloading all bundles. This is useful for CI/CD to avoid re-downloading VSCode and Chromedriver for every testrun.

Type: `string`<br />
Default: `process.cwd()`

### VSCode Capabilities (`wdio:vscodeOptions`)

In order to run tests through VSCode you have to define `vscode` as `browserName`. You can specify the VSCode version by providing a `browserVersion` capability. Custom VSCode options are then defined within the custom `wdio:vscodeOptions` capability. The options are the following:

#### `binary`

Path to a local installed VSCode installation. If option is not provided the service will download VSCode based on given `browserVersion` (or `stable` if not given).

Type: `string`

#### `extensionPath`

Define the directory to the extension you want to test.

Type: `string`

#### `userSettings`

Define custom user settings to be applied to VSCode.

Type: `Record<string, number | string | object | boolean>`<br />
Default: `{}`

#### `workspacePath`

Opens VSCode for a specific workspace. If not provided VSCode starts without a workspace opened.

Type: `string`

#### `filePath`

Opens VSCode with a specific file opened.

Type: `string`

#### `vscodeArgs`

Additional start-up arguments as object, e.g.

```ts
vscodeArgs: { fooBar: true, 'bar-foo': '/foobar' }
```

will be passed in as:

```ts
--foo-bar --fooBar --bar-foo=/foobar
```

Type: `Record<string, string | boolean>`<br />
Default: see [`constants.ts#L5-L14`](https://github.com/webdriverio-community/wdio-vscode-service/blob/196a69be3ac2fb82d9c7e4f19a2a1c8ccbaec1e2/src/constants.ts#L5-L14)

#### `verboseLogging`

If set to true, service logs VSCode output from the extension host and console API.

Type: `boolean`<br />
Default: `false`

#### `vscodeProxyOptions`

VSCode API proxy configurations define how WebdriverIO connects to the VSCode workbench to give you access to the VSCode API.

Type: `VSCodeProxyOptions`<br />
Default:

```ts
{
    /**
     * If set to true, the service tries to establish a connection with the
     * VSCode workbench to enable access to the VSCode API
     */
    enable: true,
    /**
     * Port of the WebSocket connection used to connect to the workbench.
     * By default set to an available port in your operating system.
     */
    // port?: number
    /**
     * Timeout for connecting to WebSocket inside of VSCode
     */
    connectionTimeout: 5000,
    /**
     * Timeout for command to be executed within VSCode
     */
    commandTimeout: 5000
}
```

## Create Your Own PageObjects

You can re-use the components used in this service for your own webview page objects. For that first create a file that defines all your selectors, e.g.:

```ts
// e.g. in /test/pageobjects/locators.ts
export const componentA = {
    elem: 'form', // component container element
    submit: 'button[type="submit"]', // submit button
    username: 'input.username', // username input
    password: 'input.password' // password input
}
```

Now you can create a page object as following:

```ts
// e.g. in /test/pageobjects/loginForm.ts
import { PluginDecorator, IPluginDecorator, BasePage } from 'wdio-vscode-service'
import * as locatorMap, { componentA as componentALocators } from './locators'
export interface LoginForm extends IPluginDecorator<typeof componentALocators> {}
@PluginDecorator(componentALocators)
export class LoginForm extends BasePage<typeof componentALocators, typeof locatorMap> {
    /**
     * @private locator key to identify locator map (see locators.ts)
     */
    public locatorKey = 'componentA' as const

    public login (username: string, password: string) {
        await this.username$.setValue(username)
        await this.password$.setValue(password)
        await this.submit$.click()
    }
}
```

Now in your test you can use your page object as follows:

```ts
import { LoginForm } from '../pageobjects/loginForm'
import * as locatorMap from '../locators'

// e.g. in /test/specs/example.e2e.ts
describe('my extension', () => {
    it('should login', async () => {
        const loginForm = new LoginForm(locatorMap)
        await loginForm.login('admin', 'test123')

        // you can also use page object elements directly via `[selector]$`
        // or `[selector]$$`, e.g.:
        await loginForm.submit$.click()

        // or access locators directly
        console.log(loginForm.locators.username)
        // outputs: "input.username"
    })
})
```

---

For more information on WebdriverIO check out the project [homepage](https://webdriver.io).
