import { discoveryPeople } from '../data/discoveryFixtures'
import { OIVOX_TEST_USER_ID, oivoxTestFixtures } from '../data/oivoxTestFixtures'

export const SOCIAL_SCHEMA_VERSION = 2
const STORAGE_PREFIX = 'oivox.socialState.v2'
const REPORT_REASON_IDS = new Set(['harassment', 'sexual_explicit', 'hate_threats', 'scam_fraud', 'private_contact', 'fake_voice'])

const clone = (value) => JSON.parse(JSON.stringify(value))
const nowISO = () => new Date().toISOString()

export class SocialStoreError extends Error {
  constructor(code, message = code) {
    super(message)
    this.name = 'SocialStoreError'
    this.code = code
  }
}

function initialRelationships() {
  const relationships = {}
  Object.values(discoveryPeople).forEach((person) => {
    relationships[person.id] = clone(person.relationship)
  })
  oivoxTestFixtures.friendRequests.forEach((request) => {
    const userID = request.fromUserID || request.toUserID
    relationships[userID] = {
      ...relationships[userID],
      friendshipStatus: request.direction === 'incoming' ? 'pending_in' : 'pending_out',
    }
  })
  return relationships
}

function emptyRelationships() {
  return Object.fromEntries(Object.keys(discoveryPeople).map((userID) => [userID, {
    viewerFollows: false,
    followsViewer: false,
    friendshipStatus: 'none',
    blockStatus: 'none',
  }]))
}

function resolveFixtureMessages(thread) {
  const peer = discoveryPeople[thread.peerUserID]
  return thread.messages.map((message) => ({
    ...clone(message),
    durationMs: message.type === 'voice' ? Math.round((message.duration || 7) * 1000) : undefined,
    voiceAsset: message.type === 'voice'
      ? (message.senderID === peer?.id ? peer.voiceClip.asset : oivoxTestFixtures.profileVoiceClip.asset)
      : undefined,
    nativeAssetID: message.type === 'voice'
      ? (message.senderID === peer?.id ? peer.voiceClip.nativeAssetID : oivoxTestFixtures.profileVoiceClip.nativeAssetID)
      : undefined,
    isFixture: true,
  }))
}

function hydratePersistedFixtureAudio(saved, accountID) {
  if (accountID !== OIVOX_TEST_USER_ID) return saved
  const fixtureMessages = new Map(oivoxTestFixtures.threads.flatMap((thread) => resolveFixtureMessages(thread)).map((message) => [message.id, message]))
  return {
    ...saved,
    threads: saved.threads.map((thread) => ({
      ...thread,
      messages: thread.messages.map((message) => {
        if (message.type !== 'voice') return message
        const fixture = fixtureMessages.get(message.id)
        if (!fixture) return message
        return {
          ...message,
          voiceAsset: message.voiceAsset || fixture.voiceAsset,
          nativeAssetID: message.nativeAssetID || fixture.nativeAssetID,
          durationMs: message.durationMs || fixture.durationMs,
        }
      }),
    })),
  }
}

export function createInitialSocialState(accountID = OIVOX_TEST_USER_ID) {
  const useFixture = accountID === OIVOX_TEST_USER_ID
  return {
    schemaVersion: SOCIAL_SCHEMA_VERSION,
    accountID,
    relationshipsByUserID: useFixture ? initialRelationships() : emptyRelationships(),
    friendRequests: useFixture ? clone(oivoxTestFixtures.friendRequests) : [],
    threads: useFixture ? oivoxTestFixtures.threads.map((thread) => ({
      ...clone(thread),
      messages: resolveFixtureMessages(thread),
      isFixture: true,
    })) : [],
    reports: [],
    likedUserIDs: [],
    processedOperationIDs: [],
    updatedAt: nowISO(),
    isFixture: useFixture,
  }
}

function isValidState(value, accountID) {
  return value?.schemaVersion === SOCIAL_SCHEMA_VERSION
    && value.accountID === accountID
    && value.relationshipsByUserID
    && Array.isArray(value.friendRequests)
    && Array.isArray(value.threads)
    && Array.isArray(value.reports)
    && Array.isArray(value.processedOperationIDs)
}

function defaultStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage
}

