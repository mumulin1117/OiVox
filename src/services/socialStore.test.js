import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialSocialState, createSocialStore, SOCIAL_SCHEMA_VERSION } from './socialStore'
import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'

beforeEach(() => localStorage.clear())

const FRIEND_ID = 'user-media-17-japan-1'
const FOLLOWED_ID = 'user-media-05-turkey-2'
const INCOMING_ID = 'user-media-01-arabic-1'

describe('social store relationship boundaries', () => {
  it('reuses composite fixture relationships without treating follows or likes as friendship', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    expect(store.canMessage(FRIEND_ID)).toBe(true)
    expect(store.canMessage(FOLLOWED_ID)).toBe(false)
    expect(store.relationship(FOLLOWED_ID)).toMatchObject({ viewerFollows: true, friendshipStatus: 'none' })
  })

  it('accepts an incoming request once and creates a friend thread', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    store.acceptRequest('request-layla', 'accept-1')
    store.acceptRequest('request-layla', 'accept-1')
    const state = store.getSnapshot()
    expect(store.canMessage(INCOMING_ID)).toBe(true)
    expect(state.friendRequests.find((item) => item.id === 'request-layla').status).toBe('accepted')
    expect(state.threads.filter((item) => item.peerUserID === INCOMING_ID)).toHaveLength(1)
    expect(state.processedOperationIDs.filter((id) => id === 'accept-1')).toHaveLength(1)
  })

  it('declines without creating friendship and rejects non-friend messages', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    store.declineRequest('request-layla', 'decline-1')
    expect(store.canMessage(INCOMING_ID)).toBe(false)
    expect(() => store.sendText(INCOMING_ID, 'hello', 'message-1')).toThrowError(expect.objectContaining({ code: 'FRIENDS_REQUIRED' }))
  })

  it('sends one independent friend request without treating a like or follow as friendship', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    store.sendFriendRequest(FOLLOWED_ID, 'Would you like to swap stories?', 'request-out-1')
    store.sendFriendRequest(FOLLOWED_ID, 'Would you like to swap stories?', 'request-out-1')
    const snapshot = store.getSnapshot()
    expect(store.relationship(FOLLOWED_ID)).toMatchObject({ friendshipStatus: 'pending_out' })
    expect(store.canMessage(FOLLOWED_ID)).toBe(false)
    expect(snapshot.friendRequests.filter((item) => item.toUserID === FOLLOWED_ID && item.status === 'pending')).toHaveLength(1)
  })

  it('cancels one outgoing request and restores the unrelated state', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    store.sendFriendRequest(FOLLOWED_ID, 'Would you like to swap stories?', 'request-out-1')
    store.cancelOutgoingRequest(FOLLOWED_ID, 'cancel-out-1')
    store.cancelOutgoingRequest(FOLLOWED_ID, 'cancel-out-1')
    const snapshot = store.getSnapshot()
    expect(store.relationship(FOLLOWED_ID)).toMatchObject({ friendshipStatus: 'none' })
    expect(snapshot.friendRequests.find((item) => item.toUserID === FOLLOWED_ID)).toMatchObject({ status: 'cancelled' })
    expect(snapshot.processedOperationIDs.filter((id) => id === 'cancel-out-1')).toHaveLength(1)
  })

  it('toggles a like idempotently without changing friendship', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    store.setLiked(FOLLOWED_ID, true, 'like-1')
    store.setLiked(FOLLOWED_ID, true, 'like-1')
    expect(store.getSnapshot().likedUserIDs).toEqual([FOLLOWED_ID])
    expect(store.relationship(FOLLOWED_ID).friendshipStatus).toBe('none')
    store.setLiked(FOLLOWED_ID, false, 'unlike-1')
    expect(store.getSnapshot().likedUserIDs).toEqual([])
  })

  it('sends text and voice once for friends and blocks all later interaction', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
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
    expect(store.getSnapshot().threads.find((item) => item.peerUserID === FRIEND_ID).unreadCount).toBe(0)
    expect(() => store.sendText(FRIEND_ID, 'Still there?', 'text-2')).toThrowError(expect.objectContaining({ code: 'BLOCKED' }))
  })

  it('reloads changes made by another page-scoped store instance', () => {
    const first = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    const second = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    second.blockUser(FRIEND_ID, 'block-from-secondary-page')
    expect(first.canMessage(FRIEND_ID)).toBe(true)
    first.reload()
    expect(first.canMessage(FRIEND_ID)).toBe(false)
  })

  it('rolls back memory when persistence fails', () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID, storage })
    expect(() => store.acceptRequest('request-layla', 'accept-1')).toThrowError(expect.objectContaining({ code: 'PERSIST_FAILED' }))
    expect(store.canMessage(INCOMING_ID)).toBe(false)
  })

  it('stores local-review reports and keeps unblocked users non-friends', () => {
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    store.reportUser(FRIEND_ID, 'fake_voice', 'report-1', { details: 'The clip repeats a synthetic phrase.', targetType: 'voice', voiceID: 'voice-1' })
    store.reportUser(FRIEND_ID, 'fake_voice', 'report-1', { details: 'duplicate', targetType: 'voice', voiceID: 'voice-1' })
    store.blockUser(FRIEND_ID, 'block-1')
    store.unblockUser(FRIEND_ID, 'unblock-1')
    expect(store.getSnapshot().reports).toEqual([expect.objectContaining({ userID: FRIEND_ID, reason: 'fake_voice', details: 'The clip repeats a synthetic phrase.', targetType: 'voice', voiceID: 'voice-1', status: 'local_review_fixture', isFixture: true })])
    expect(store.relationship(FRIEND_ID)).toMatchObject({ friendshipStatus: 'none', blockStatus: 'none' })
    expect(store.canMessage(FRIEND_ID)).toBe(false)
  })

  it('falls back safely from malformed social JSON without removing unrelated data', () => {
    localStorage.setItem('unrelated-key', 'keep-me')
    localStorage.setItem(`oivox.socialState.v2:${OIVOX_TEST_USER_ID}`, '{bad json')
    const store = createSocialStore({ accountID: OIVOX_TEST_USER_ID })
    expect(store.getSnapshot().schemaVersion).toBe(SOCIAL_SCHEMA_VERSION)
    expect(localStorage.getItem('unrelated-key')).toBe('keep-me')
  })

  it('repairs persisted fixture voice messages that predate playable local asset fields', () => {
    const stale = createInitialSocialState(OIVOX_TEST_USER_ID)
    stale.threads.forEach((thread) => thread.messages.forEach((message) => {
      if (message.type === 'voice') delete message.voiceAsset
    }))
    localStorage.setItem(`oivox.socialState.v2:${OIVOX_TEST_USER_ID}`, JSON.stringify(stale))
    const restored = createSocialStore({ accountID: OIVOX_TEST_USER_ID }).getSnapshot()
    const voiceMessages = restored.threads.flatMap((thread) => thread.messages).filter((message) => message.type === 'voice')
    expect(voiceMessages.length).toBeGreaterThan(0)
    expect(voiceMessages.every((message) => message.voiceAsset?.startsWith('./assets/discovery/audio/'))).toBe(true)
    expect(voiceMessages.every((message) => message.nativeAssetID?.startsWith('voice-'))).toBe(true)
  })

  it('creates isolated state for each account', () => {
    const first = createInitialSocialState('account-a')
    const second = createInitialSocialState('account-b')
    expect(first.accountID).not.toBe(second.accountID)
  })

  it('starts non-test accounts without the fixed review account friends or messages', () => {
    const state = createInitialSocialState('new-account')
    expect(state.friendRequests).toEqual([])
    expect(state.threads).toEqual([])
    expect(Object.values(state.relationshipsByUserID).some((item) => item.friendshipStatus === 'friends')).toBe(false)
  })
})
