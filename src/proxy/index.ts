/* eslint-disable */
import vscode from 'vscode'
import WebSocket from 'ws'

import { WS_PORT } from '../constants'
import type { RemoteCommand, RemoteResponse } from '../types'

const ws = new WebSocket(`ws://localhost:${WS_PORT}`)
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

export async function run(): Promise<void> {
    return new Promise(() => {})
}