export function createSocialStore({ accountID = OIVOX_TEST_USER_ID, storage = defaultStorage(), clock = nowISO } = {}) {
  const storageKey = `${STORAGE_PREFIX}:${accountID}`
  const listeners = new Set()
  let state = createInitialSocialState(accountID)

  function readSavedState() {
    if (!storage) return null
    try {
      const saved = JSON.parse(storage.getItem(storageKey) || 'null')
      if (isValidState(saved, accountID)) return hydratePersistedFixtureAudio({ ...saved, likedUserIDs: Array.isArray(saved.likedUserIDs) ? saved.likedUserIDs : [] }, accountID)
    } catch {
      // Fall back only for this social domain. Other business keys are never touched.
    }
    return null
  }

  state = readSavedState() || state

  const snapshot = () => clone(state)
  const notify = () => listeners.forEach((listener) => listener(snapshot()))

  function commit(mutator, operationID) {
    if (!operationID) throw new SocialStoreError('OPERATION_ID_REQUIRED')
    if (state.processedOperationIDs.includes(operationID)) return snapshot()
    const next = snapshot()
    mutator(next)
    next.processedOperationIDs.push(operationID)
    next.updatedAt = clock()
    try {
      storage?.setItem(storageKey, JSON.stringify(next))
    } catch {
      throw new SocialStoreError('PERSIST_FAILED')
    }
    state = next
    notify()
    return snapshot()
  }

  function relationship(userID, source = state) {
    return source.relationshipsByUserID[userID] || {
      viewerFollows: false,
      followsViewer: false,
      friendshipStatus: 'none',
      blockStatus: 'none',
    }
  }

  function assertFriend(userID, source = state) {
    const value = relationship(userID, source)
    if (value.blockStatus !== 'none') throw new SocialStoreError('BLOCKED')
    if (value.friendshipStatus !== 'friends') throw new SocialStoreError('FRIENDS_REQUIRED')
  }

  function ensureThread(next, userID) {
    let thread = next.threads.find((item) => item.peerUserID === userID)
    if (!thread) {
      thread = { id: `thread-${userID.replace(/^user-/, '')}`, peerUserID: userID, unreadCount: 0, messages: [], isFixture: true }
      next.threads.unshift(thread)
    }
    return thread
  }

  return {
    storageKey,
    getSnapshot: snapshot,
    reload() {
      const saved = readSavedState()
      if (saved) state = saved
      notify()
      return snapshot()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    relationship(userID) {
      return clone(relationship(userID))
    },
    canMessage(userID) {
      const value = relationship(userID)
      return value.friendshipStatus === 'friends' && value.blockStatus === 'none'
    },
    setLiked(userID, liked, operationID) {
      return commit((next) => {
        if (!discoveryPeople[userID]) throw new SocialStoreError('USER_NOT_FOUND')
        if (relationship(userID, next).blockStatus !== 'none') throw new SocialStoreError('BLOCKED')
        const values = new Set(next.likedUserIDs || [])
        if (liked) values.add(userID)
        else values.delete(userID)
        next.likedUserIDs = [...values]
      }, operationID)
    },
    sendFriendRequest(userID, note, operationID) {
      const normalized = String(note || '').trim()
      if (!normalized) throw new SocialStoreError('REQUEST_NOTE_REQUIRED')
      if (normalized.length > 200) throw new SocialStoreError('REQUEST_NOTE_TOO_LONG')
      return commit((next) => {
        if (!discoveryPeople[userID]) throw new SocialStoreError('USER_NOT_FOUND')
        const current = relationship(userID, next)
        if (current.blockStatus !== 'none') throw new SocialStoreError('BLOCKED')
        if (current.friendshipStatus === 'friends') throw new SocialStoreError('ALREADY_FRIENDS')
        if (current.friendshipStatus === 'pending_out' || next.friendRequests.some((request) => request.direction === 'outgoing' && request.toUserID === userID && request.status === 'pending')) {
          throw new SocialStoreError('REQUEST_ALREADY_SENT')
        }
        next.friendRequests.unshift({
          id: `request-${operationID}`,
          direction: 'outgoing',
          toUserID: userID,
          status: 'pending',
          note: normalized,
          createdAt: clock(),
          isFixture: true,
        })
        next.relationshipsByUserID[userID] = { ...current, friendshipStatus: 'pending_out' }
      }, operationID)
    },
    cancelOutgoingRequest(userID, operationID) {
      return commit((next) => {
        const current = relationship(userID, next)
        if (current.blockStatus !== 'none') throw new SocialStoreError('BLOCKED')
        const request = next.friendRequests.find((item) => item.direction === 'outgoing' && item.toUserID === userID && item.status === 'pending')
        if (!request || current.friendshipStatus !== 'pending_out') throw new SocialStoreError('REQUEST_NOT_FOUND')
        request.status = 'cancelled'
        request.resolvedAt = clock()
        next.relationshipsByUserID[userID] = { ...current, friendshipStatus: 'none' }
      }, operationID)
    },
    acceptRequest(requestID, operationID) {
      return commit((next) => {
        const request = next.friendRequests.find((item) => item.id === requestID)
        if (!request || request.direction !== 'incoming') throw new SocialStoreError('REQUEST_NOT_FOUND')
        if (request.status !== 'pending') throw new SocialStoreError('REQUEST_ALREADY_HANDLED')
        request.status = 'accepted'
        request.resolvedAt = clock()
        const userID = request.fromUserID
        next.relationshipsByUserID[userID] = {
          ...relationship(userID, next), viewerFollows: true, followsViewer: true, friendshipStatus: 'friends', blockStatus: 'none',
        }
        const thread = ensureThread(next, userID)
        if (request.note && !thread.messages.some((message) => message.requestID === request.id)) {
          thread.messages.push({ id: `message-${request.id}`, requestID: request.id, senderID: userID, type: 'text', text: request.note, sentAt: request.createdAt, isFixture: true })
        }
      }, operationID)
    },
    declineRequest(requestID, operationID) {
      return commit((next) => {
        const request = next.friendRequests.find((item) => item.id === requestID)
        if (!request || request.direction !== 'incoming') throw new SocialStoreError('REQUEST_NOT_FOUND')
        if (request.status !== 'pending') throw new SocialStoreError('REQUEST_ALREADY_HANDLED')
        request.status = 'declined'
        request.resolvedAt = clock()
        const userID = request.fromUserID
        next.relationshipsByUserID[userID] = { ...relationship(userID, next), friendshipStatus: 'none' }
      }, operationID)
    },
    sendText(userID, text, operationID) {
      const normalized = String(text || '').trim()
      if (!normalized) throw new SocialStoreError('MESSAGE_EMPTY')
      return commit((next) => {
        assertFriend(userID, next)
        ensureThread(next, userID).messages.push({ id: `message-${operationID}`, senderID: accountID, type: 'text', text: normalized, sentAt: clock(), isFixture: true })
      }, operationID)
    },
    sendVoice(userID, voice, operationID) {
      if ((!voice?.asset && !voice?.assetID) || !Number.isFinite(voice.durationMs)) throw new SocialStoreError('VOICE_INVALID')
      return commit((next) => {
        assertFriend(userID, next)
        ensureThread(next, userID).messages.push({ id: `message-${operationID}`, senderID: accountID, type: 'voice', voiceAsset: voice.asset, nativeAssetID: voice.assetID, durationMs: Math.min(7000, voice.durationMs), sentAt: clock(), isFixture: true })
      }, operationID)
    },
    markThreadRead(threadID, operationID) {
      return commit((next) => {
        const thread = next.threads.find((item) => item.id === threadID)
        if (!thread) throw new SocialStoreError('THREAD_NOT_FOUND')
        thread.unreadCount = 0
      }, operationID)
    },
    reportUser(userID, reason, operationID, context = {}) {
      if (!discoveryPeople[userID]) throw new SocialStoreError('USER_NOT_FOUND')
      if (!REPORT_REASON_IDS.has(reason)) throw new SocialStoreError('INVALID_REPORT_REASON')
      return commit((next) => {
        const details = String(context.details || '').trim().slice(0, 500)
        const targetType = context.targetType === 'voice' ? 'voice' : 'user'
        next.reports.push({
          id: `report-${operationID}`,
          userID,
          reason,
          details,
          targetType,
          voiceID: targetType === 'voice' ? String(context.voiceID || '') : '',
          createdAt: clock(),
          status: 'local_review_fixture',
          isFixture: true,
        })
      }, operationID)
    },
    blockUser(userID, operationID) {
      return commit((next) => {
        if (!discoveryPeople[userID]) throw new SocialStoreError('USER_NOT_FOUND')
        next.relationshipsByUserID[userID] = {
          ...relationship(userID, next), friendshipStatus: 'none', blockStatus: 'blocked_by_viewer', blockedAt: clock(), viewerFollows: false, followsViewer: false,
        }
        next.friendRequests.forEach((request) => {
          if (request.status === 'pending' && (request.fromUserID === userID || request.toUserID === userID)) request.status = 'cancelled_by_block'
        })
        next.likedUserIDs = (next.likedUserIDs || []).filter((id) => id !== userID)
        const thread = next.threads.find((item) => item.peerUserID === userID)
        if (thread) thread.unreadCount = 0
      }, operationID)
    },
    unblockUser(userID, operationID) {
      return commit((next) => {
        const current = relationship(userID, next)
        if (current.blockStatus !== 'blocked_by_viewer') throw new SocialStoreError('NOT_BLOCKED_BY_VIEWER')
        next.relationshipsByUserID[userID] = { ...current, friendshipStatus: 'none', blockStatus: 'none', blockedAt: null }
      }, operationID)
    },
  }
}
