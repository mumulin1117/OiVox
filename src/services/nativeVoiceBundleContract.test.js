import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { discoveryMediaPairs } from '../data/discoveryMediaManifest'

describe('native bundled voice playback contract', () => {
  it('gives every discovery voice a stable native asset ID backed by a local wav file', () => {
    discoveryMediaPairs.forEach((media) => {
      expect(media.nativeVoiceAssetID).toMatch(/^voice-[a-z0-9-]+$/)
      expect(existsSync(resolve(process.cwd(), `public/assets/discovery/audio/${media.nativeVoiceAssetID}.wav`))).toBe(true)
    })
  })

  it('resolves fixture voices from the packaged WebApp folder through the existing bridge', () => {
    const bridge = readFileSync(resolve(process.cwd(), 'ios/OiVox/NativeBridge.swift'), 'utf8')
    expect(bridge).toContain('.appendingPathComponent("WebApp/assets/discovery/audio", isDirectory: true)')
    expect(bridge).toContain('assetID.hasPrefix("voice-")')
    expect(bridge).toContain('AVAudioPlayer(contentsOf: url)')
  })
})
