import VSCodeServiceLauncher from './launcher.js'
import VSCodeWorkerService from './service.js'
import type { WDIOVSCodeServiceOptions as WDIOVSCodeServiceOptionsExtension } from './types'

export default VSCodeWorkerService
export const launcher = VSCodeServiceLauncher

export * from './pageobjects/index.js'

declare global {
    namespace WebdriverIO {
        interface WDIOVSCodeServiceOptions extends WDIOVSCodeServiceOptionsExtension {}
    }
}
