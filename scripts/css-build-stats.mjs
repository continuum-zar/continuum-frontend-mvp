#!/usr/bin/env node
/**
 * Prints minified + gzip sizes for CSS assets in dist/ after `vite build`.
 * For unused-rule coverage, use Chrome DevTools → More tools → Coverage → load the app and export.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist', 'assets')

function gzipSize(buf) {
  return gzipSync(buf).length
}

try {
  const files = readdirSync(dist).filter((f) => f.endsWith('.css'))
  if (files.length === 0) {
    console.error('No .css files in dist/assets. Run `pnpm build` first.')
    process.exit(1)
  }
  console.log('CSS build output (dist/assets)\n')
  let totalRaw = 0
  let totalGzip = 0
  for (const name of files.sort()) {
    const p = join(dist, name)
    const buf = readFileSync(p)
    const raw = buf.length
    const gz = gzipSize(buf)
    totalRaw += raw
    totalGzip += gz
    console.log(`${name}`)
    console.log(`  minified: ${(raw / 1024).toFixed(2)} kB`)
    console.log(`  gzip:     ${(gz / 1024).toFixed(2)} kB\n`)
  }
  console.log('Total (all .css in dist/assets)')
  console.log(`  minified: ${(totalRaw / 1024).toFixed(2)} kB`)
  console.log(`  gzip:     ${(totalGzip / 1024).toFixed(2)} kB`)
} catch (e) {
  console.error('Failed to read dist/assets:', e.message)
  process.exit(1)
}
