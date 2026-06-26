import VSCodeServiceLauncher from './launcher.js'
import VSCodeWorkerService from './service.js'
import type { WDIOVSCodeServiceOptions as WDIOVSCodeServiceOptionsExtension } from './types.js'

export default VSCodeWorkerService
export const launcher = VSCodeServiceLauncher
export type { CoverageOptions, ServiceOptions } from './types.js'

export * from './pageobjects/index.js'

declare global {
    namespace WebdriverIO {
        interface WDIOVSCodeServiceOptions extends WDIOVSCodeServiceOptionsExtension {}
    }
}
