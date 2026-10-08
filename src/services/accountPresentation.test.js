import { describe, expect, it } from 'vitest'
import portrait03 from '../assets/portraits/portrait-03.png'
import portrait09 from '../assets/portraits/portrait-09.png'
import { resolveAccountAvatar, resolveAccountCoinBalance, resolveAccountProfileSummary } from './accountPresentation'

describe('account presentation model', () => {
  it('uses the authenticated profile avatar and never a discovery-user image', () => {
    expect(resolveAccountAvatar({ profile: { avatarKey: 'portrait-03' } })).toBe(portrait03)
    expect(resolveAccountAvatar({ profile: { clientAvatarPreview: 'data:image/png;base64,abc' } })).toBe('data:image/png;base64,abc')
    expect(resolveAccountAvatar({ profile: {} })).toBe(portrait09)
  })

  it('reads only a valid account wallet balance', () => {
    expect(resolveAccountCoinBalance({ wallet: { coinBalance: 120 } })).toBe(120)
    expect(resolveAccountCoinBalance({ wallet: { coinBalance: -1 } })).toBe(0)
    expect(resolveAccountCoinBalance({ wallet: { coinBalance: '120' } })).toBe(0)
    expect(resolveAccountCoinBalance(null)).toBe(0)
  })

  it('uses API statistics first and otherwise derives profile numbers from account-scoped local data', () => {
    const peopleByID = {
      a: { countryCode: 'JP', voiceClip: { id: 'voice-a' } },
      b: { countryCode: 'JP', voiceClip: { id: 'voice-b' } },
      c: { countryCode: 'FR', voiceClip: { id: 'voice-c' } },
    }
    const local = resolveAccountProfileSummary({
      relationshipsByUserID: {
        a: { friendshipStatus: 'friends', blockStatus: 'none' },
        b: { friendshipStatus: 'pending_out', blockStatus: 'none' },
      },
      translationEntries: [{ userID: 'a' }, { userID: 'b' }, { userID: 'c' }],
      heardVoices: [{ voiceID: 'voice-extra', userID: 'extra', countryCode: 'DE' }],
      peopleByID,
      listenerUserIDs: ['a', 'c', 'a'],
      voiceClips: [{ id: 'voice-mine' }],
      coinBalance: 75,
    })
    expect(local).toMatchObject({ translatedCountryCount: 2, friendsCount: 1, voicesHeardCount: 4, heardByCount: 2, voiceClipsCount: 1, coinBalance: 75 })

    const api = resolveAccountProfileSummary({
      user: { stats: { translatedCountryCount: 9, friendsCount: 8, voicesHeardCount: 7 } },
      translationEntries: [{ userID: 'a' }],
      peopleByID,
    })
    expect(api).toMatchObject({ translatedCountryCount: 9, friendsCount: 8, voicesHeardCount: 7 })
  })
})
