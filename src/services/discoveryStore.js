import { discoveryPeople } from '../data/discoveryFixtures'
import { EMPTY_DISCOVERY_FILTERS, normalizeDiscoveryFilters, prioritizeDiscoveryUserIDs } from './discoveryFilters'

export const DISCOVERY_SCHEMA_VERSION = 3
const STORAGE_PREFIX = 'oivox.discoveryState.v1'
const FREE_DAILY_LIMIT = 7
const clone = (value) => JSON.parse(JSON.stringify(value))

export class DiscoveryStoreError extends Error {
  constructor(code, message = code) {
    super(message)
    this.name = 'DiscoveryStoreError'
    this.code = code
  }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hash(value) {
  let result = 2166136261
  for (const character of String(value)) {
    result ^= character.charCodeAt(0)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function deterministicOrder(ids, seed) {
  return [...ids].sort((left, right) => hash(`${seed}:${left}`) - hash(`${seed}:${right}`) || left.localeCompare(right))
}

function relationshipFor(userID, relationshipsByUserID = {}) {
  return relationshipsByUserID[userID] || discoveryPeople[userID]?.relationship || {}
}

function isDiscoverable(userID, accountID, relationshipsByUserID = {}) {
  const person = discoveryPeople[userID]
  const relationship = relationshipFor(userID, relationshipsByUserID)
  return Boolean(person)
    && userID !== accountID
    && person.moderationStatus === 'visible'
    && person.privacy?.voiceClip !== false
    && person.voiceClip
    && (relationship.blockStatus || 'none') === 'none'
}

function isEligible(userID, accountID, relationshipsByUserID = {}) {
  const relationship = relationshipFor(userID, relationshipsByUserID)
  return isDiscoverable(userID, accountID, relationshipsByUserID)
    && (relationship.friendshipStatus || 'none') === 'none'
}

function isVisibleAllocatedUser(userID, accountID, relationshipsByUserID = {}) {
  const relationship = relationshipFor(userID, relationshipsByUserID)
  return isDiscoverable(userID, accountID, relationshipsByUserID)
    && ['none', 'pending_out'].includes(relationship.friendshipStatus || 'none')
}

function validState(value, accountID) {
  return [1, 2, DISCOVERY_SCHEMA_VERSION].includes(value?.schemaVersion)
    && value.accountID === accountID
    && typeof value.dateKey === 'string'
    && Array.isArray(value.freeUserIDs)
    && value.decisionsByUserID && typeof value.decisionsByUserID === 'object'
    && Array.isArray(value.processedUserIDs)
    && Array.isArray(value.processedOperationIDs)
}

function transactionDateKey(transaction) {
  if (transaction?.metadata?.dayKey) return String(transaction.metadata.dayKey)
  const date = new Date(transaction?.createdAt || '')
  return Number.isNaN(date.getTime()) ? '' : localDateKey(date)
}

function purchasedUserIDs(walletSnapshot, dateKey) {
  const ids = []
  for (const transaction of walletSnapshot?.transactions || []) {
    if (transaction.type !== 'discovery_card_pack') continue
    if (transactionDateKey(transaction) !== dateKey) continue
    for (const userID of transaction.metadata?.userIDs || []) {
      if (!ids.includes(userID)) ids.push(userID)
    }
  }
  return ids
}

export function createDiscoveryStore({
  accountID = 'local-review-account',
  storage = typeof localStorage === 'undefined' ? null : localStorage,
  dateProvider = () => new Date(),
  clock = () => new Date().toISOString(),
  relationshipsByUserID = {},
} = {}) {
  const stableAccountID = String(accountID || 'local-review-account')
  const storageKey = `${STORAGE_PREFIX}:${stableAccountID}`
  let state = null

  function readSavedState() {
    try {
      const saved = JSON.parse(storage?.getItem(storageKey) || 'null')
      if (!validState(saved, stableAccountID)) return null
      return {
        ...saved,
        schemaVersion: DISCOVERY_SCHEMA_VERSION,
        suppressedUserIDs: Array.isArray(saved.suppressedUserIDs) ? saved.suppressedUserIDs : [],
        previousDayUserIDs: Array.isArray(saved.previousDayUserIDs) ? saved.previousDayUserIDs : [],
        filters: normalizeDiscoveryFilters(saved.filters),
      }
    } catch {
      return null
    }
  }

  state = readSavedState()

  function eligiblePool(relationships = relationshipsByUserID) {
    return Object.keys(discoveryPeople).filter((userID) => isEligible(userID, stableAccountID, relationships))
  }

  function initialFreeIDs(dateKey, excluded = [], relationships = relationshipsByUserID) {
    const allEligible = eligiblePool(relationships)
    const eligible = allEligible.filter((userID) => !excluded.includes(userID))
    const randomDailyOrder = deterministicOrder(eligible, `${stableAccountID}:${dateKey}:free`)
    const fallback = deterministicOrder(allEligible.filter((userID) => excluded.includes(userID)), `${stableAccountID}:${dateKey}:free-repeat`)
    return [...randomDailyOrder, ...fallback].slice(0, FREE_DAILY_LIMIT)
  }

  if (!state) {
    const today = localDateKey(dateProvider())
    state = {
      schemaVersion: DISCOVERY_SCHEMA_VERSION,
      accountID: stableAccountID,
      dateKey: today,
      freeUserIDs: initialFreeIDs(today, [], relationshipsByUserID),
      decisionsByUserID: {},
      processedUserIDs: [],
      processedOperationIDs: [],
      suppressedUserIDs: [],
      previousDayUserIDs: [],
      filters: normalizeDiscoveryFilters(EMPTY_DISCOVERY_FILTERS),
      updatedAt: clock(),
      isFixture: true,
    }
  }

  function persist(next) {
    try {
      storage?.setItem(storageKey, JSON.stringify(next))
    } catch {
      throw new DiscoveryStoreError('PERSIST_FAILED')
    }
    state = next
  }

  function rollToCurrentDay(relationships = relationshipsByUserID) {
    const today = localDateKey(dateProvider())
    if (state.dateKey === today) return
    const previousDayUserIDs = [...new Set([...state.freeUserIDs, ...state.processedUserIDs])]
    persist({
      ...state,
      dateKey: today,
      freeUserIDs: initialFreeIDs(today, previousDayUserIDs, relationships),
      decisionsByUserID: {},
      processedUserIDs: [],
      processedOperationIDs: [],
      suppressedUserIDs: [],
      previousDayUserIDs,
      updatedAt: clock(),
    })
  }

  function suppressUnavailable(walletSnapshot, relationships = relationshipsByUserID) {
    const purchased = purchasedUserIDs(walletSnapshot, state.dateKey)
    const newlySuppressed = [...state.freeUserIDs, ...purchased]
      .filter((userID) => !state.suppressedUserIDs.includes(userID))
      .filter((userID) => !isVisibleAllocatedUser(userID, stableAccountID, relationships))
    if (!newlySuppressed.length) return
    persist({
      ...state,
      suppressedUserIDs: [...state.suppressedUserIDs, ...newlySuppressed],
      updatedAt: clock(),
    })
  }

  function snapshot(walletSnapshot, relationships = relationshipsByUserID, heardVoiceIDs = []) {
    rollToCurrentDay(relationships)
    suppressUnavailable(walletSnapshot, relationships)
    const visibleFreeUserIDs = state.freeUserIDs.filter((userID) => !state.suppressedUserIDs.includes(userID) && isVisibleAllocatedUser(userID, stableAccountID, relationships))
    const bonusUserIDs = purchasedUserIDs(walletSnapshot, state.dateKey)
      .filter((userID) => !state.suppressedUserIDs.includes(userID) && isVisibleAllocatedUser(userID, stableAccountID, relationships))
    const uniqueBonusUserIDs = bonusUserIDs.filter((userID) => !visibleFreeUserIDs.includes(userID))
    const allocatedUserIDs = [...visibleFreeUserIDs, ...uniqueBonusUserIDs]
    const earthUserIDs = [...allocatedUserIDs]
    const remainingFreeUserIDs = visibleFreeUserIDs.filter((userID) => !state.decisionsByUserID[userID])
    const remainingBonusUserIDs = uniqueBonusUserIDs.filter((userID) => !state.decisionsByUserID[userID])
    const remainingUserIDs = [...remainingFreeUserIDs, ...remainingBonusUserIDs]
    const freeRemainingCount = remainingFreeUserIDs.length
    const bonusRemainingCount = remainingBonusUserIDs.length
    const decisions = Object.values(state.decisionsByUserID)
    return {
      ...clone(state),
      freeDailyLimit: FREE_DAILY_LIMIT,
      visibleFreeUserIDs,
      bonusUserIDs,
      allocatedUserIDs,
      earthUserIDs,
      remainingFreeUserIDs,
      remainingBonusUserIDs,
      remainingUserIDs,
      remainingCount: remainingUserIDs.length,
      freeRemainingCount,
      bonusRemainingCount,
      likedToday: decisions.filter((item) => item.kind === 'like').length,
      passedToday: decisions.filter((item) => item.kind === 'pass').length,
    }
  }

  return {
    storageKey,
    getSnapshot: snapshot,
    reload(walletSnapshot, relationships = relationshipsByUserID, heardVoiceIDs = []) {
      const saved = readSavedState()
      if (saved) state = saved
      return snapshot(walletSnapshot, relationships, heardVoiceIDs)
    },
    setFilters(filters, walletSnapshot, relationships = relationshipsByUserID, heardVoiceIDs = []) {
      rollToCurrentDay(relationships)
      suppressUnavailable(walletSnapshot, relationships)
      const normalized = normalizeDiscoveryFilters(filters)
      persist({
        ...state,
        filters: normalized,
        updatedAt: clock(),
      })
      return snapshot(walletSnapshot, relationships, heardVoiceIDs)
    },
    getNextEligibleIDs(count, walletSnapshot, relationships = relationshipsByUserID, heardVoiceIDs = []) {
      if (!Number.isSafeInteger(count) || count <= 0) throw new DiscoveryStoreError('INVALID_COUNT')
      rollToCurrentDay(relationships)
      suppressUnavailable(walletSnapshot, relationships)
      const alreadyAllocated = new Set([...state.freeUserIDs, ...purchasedUserIDs(walletSnapshot, state.dateKey), ...state.processedUserIDs, ...state.suppressedUserIDs])
      return prioritizeDiscoveryUserIDs(deterministicOrder(
        eligiblePool(relationships).filter((userID) => !alreadyAllocated.has(userID)),
        `${stableAccountID}:${state.dateKey}:bonus`,
      ), state.filters, heardVoiceIDs).slice(0, count)
    },
    decide({ userID, kind, operationID, walletSnapshot, relationships = relationshipsByUserID, heardVoiceIDs = [] }) {
      if (!operationID) throw new DiscoveryStoreError('OPERATION_ID_REQUIRED')
      if (!['like', 'pass'].includes(kind)) throw new DiscoveryStoreError('INVALID_DECISION')
      if (state.processedOperationIDs.includes(operationID) || state.decisionsByUserID[userID]) return snapshot(walletSnapshot, relationships, heardVoiceIDs)
      const current = snapshot(walletSnapshot, relationships, heardVoiceIDs)
      if (!current.remainingUserIDs.includes(userID)) throw new DiscoveryStoreError('CARD_NOT_AVAILABLE')
      const next = clone(state)
      next.decisionsByUserID[userID] = { userID, kind, operationID, decidedAt: clock(), isFixture: true }
      if (!next.processedUserIDs.includes(userID)) next.processedUserIDs.push(userID)
      next.processedOperationIDs.push(operationID)
      next.updatedAt = clock()
      persist(next)
      return snapshot(walletSnapshot, relationships, heardVoiceIDs)
    },
  }
}

export { localDateKey }
