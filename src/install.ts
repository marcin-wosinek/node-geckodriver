import url from 'node:url'
import path from 'node:path'
import util from 'node:util'
import stream from 'node:stream'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import zlib from 'node:zlib'
import { Readable } from 'node:stream'

import tar from 'tar-fs'
import fetch, { type RequestInit } from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import unzipper, { type Entry } from 'unzipper'
import logger from '@wdio/logger'

import { BINARY_FILE, MOZ_CENTRAL_CARGO_TOML } from './constants.js'
import { hasAccess, getDownloadUrl } from './utils.js'

const streamPipeline = util.promisify(stream.pipeline)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const log = logger('geckodriver')

const fetchOpts: RequestInit = {}
if (process.env.HTTPS_PROXY) {
  fetchOpts.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY)
} else if (process.env.HTTP_PROXY) {
  fetchOpts.agent = new HttpProxyAgent(process.env.HTTP_PROXY)
}

export async function download (geckodriverVersion: string = process.env.GECKODRIVER_VERSION) {
  const targetDir = path.resolve(__dirname, '..', '.bin')
  const binaryFilePath = path.resolve(targetDir, BINARY_FILE)

  if (await hasAccess(binaryFilePath)) {
    return binaryFilePath
  }

  /**
   * get latest version of Geckodriver
   */
  if (!geckodriverVersion) {
    const res = await fetch(MOZ_CENTRAL_CARGO_TOML, fetchOpts)
    const toml = await res.text()
    const version = toml.split('\n').find((l) => l.startsWith('version = '))
    if (!version) {
      throw new Error(`Couldn't find version property in Cargo.toml file: ${toml}`)
    }
    geckodriverVersion = version.split(' = ').pop().slice(1, -1)
    log.info(`Detected Geckodriver v${geckodriverVersion} to be latest`)
  }

  const url = getDownloadUrl(geckodriverVersion)
  log.info(`Downloading Geckodriver from ${url}`)
  const res = await fetch(url, fetchOpts)

  if (res.status !== 200) {
    throw new Error(`Failed to download binary (statusCode ${res.status}): ${res.statusText}`)
  }

  await fsp.mkdir(targetDir, { recursive: true })
  await (url.endsWith('.zip')
    ? downloadZip(res.body, targetDir)
    : streamPipeline(res.body, zlib.createGunzip(), tar.extract(targetDir)))

  await fsp.chmod(binaryFilePath, '755')
  return binaryFilePath
}

function downloadZip(body: NodeJS.ReadableStream, targetDir: string) {
  const stream = Readable.from(body).pipe(unzipper.Parse())
  const promiseChain: Promise<string | void>[] = [
    new Promise((resolve, reject) => {
      stream.on('close', () => resolve())
      stream.on('error', () => reject())
    })
  ]

  stream.on('entry', async (entry: Entry) => {
    const unzippedFilePath = path.join(targetDir, entry.path)
    if (entry.type === 'Directory') {
      return
    }

    if (!await hasAccess(path.dirname(unzippedFilePath))) {
      await fsp.mkdir(path.dirname(unzippedFilePath), { recursive: true })
    }

    const execStream = entry.pipe(fs.createWriteStream(unzippedFilePath))
    promiseChain.push(new Promise((resolve, reject) => {
      execStream.on('close', () => resolve(unzippedFilePath))
      execStream.on('error', reject)
    }))
  })

  return Promise.all(promiseChain)
}

/**
 * download on install
 */
if (process.argv[1] && process.argv[1].endsWith('/dist/install.js') && Boolean(process.env.GECKODRIVER_AUTO_INSTALL || '1')) {
  await download().then(
    () => log.info('Success!'),
    (err) => log.error(`Failed to install Geckodriver: ${err.stack}`)
  )
}
