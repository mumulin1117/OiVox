import { describe, expect, it } from 'vitest'
import { discoveryPeople } from '../data/discoveryFixtures'
import { discoveryPersonMatchesFilters, normalizeDiscoveryFilters, prioritizeDiscoveryUserIDs } from './discoveryFilters'

describe('discovery filter priority', () => {
  it('normalizes only supported stable region and language identifiers', () => {
    expect(normalizeDiscoveryFilters({ regions: ['europe', 'unknown', 'europe'], languages: ['ja', 'xx', 'ja'], onlineNow: 1, notHeardYet: true })).toEqual({
      regions: ['europe'],
      languages: ['ja'],
      onlineNow: false,
      notHeardYet: true,
    })
  })

  it('keeps every full match before fallback cards without removing the fallback', () => {
    const ids = Object.keys(discoveryPeople)
    const filters = { regions: ['eastAsia'], languages: ['ja'], onlineNow: true }
    const ordered = prioritizeDiscoveryUserIDs(ids, filters)
    const firstFallback = ordered.findIndex((id) => !discoveryPersonMatchesFilters(discoveryPeople[id], filters))
    expect(firstFallback).toBeGreaterThan(0)
    expect(ordered.slice(0, firstFallback).every((id) => discoveryPersonMatchesFilters(discoveryPeople[id], filters))).toBe(true)
    expect(ordered.slice(firstFallback).some((id) => !discoveryPersonMatchesFilters(discoveryPeople[id], filters))).toBe(true)
    expect(ordered).toHaveLength(ids.length)
  })

  it('treats heard voices as fallback only when Not heard yet is selected', () => {
    const ids = Object.keys(discoveryPeople).slice(0, 3)
    const heardVoiceID = discoveryPeople[ids[0]].voiceClip.id
    const ordered = prioritizeDiscoveryUserIDs(ids, { notHeardYet: true }, [heardVoiceID])
    expect(ordered.at(-1)).toBe(ids[0])
    expect(ordered).toEqual(expect.arrayContaining(ids))
  })

  it('preserves the incoming recommendation order when no condition is selected', () => {
    const ids = Object.keys(discoveryPeople).slice(0, 7).reverse()
    expect(prioritizeDiscoveryUserIDs(ids)).toEqual(ids)
  })
})
