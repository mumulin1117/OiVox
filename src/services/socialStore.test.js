import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialSocialState, createSocialStore, SOCIAL_SCHEMA_VERSION } from './socialStore'

beforeEach(() => localStorage.clear())

const FRIEND_ID = 'user-media-17-japan-1'
const FOLLOWED_ID = 'user-media-05-turkey-2'
const INCOMING_ID = 'user-media-01-arabic-1'

describe('social store relationship boundaries', () => {
  it('reuses composite fixture relationships without treating follows or likes as friendship', () => {
    const store = createSocialStore({ accountID: 'account-a' })
    expect(store.canMessage(FRIEND_ID)).toBe(true)
    expect(store.canMessage(FOLLOWED_ID)).toBe(false)
    expect(store.relationship(FOLLOWED_ID)).toMatchObject({ viewerFollows: true, friendshipStatus: 'none' })
  })

  it('accepts an incoming request once and creates a friend thread', () => {
    const store = createSocialStore({ accountID: 'account-a' })
    store.acceptRequest('request-layla', 'accept-1')
    store.acceptRequest('request-layla', 'accept-1')
    const state = store.getSnapshot()
    expect(store.canMessage(INCOMING_ID)).toBe(true)
    expect(state.friendRequests.find((item) => item.id === 'request-layla').status).toBe('accepted')
    expect(state.threads.filter((item) => item.peerUserID === INCOMING_ID)).toHaveLength(1)
    expect(state.processedOperationIDs.filter((id) => id === 'accept-1')).toHaveLength(1)
  })

  it('declines without creating friendship and rejects non-friend messages', () => {
    const store = createSocialStore({ accountID: 'account-a' })
    store.declineRequest('request-layla', 'decline-1')
    expect(store.canMessage(INCOMING_ID)).toBe(false)
    expect(() => store.sendText(INCOMING_ID, 'hello', 'message-1')).toThrowError(expect.objectContaining({ code: 'FRIENDS_REQUIRED' }))
  })

  it('sends text and voice once for friends and blocks all later interaction', () => {
    const store = createSocialStore({ accountID: 'account-a' })
    store.sendText(FRIEND_ID, 'Hello', 'text-1')
    store.sendText(FRIEND_ID, 'Hello', 'text-1')
    store.sendVoice(FRIEND_ID, { asset: './assets/discovery/audio/voice-17-japan-1.wav', durationMs: 6600 }, 'voice-1')
    store.sendVoice(FRIEND_ID, { assetID: 'native-voice-1', durationMs: 8200 }, 'voice-native-1')
    let thread = store.getSnapshot().threads.find((item) => item.peerUserID === FRIEND_ID)
    expect(thread.messages.filter((item) => item.id === 'message-text-1')).toHaveLength(1)
    expect(thread.messages.filter((item) => item.id === 'message-voice-1')).toHaveLength(1)
    expect(thread.messages.find((item) => item.id === 'message-voice-native-1')).toMatchObject({ nativeAssetID: 'native-voice-1', durationMs: 7000 })
    store.blockUser(FRIEND_ID, 'block-1')
    expect(store.canMessage(FRIEND_ID)).toBe(false)
    expect(() => store.sendText(FRIEND_ID, 'Still there?', 'text-2')).toThrowError(expect.objectContaining({ code: 'BLOCKED' }))
  })

  it('rolls back memory when persistence fails', () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    const store = createSocialStore({ accountID: 'account-a', storage })
    expect(() => store.acceptRequest('request-layla', 'accept-1')).toThrowError(expect.objectContaining({ code: 'PERSIST_FAILED' }))
    expect(store.canMessage(INCOMING_ID)).toBe(false)
  })

  it('stores local-review reports and keeps unblocked users non-friends', () => {
    const store = createSocialStore({ accountID: 'account-a' })
    store.reportUser(FRIEND_ID, 'spam', 'report-1')
    store.blockUser(FRIEND_ID, 'block-1')
    store.unblockUser(FRIEND_ID, 'unblock-1')
    expect(store.getSnapshot().reports).toContainEqual(expect.objectContaining({ userID: FRIEND_ID, reason: 'spam', status: 'local_review_fixture', isFixture: true }))
    expect(store.relationship(FRIEND_ID)).toMatchObject({ friendshipStatus: 'none', blockStatus: 'none' })
    expect(store.canMessage(FRIEND_ID)).toBe(false)
  })

  it('falls back safely from malformed social JSON without removing unrelated data', () => {
    localStorage.setItem('unrelated-key', 'keep-me')
    localStorage.setItem('oivox.socialState.v2:account-a', '{bad json')
    const store = createSocialStore({ accountID: 'account-a' })
    expect(store.getSnapshot().schemaVersion).toBe(SOCIAL_SCHEMA_VERSION)
    expect(localStorage.getItem('unrelated-key')).toBe('keep-me')
  })

  it('creates isolated state for each account', () => {
    const first = createInitialSocialState('account-a')
    const second = createInitialSocialState('account-b')
    expect(first.accountID).not.toBe(second.accountID)
  })
})
