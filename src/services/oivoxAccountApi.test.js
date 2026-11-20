import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOivoxLocalAccountService, localUserForEntry } from './oivoxAccountApi'
import { accountUserCacheKey, mergeAccountUserWithLocalCache } from './accountUserCache'

const ordinary = { identifier: 'alice@example.invalid', scopedID: 'account-alice', nickname: 'Alice' }
const another = { identifier: 'bob@example.invalid', scopedID: 'account-bob', nickname: 'Bob' }
const review = { identifier: 'oivox@gmail.com', scopedID: '42618403-0000-4000-8000-000000000001', isTestAccount: true }

beforeEach(() => localStorage.clear())

describe('account data after the new entry', () => {
  it('preserves existing profile and business data keys when a submitted account matches the cached email', async () => {
    mergeAccountUserWithLocalCache({
      id: 'old-id', email: 'Alice@example.invalid', profile: { displayName: 'Saved name', avatarKey: 'portrait-03' },
    })
    localStorage.setItem('oivox.socialState.v2:old-id', '{"fixture":true}')
    const service = createOivoxLocalAccountService(ordinary, localStorage)
    const original = await service.ensureProfileCached()
    expect(original.id).toBe('old-id')
    const changed = await service.updateProfile({ displayName: ' Updated ', handle: '@updated' })
    expect(changed.profile).toMatchObject({ displayName: 'Updated', handle: '@updated', avatarKey: 'portrait-03' })
    const relaunched = createOivoxLocalAccountService(ordinary, localStorage)
    expect((await relaunched.getProfile()).profile.displayName).toBe('Updated')
    expect(localStorage.getItem('oivox.socialState.v2:old-id')).not.toBeNull()
  })

  it('does not use a mutable nickname, review ID, or ambiguous cached identity to select another account', () => {
    mergeAccountUserWithLocalCache({ id: 'x1', email: ordinary.identifier, profile: { displayName: 'Alice' } })
    mergeAccountUserWithLocalCache({ id: 'x2', email: ordinary.identifier, profile: { displayName: 'Alice 2' } })
    expect(localUserForEntry(ordinary, localStorage).id).toBe(ordinary.scopedID)
    expect(localUserForEntry({ ...another, nickname: 'Alice' }, localStorage).id).toBe(another.scopedID)
    expect(localUserForEntry({ ...another, scopedID: review.scopedID }, localStorage)).toBeNull()
    expect(localUserForEntry(review, localStorage)).toMatchObject({ id: review.scopedID, isTestAccount: true })
  })

  it('removes only the deleted account while logout preserves existing business data', async () => {
    const first = createOivoxLocalAccountService(ordinary, localStorage)
    const second = createOivoxLocalAccountService(another, localStorage)
    await first.ensureProfileCached()
    await second.ensureProfileCached()
    localStorage.setItem('oivox.socialState.v2:account-alice', '1')
    localStorage.setItem('oivox.socialState.v2:account-bob', '2')
    await first.deleteAccount()
    await second.logout()
    expect(localStorage.getItem(accountUserCacheKey(ordinary.scopedID))).toBeNull()
    expect(localStorage.getItem('oivox.socialState.v2:account-alice')).toBeNull()
    expect(localStorage.getItem(accountUserCacheKey(another.scopedID))).not.toBeNull()
    expect(localStorage.getItem('oivox.socialState.v2:account-bob')).toBe('2')
    await expect(first.getProfile()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('never sends old A account requests when opening or editing the profile', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    try {
      const service = createOivoxLocalAccountService(ordinary, localStorage)
      await service.ensureProfileCached()
      await service.updateProfile({ displayName: 'New name' })
      await expect(service.login()).rejects.toMatchObject({ code: 'ACCOUNT_ENTRY_REQUIRED' })
      await expect(service.register()).rejects.toMatchObject({ code: 'ACCOUNT_ENTRY_REQUIRED' })
      await service.deleteAccount()
      expect(fetch).not.toHaveBeenCalled()
    } finally {
      fetch.mockRestore()
    }
  })
})
