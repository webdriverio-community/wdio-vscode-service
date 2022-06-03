import VSCodeServiceLauncher from './launcher'
import VSCodeWorkerService from './service'
import type { WDIOVSCodeServiceOptions as WDIOVSCodeServiceOptionsExtension } from './types'

export default VSCodeWorkerService
export const launcher = VSCodeServiceLauncher

export * from './pageobjects'

declare global {
    namespace WebdriverIO {
        interface WDIOVSCodeServiceOptions extends WDIOVSCodeServiceOptionsExtension {}
    }
}
