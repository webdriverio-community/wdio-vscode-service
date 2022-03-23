#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..')
const LINKED_DIR = path.join(ROOT, 'node_modules', 'wdio-vscode-service')

await fs.rm(LINKED_DIR, {
    recursive: true
}).catch((e) => console.warn(`Linked dir doesn't exists: ${e.message}`))
await fs.symlink('../', LINKED_DIR)
