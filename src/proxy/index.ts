/* eslint-disable */
import vscode from 'vscode'
import WebSocket from 'ws'

import { SETTINGS_KEY } from '../constants'
import type { RemoteCommand, RemoteResponse } from '../types'

console.log('VSCode proxy service running...');

export async function run(): Promise<void> {
    const config = vscode.workspace.getConfiguration(SETTINGS_KEY)
    console.log(`Connect to service proxy ${JSON.stringify(config)} - ${config.port}`);

    const ws = new WebSocket(`ws://localhost:${config.port}`)
    ws.on('open', () => console.log('WebSocket proxy connected'))
    ws.on('message', (data) => {
        try {
            const message = data.toString()
            console.log(`Received remote command: ${message}`);
            vscode.window

            const { id, fn, params } = JSON.parse(data.toString()) as RemoteCommand

            try {
                const result = eval(fn).call(globalThis, vscode, ...params)
                const response = JSON.stringify(<RemoteResponse>{ id, result })
                console.log(`Return remote response: ${response}`);

                return ws.send(response)
            } catch (err: any) {
                return ws.send(JSON.stringify(<RemoteResponse>{ id, error: err.message }))
            }
        } catch (err: any) {
            console.error(`Failed run remote command: ${err.message}`)
        }
    })

    return new Promise(() => {})
}
