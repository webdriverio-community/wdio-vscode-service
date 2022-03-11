# WDIO VSCode Service

> WebdriverIO service for testing VSCode extensions.

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
// wdio.conf.js
const config = {
  outputDir: 'all-logs',
  // ...
  services: [
    [
      'vscode',
      {},
    ],
  ],
  // ...
};

module.exports = { config };
```

## Configuration

...
