import { describe, expect, it } from 'vitest'
import { discoveryPeople } from './discoveryFixtures'
import { toPublicSocialProfile } from './socialProfile'

describe('public social profile projection', () => {
  it('removes private fields from the display model instead of styling them away', () => {
    const layla = toPublicSocialProfile(discoveryPeople['user-media-01-arabic-1'])
    const eitan = toPublicSocialProfile(discoveryPeople['user-media-09-israel-3'])
    const mariam = toPublicSocialProfile(discoveryPeople['user-media-02-arabic-2'])
    expect(layla).not.toHaveProperty('interests')
    expect(eitan).not.toHaveProperty('aboutMe')
    expect(mariam).not.toHaveProperty('likesCount')
    expect(layla).toHaveProperty('voiceClip')
  })
})
