import { beforeEach, describe, expect, it } from 'vitest'
import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'
import { isVoiceEarthUnlocked, unlockVoiceEarth, voiceEarthAccessKey } from './voiceEarthAccess'

beforeEach(() => localStorage.clear())

describe('Voice Earth access', () => {
  it('keeps accounts without a published seven-second voice locked', () => {
    expect(isVoiceEarthUnlocked({ accountID: 'account-new', user: { id: 'account-new', profile: {} } })).toBe(false)
  })

  it('unlocks only the account that published a voice', () => {
    unlockVoiceEarth({ accountID: 'account-a', voiceClipID: 'clip-a', clock: () => '2026-09-23T10:00:00Z' })
    expect(isVoiceEarthUnlocked({ accountID: 'account-a' })).toBe(true)
    expect(isVoiceEarthUnlocked({ accountID: 'account-b' })).toBe(false)
    expect(JSON.parse(localStorage.getItem(voiceEarthAccessKey('account-a')))).toMatchObject({ voiceClipID: 'clip-a', status: 'unlocked' })
  })

  it('accepts an API profile voice and the fixed review fixture', () => {
    expect(isVoiceEarthUnlocked({ accountID: 'api-account', user: { profile: { voiceClip: { id: 'voice-api' } } } })).toBe(true)
    expect(isVoiceEarthUnlocked({ accountID: OIVOX_TEST_USER_ID })).toBe(true)
  })
})
