import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const projectFile = (path: string) => resolve(process.cwd(), path)
const readProjectFile = (path: string) => readFileSync(projectFile(path))

const pngDimensions = (path: string): readonly [number, number] => {
  const image = readProjectFile(path)
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return [image.readUInt32BE(16), image.readUInt32BE(20)]
}

describe('public web identity', () => {
  it('publishes complete social-preview metadata with cache-safe branded images', () => {
    const html = readProjectFile('index.html').toString('utf8')

    expect(html).toContain('https://current-flow.net/social/current-flow-share-1200x630.png')
    expect(html).toContain('https://current-flow.net/social/current-flow-share-square.png')
    expect(html).toContain('<meta property="og:image:width" content="1200" />')
    expect(html).toContain('<meta property="og:image:height" content="630" />')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
    expect(html).not.toContain('https://current-flow.net/og.png')
  })

  it('uses the transparent Current Flow mark for browser-tab icons', () => {
    const html = readProjectFile('index.html').toString('utf8')

    expect(html).toContain('/brand/current-flow-favicon-32.png')
    expect(html).toContain('/brand/current-flow-favicon-48.png')
    expect(html).not.toContain('href="/favicon.svg"')
    expect(pngDimensions('public/brand/current-flow-favicon-16.png')).toEqual([16, 16])
    expect(pngDimensions('public/brand/current-flow-favicon-32.png')).toEqual([32, 32])
    expect(pngDimensions('public/brand/current-flow-favicon-48.png')).toEqual([48, 48])
  })

  it('ships correctly sized social and installable-app artwork', () => {
    expect(pngDimensions('public/social/current-flow-share-1200x630.png')).toEqual([1200, 630])
    expect(pngDimensions('public/social/current-flow-share-square.png')).toEqual([600, 600])
    expect(pngDimensions('public/brand/current-flow-touch-icon.png')).toEqual([180, 180])
    expect(pngDimensions('public/brand/current-flow-app-icon-192.png')).toEqual([192, 192])
    expect(pngDimensions('public/brand/current-flow-app-icon-512.png')).toEqual([512, 512])

    const manifest = JSON.parse(readProjectFile('public/site.webmanifest').toString('utf8')) as {
      theme_color: string
      icons: readonly { sizes: string; purpose: string }[]
    }
    expect(manifest.theme_color).toBe('#07162d')
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512'])
    expect(manifest.icons.every((icon) => icon.purpose === 'any maskable')).toBe(true)
  })
})
