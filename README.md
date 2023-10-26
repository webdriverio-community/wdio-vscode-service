<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO loves VSCode" src="https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/.github/assets/banner.png">
    </a>
</p>

# WDIO VSCode Service [![CI](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml/badge.svg)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml)

Tested on:

[![VSCode Version](https://img.shields.io/badge/VSCode%20Version-insiders%20/%20stable%20/%20v1.78.0%20/%20web-brightgreen)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml) [![CI Status](https://img.shields.io/badge/Platform-windows%20%2F%20macos%20%2F%20ubuntu-brightgreen)](https://github.com/webdriverio-community/wdio-vscode-service/actions/workflows/ci.yml)

> WebdriverIO service for testing VSCode extensions.

This WebdriverIO service allows you to seamlessly test your VSCode extensions from end to end in the VSCode Desktop IDE or as web extension. You only need to provide a path to your extension and the service does the rest by:

- 🏗️ Installing VSCode (either `stable`, `insiders` or a specified version)
- ⬇️ Downloading Chromedriver specific to given VSCode version
- 🚀 Enables you to access the VSCode API from your tests
- 🖥️ Starting VSCode with custom user settings (including support for VSCode on Ubuntu, MacOS and Windows)
- 🌐 Or serves VSCode from a server to be accessed by any browser for testing [web extensions](https://code.visualstudio.com/api/extension-guides/web-extensions)
- 📔 Bootstrapping page objects with locators matching your VSCode version

This project was highly inspired by the [vscode-extension-tester](https://www.npmjs.com/package/vscode-extension-tester) project which is based on Selenium. This package takes the idea and adapts it for WebdriverIO.

## Installation

To initiate a new WebdriverIO project, run:

```bash
npm create wdio ./
```

An installation wizard will guide you through the process. Ensure you select TypeScript as compiler and don't have it generate page objects for you given this project comes with all page objects needed. Then make sure to select `chromedriver` and `vscode` within the list of services:

![Install Demo](https://raw.githubusercontent.com/webdriverio-community/wdio-vscode-service/main/.github/assets/demo.gif "Install Demo")

__Note:__ remove `chromedriver` from the list of services in the generated `wdio.conf.ts` afterwards. See also configuration example below.

For more information on how to install `WebdriverIO`, please check the [project docs](https://webdriver.io/docs/gettingstarted).

## Example Configuration

To use the service you need to add `vscode` to your list of services, optionally followed by a configuration object. This will make WebdriverIO download given VSCode binaries and appropiate Chromedriver version:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    capabilities: [{
        browserName: 'vscode',
        browserVersion: '1.71.0', // "insiders" or "stable" for latest VSCode version
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

If you define `wdio:vscodeOptions` with any other `browserName` but `vscode`, e.g. `chrome`, the service will serve the extension as web extension. If you test on Chrome no additional driver service is required, e.g.:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    capabilities: [{
        browserName: 'chrome',
        'wdio:vscodeOptions': {
            extensionPath: __dirname
        }
    }],
    services: ['vscode'],
    // ...
};
```

_Note:_ when testing web extensions you can only choose between `stable` or `insiders` as `browserVersion`.

### TypeScript Setup

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

You can then use the `getWorkbench` method to access the page objects for the locators matching your desired VSCode version:

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

#### `storagePath`

Define a custom location for VS Code to store all its data. This is the root for internal VS Code directories such as (partial list)
* **user-data-dir**: The directory where all the user settings (global settings), extension logs etc are stored.
* **extension-install-dir**: The directory where VS Code extensions are installed.

If not provided, a temporary directory is used.

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
import { PageDecorator, IPageDecorator, BasePage } from 'wdio-vscode-service'
import * as locatorMap, { componentA as componentALocators } from './locators'
export interface LoginForm extends IPageDecorator<typeof componentALocators> {}
@PageDecorator(componentALocators)
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

## TypeScript Support

If you use WebdriverIO with TypeScript make sure to add `wdio-vscode-service` to your `types` in your `tsconfig.json`, e.g.:

```json
{
    "compilerOptions": {
        "moduleResolution": "node",
        "types": [
            "webdriverio/async",
            "@wdio/mocha-framework",
            "expect-webdriverio",
            // add this service to your types
            "wdio-devtools-service"
        ],
        "target": "es2019"
    }
}
```

## Proxy Support

During the initialization of this service, a ChromeDriver and VSCode distribution is downloaded. You can tunnel this requests through a proxy by setting the environment variable `HTTPS_PROXY` or `https_proxy`. E. g.:

```bash
HTTPS_PROXY=http://127.0.0.1:1080 npm run wdio
```

## References

The following VS Code extensions use `wdio-vscode-service`:

- [Marquee](https://marketplace.visualstudio.com/items?itemName=stateful.marquee) (27k downloads)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (27.8m downloads)
- [DVC Extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=Iterative.dvc) (11.2k downloads)
- [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) (1.2m downloads)

## Contributing

Before posting a pull request, please run the following:

1. `git clone git@github.com:webdriverio-community/wdio-vscode-service.git`
1. `cd wdio-vscode-service`
1. `npm install`
1. `npm run build`
1. `npm run test` (or `npm run ci`)

## Learn More

If you want to learn more about testing VSCode Extensions, check out [Christian Bromann's](https://twitter.com/bromann) talk at [OpenJS World 2022](https://www.youtube.com/watch?v=PhGNTioBUiU):

[![Testing VSCode Extensions at OpenJS World 2022](https://img.youtube.com/vi/PhGNTioBUiU/sddefault.jpg)](https://www.youtube.com/watch?v=PhGNTioBUiU)

---

For more information on WebdriverIO check out the project [homepage](https://webdriver.io).
