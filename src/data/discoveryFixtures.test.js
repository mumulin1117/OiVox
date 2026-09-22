import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { discoveryFlagAssets, discoveryPeople, firstDayFreeDiscoveryIDs } from './discoveryFixtures'
import { DISCOVERY_MEDIA_VERSION, discoveryMediaPairs } from './discoveryMediaManifest'

const publicAssetPath = (runtimePath) => resolve(process.cwd(), 'public', runtimePath.replace(/^\.\//, ''))

describe('discovery fixture assets', () => {
  it('provides twenty fictional people across the eight v3 regions', () => {
    const people = Object.values(discoveryPeople)
    expect(people).toHaveLength(20)
    expect(new Set(people.map((person) => person.countryCode))).toEqual(new Set(['EG', 'TR', 'IL', 'GB', 'FR', 'DE', 'JP', 'KR']))
    expect(people.every((person) => person.isFixture)).toBe(true)
  })

  it('keeps every v3 avatar, voice, and source row in one stable correspondence', () => {
    expect(DISCOVERY_MEDIA_VERSION).toBe('avatar-audio-v3')
    expect(discoveryMediaPairs).toHaveLength(20)
    expect(new Set(discoveryMediaPairs.map((pair) => pair.pairingID)).size).toBe(20)
    expect(new Set(discoveryMediaPairs.map((pair) => pair.avatarAsset)).size).toBe(20)
    expect(new Set(discoveryMediaPairs.map((pair) => pair.voiceAsset)).size).toBe(20)
    for (const person of Object.values(discoveryPeople)) {
      for (const path of [person.avatarAsset, person.flagAsset, person.voiceClip.asset]) {
        expect(path.startsWith('./assets/discovery/')).toBe(true)
        expect(existsSync(publicAssetPath(path))).toBe(true)
      }
      expect(person.voiceClip.durationMs).toBeGreaterThan(0)
      expect(person.voiceClip.durationMs).toBeLessThanOrEqual(7000)
      expect(person.voiceClip.source).toBe('local-dataset-fixture')
      expect(person.voiceClip.mediaPairID).toBe(person.mediaPairID)
    }
    expect(new Set(Object.values(discoveryFlagAssets)).size).toBe(8)
  })

  it('keeps the checked-in correspondence list aligned with the runtime manifest', () => {
    const csv = readFileSync(resolve(process.cwd(), 'docs/data/discovery-media-v3.csv'), 'utf8')
    expect(csv.trim().split('\n')).toHaveLength(21)
    for (const pair of discoveryMediaPairs) {
      expect(csv).toContain(pair.pairingID)
      expect(csv).toContain(pair.avatarAsset.split('/').at(-1))
      expect(csv).toContain(pair.voiceAsset.split('/').at(-1))
    }
  })

  it('keeps the first free deck unique and eligible', () => {
    expect(firstDayFreeDiscoveryIDs).toHaveLength(7)
    expect(new Set(firstDayFreeDiscoveryIDs).size).toBe(7)
    for (const id of firstDayFreeDiscoveryIDs) {
      const person = discoveryPeople[id]
      expect(person).toBeTruthy()
      expect(person.relationship.friendshipStatus).not.toBe('friends')
      expect(person.relationship.blockStatus).toBe('none')
    }
  })
})
