import { beforeEach, describe, expect, it } from 'vitest'
import { createVoiceActivityStore } from './voiceActivityStore'

beforeEach(() => localStorage.clear())

describe('voice activity store', () => {
  it('counts a heard voice once and scopes history to the logged-in account', () => {
    const accountA = createVoiceActivityStore({ accountID: 'account-a', clock: () => '2026-09-23T00:00:00Z' })
    accountA.markHeard({ voiceID: 'voice-1', userID: 'user-1', countryCode: 'JP' })
    accountA.markHeard({ voiceID: 'voice-1', userID: 'user-1', countryCode: 'JP' })
    expect(accountA.getSnapshot().heardVoices).toEqual([{ voiceID: 'voice-1', userID: 'user-1', countryCode: 'JP', heardAt: '2026-09-23T00:00:00Z' }])
    expect(createVoiceActivityStore({ accountID: 'account-b' }).getSnapshot().heardVoices).toEqual([])
  })
})
