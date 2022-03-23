#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import url from 'url'

console.log('Start linking wdio-vscode-service into node_modules');

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..')
const LINKED_DIR = path.join(ROOT, 'node_modules', 'wdio-vscode-service')

const relative = (from, to) => path.relative(
    path.dirname(from),
    path.resolve(to)
)

await fs.rm(LINKED_DIR, {
    recursive: true
}).catch((e) => console.warn(`Linked dir doesn't exists: ${e.message}`))

await fs.symlink(relative(LINKED_DIR, ROOT), LINKED_DIR, 'dir')
console.log('Successful linked package');
