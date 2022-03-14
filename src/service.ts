import fs from 'fs/promises'
import path from 'path'
import tmp from 'tmp-promise'
import logger from '@wdio/logger'
import { Services, Options, Capabilities } from '@wdio/types'
import { SevereServiceError } from 'webdriverio'

import { Workbench } from './pageobjects'
import { VSCODE_APPLICATION_ARGS, DEFAULT_VSCODE_SETTINGS } from './constants'
import type { ServiceOptions } from './types'

const log = logger('wdio-vscode-service')

export default class VSCodeWorkerService implements Services.ServiceInstance {
  constructor (private _options: ServiceOptions) {
  }

  async beforeSession(_: Options.Testrunner, capabilities: Capabilities.Capabilities) {
    const storagePath = await tmp.dir()
    const userSettings = path.join(storagePath.path, 'settings', 'User')
    
    if (!this._options.extensionPath) {
      throw new SevereServiceError('No extension path provided')
    }

    log.info(`Setting up VSCode directory at ${userSettings}`)
    await fs.mkdir(userSettings, { recursive: true })
    await fs.writeFile(
      path.join(userSettings, 'settings.json'),
      JSON.stringify({
        ...DEFAULT_VSCODE_SETTINGS,
        ...(this._options.userSettings || {})
      }),
      'utf-8'
    )
    
    capabilities.browserName = 'chrome';
    capabilities['goog:chromeOptions'] = {
      // @ts-expect-error
      binary: capabilities['wdio:vscodeService'].path,
      args: [
        ...VSCODE_APPLICATION_ARGS,
        `--extensionDevelopmentPath=${this._options.extensionPath}`,
        `--user-data-dir=${path.join(storagePath.path, 'settings')}`
      ],
      windowTypes: ['webview'],
    };
  }

  before (_: never, __: never, browser: WebdriverIO.Browser) {
    return Workbench.window.waitForExist()
  }
}
