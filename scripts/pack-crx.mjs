#!/usr/bin/env node
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

function usage() {
  console.error('usage: pack-crx.mjs --out <file.crx> --key <key.pem> [--zip <file.zip> | --dir <extension-dir>]')
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      usage()
      process.exit(2)
    }
    const key = arg.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      usage()
      process.exit(2)
    }
    args[key] = value
    i += 1
  }
  return args
}

function encodeVarint(value) {
  const bytes = []
  let remaining = value
  while (remaining > 0x7F) {
    bytes.push((remaining & 0x7F) | 0x80)
    remaining = Math.floor(remaining / 128)
  }
  bytes.push(remaining)
  return Buffer.from(bytes)
}

function encodeBytes(fieldNumber, value) {
  return Buffer.concat([
    encodeVarint((fieldNumber << 3) | 2),
    encodeVarint(value.length),
    value,
  ])
}

function uint32LE(value) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value, 0)
  return buffer
}

function zipDirectory(dir) {
  const abs = path.resolve(dir)
  if (!fs.existsSync(path.join(abs, 'manifest.json')))
    throw new Error(`找不到 ${abs}/manifest.json，请先 pnpm build`)

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eno-crx-'))
  const zipPath = path.join(tmp, 'extension.zip')
  const packed = spawnSync(
    'zip',
    ['-r', zipPath, '.', '-x', '_metadata/*', '-x', '_metadata/**', '-x', '*.DS_Store'],
    { cwd: abs, stdio: 'inherit' },
  )
  if (packed.status !== 0) {
    fs.rmSync(tmp, { recursive: true, force: true })
    throw new Error('zip 打包失败，请确认本机有 zip 命令')
  }
  const zip = fs.readFileSync(zipPath)
  fs.rmSync(tmp, { recursive: true, force: true })
  return zip
}

const args = parseArgs(process.argv.slice(2))
if (!args.out || !args.key || (!args.zip && !args.dir)) {
  usage()
  process.exit(2)
}

if (!fs.existsSync(args.key)) {
  console.error(`找不到私钥 ${args.key}`)
  process.exit(1)
}

const zip = args.zip ? fs.readFileSync(path.resolve(args.zip)) : zipDirectory(args.dir)
const pem = fs.readFileSync(args.key, 'utf8')
const privateKey = crypto.createPrivateKey(pem)
const publicKey = crypto.createPublicKey(privateKey).export({
  type: 'spki',
  format: 'der',
})
const crxId = crypto.createHash('sha256').update(publicKey).digest().subarray(0, 16)
const signedHeaderData = encodeBytes(1, crxId)
const signedPayload = Buffer.concat([
  Buffer.from('CRX3 SignedData\0', 'utf8'),
  uint32LE(signedHeaderData.length),
  signedHeaderData,
  zip,
])
const signature = crypto.sign('sha256', signedPayload, privateKey)
const proof = Buffer.concat([encodeBytes(1, publicKey), encodeBytes(2, signature)])
const header = Buffer.concat([encodeBytes(2, proof), encodeBytes(10000, signedHeaderData)])
const crx = Buffer.concat([
  Buffer.from('Cr24'),
  uint32LE(3),
  uint32LE(header.length),
  header,
  zip,
])

fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true })
fs.writeFileSync(args.out, crx)
console.log(`wrote ${args.out} (${crx.length} bytes)`)
