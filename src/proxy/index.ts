/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-misused-promises */
import type VSCodeImport from 'vscode'
import WebSocket from 'ws'

import { SETTINGS_KEY } from '../constants.js'
import type { RemoteCommand, RemoteResponse } from '../types.js'

export async function run (vscode: typeof VSCodeImport): Promise<void> {
    const config = vscode.workspace.getConfiguration(SETTINGS_KEY)
    console.log(`Connect to service proxy on port ${config.port}`)

    const ws = new WebSocket(`ws://localhost:${config.port}`)
    ws.on('open', () => console.log('WebSocket proxy connected'))
    ws.on('message', async (data) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const message = data.toString()
            console.log(`Received remote command: ${message}`)

            const { id, fn, params } = JSON.parse(message) as RemoteCommand

            try {
                // eslint-disable-next-line no-eval, @typescript-eslint/no-unsafe-call
                let result = eval(fn).call(globalThis, vscode, ...params)
                if (typeof result === 'object' && typeof result.then === 'function') {
                    result = await result
                }

                const response = JSON.stringify(<RemoteResponse>{ id, result })
                console.log(`Return remote response: ${response}`)

                return ws.send(response)
            } catch (err: any) {
                return ws.send(JSON.stringify(<RemoteResponse>{ id, error: err.message }))
            }
        } catch (err: any) {
            console.error(`Failed run remote command: ${err.message}`)
        }
        return null
    })

    return new Promise(() => {})
}
