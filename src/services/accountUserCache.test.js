import { beforeEach, describe, expect, it } from 'vitest'
import { accountUserCacheKey, mergeAccountUserWithLocalCache, updateLocalAccountProfile } from './accountUserCache'

beforeEach(() => localStorage.clear())

describe('account user cache', () => {
  it('uses live interface fields first and fills only missing profile fields from the same account cache', () => {
    mergeAccountUserWithLocalCache({ id: 'account-a', profile: { displayName: 'Cached name', handle: '@cached', countryCode: 'JP' } })
    const merged = mergeAccountUserWithLocalCache({ id: 'account-a', profile: { displayName: 'API name', aboutMe: 'From API' } })
    expect(merged.profile).toMatchObject({ displayName: 'API name', handle: '@cached', countryCode: 'JP', aboutMe: 'From API' })
  })

  it('persists only stable local avatar frame fields for the signed-in account', () => {
    const storage = localStorage
    const user = { id: 'account-a', profile: { displayName: 'Mia' } }
    const updated = updateLocalAccountProfile(user, { avatarFrameID: 'aurora', avatarFrameLabel: 'Aurora', ignored: 'no' }, storage)
    expect(updated.profile.avatarFrameID).toBe('aurora')
    expect(JSON.parse(storage.getItem(accountUserCacheKey('account-a'))).profile).toMatchObject({ avatarFrameID: 'aurora', avatarFrameLabel: 'Aurora' })
    expect(JSON.parse(storage.getItem(accountUserCacheKey('account-a'))).profile.ignored).toBeUndefined()
  })

  it('never persists preview base64, passwords, tokens, or another account data', () => {
    const user = mergeAccountUserWithLocalCache({ id: 'account-a', password: 'secret', accessToken: 'token', profile: { displayName: 'A', clientAvatarPreview: 'data:image/png;base64,abc' } })
    const stored = localStorage.getItem(accountUserCacheKey('account-a'))
    expect(user.profile.clientAvatarPreview).toBe('data:image/png;base64,abc')
    expect(stored).not.toContain('base64')
    expect(stored).not.toContain('secret')
    expect(stored).not.toContain('token')
    expect(mergeAccountUserWithLocalCache({ id: 'account-b', profile: { displayName: 'B' } }).profile).toEqual({ displayName: 'B' })
  })
})
