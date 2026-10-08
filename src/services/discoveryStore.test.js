import { describe, expect, it } from 'vitest'
import { discoveryPeople } from '../data/discoveryFixtures'
import { createDiscoveryStore } from './discoveryStore'
import { discoveryPersonMatchesFilters } from './discoveryFilters'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

const emptyWallet = { transactions: [] }

describe('discovery store', () => {
  it('allocates exactly seven stable free cards and restores same-day decisions', () => {
    const storage = memoryStorage()
    const options = { accountID: 'account-1', storage, dateProvider: () => new Date(2026, 8, 23), clock: () => '2026-09-23T10:00:00Z' }
    const first = createDiscoveryStore(options)
    const sameDayFreeIDs = first.getSnapshot(emptyWallet).freeUserIDs
    expect(sameDayFreeIDs).toHaveLength(7)
    expect(new Set(sameDayFreeIDs).size).toBe(7)
    expect(createDiscoveryStore(options).getSnapshot(emptyWallet).freeUserIDs).toEqual(sameDayFreeIDs)
    first.decide({ userID: sameDayFreeIDs[0], kind: 'pass', operationID: 'pass-1', walletSnapshot: emptyWallet })
    const restored = createDiscoveryStore(options).getSnapshot(emptyWallet)
    expect(restored.remainingCount).toBe(6)
    expect(restored.remainingUserIDs).not.toContain(sameDayFreeIDs[0])
  })

  it('filters friends and blocked users and tops the daily allocation back to seven', () => {
    const options = { accountID: 'account-2', dateProvider: () => new Date(2026, 8, 23) }
    const baseline = createDiscoveryStore({ ...options, storage: memoryStorage() }).getSnapshot(emptyWallet)
    const newlyUnavailableID = baseline.freeUserIDs[0]
    const relationshipsByUserID = Object.fromEntries(Object.values(discoveryPeople).map((person) => [person.id, person.relationship]))
    relationshipsByUserID[newlyUnavailableID] = { ...relationshipsByUserID[newlyUnavailableID], friendshipStatus: 'friends' }
    const snapshot = createDiscoveryStore({ ...options, storage: memoryStorage(), relationshipsByUserID }).getSnapshot(emptyWallet, relationshipsByUserID)
    expect(snapshot.freeUserIDs).toHaveLength(7)
    expect(snapshot.freeUserIDs).not.toContain(newlyUnavailableID)
    expect(snapshot.freeUserIDs.every((id) => relationshipsByUserID[id]?.friendshipStatus !== 'friends' && relationshipsByUserID[id]?.blockStatus !== 'blocked_by_viewer')).toBe(true)
  })

  it('keeps the current card visible after an outgoing friend request', () => {
    const storage = memoryStorage()
    const options = { accountID: 'account-pending-request', storage, dateProvider: () => new Date(2026, 8, 23) }
    const store = createDiscoveryStore(options)
    const initial = store.getSnapshot(emptyWallet)
    const requestedUserID = initial.remainingUserIDs[0]
    const relationshipsByUserID = Object.fromEntries(Object.values(discoveryPeople).map((person) => [person.id, person.relationship]))
    relationshipsByUserID[requestedUserID] = { ...relationshipsByUserID[requestedUserID], friendshipStatus: 'pending_out' }

    const afterRequest = store.getSnapshot(emptyWallet, relationshipsByUserID)

    expect(afterRequest.allocatedUserIDs).toContain(requestedUserID)
    expect(afterRequest.remainingUserIDs).toContain(requestedUserID)
    expect(afterRequest.suppressedUserIDs).not.toContain(requestedUserID)
  })

  it('keeps decisions idempotent and exposes purchased pack cards as remaining opportunities', () => {
    const store = createDiscoveryStore({ accountID: 'account-3', storage: memoryStorage(), dateProvider: () => new Date(2026, 8, 23) })
    const initial = store.getSnapshot(emptyWallet)
    const userID = initial.remainingUserIDs[0]
    store.decide({ userID, kind: 'like', operationID: 'decision-1', walletSnapshot: emptyWallet })
    const duplicate = store.decide({ userID, kind: 'like', operationID: 'decision-1', walletSnapshot: emptyWallet })
    expect(duplicate.remainingCount).toBe(6)
    expect(duplicate.likedToday).toBe(1)

    const bonusIDs = store.getNextEligibleIDs(5, emptyWallet)
    expect(bonusIDs).toHaveLength(5)
    const wallet = { transactions: [{ type: 'discovery_card_pack', metadata: { userIDs: bonusIDs, dayKey: '2026-09-23' } }] }
    const snapshot = store.getSnapshot(wallet)
    expect(snapshot.remainingCount).toBe(11)
    expect(snapshot.earthUserIDs).toHaveLength(12)
    expect(snapshot.earthUserIDs).toEqual(expect.arrayContaining([...initial.freeUserIDs, ...bonusIDs]))
    expect(snapshot.earthUserIDs).toContain(userID)
  })

  it('creates a new deterministic free batch on a new local date', () => {
    const storage = memoryStorage()
    let date = new Date(2026, 8, 23)
    const options = { accountID: 'account-4', storage, dateProvider: () => date }
    const first = createDiscoveryStore(options)
    const firstID = first.getSnapshot(emptyWallet).remainingUserIDs[0]
    first.decide({ userID: firstID, kind: 'pass', operationID: 'day-1', walletSnapshot: emptyWallet })
    date = new Date(2026, 8, 24)
    const second = createDiscoveryStore(options).getSnapshot(emptyWallet)
    expect(second.dateKey).toBe('2026-09-24')
    expect(second.decisionsByUserID).toEqual({})
    expect(second.freeUserIDs).not.toContain(firstID)
  })

  it('ignores saved filters when allocating the next day free batch', () => {
    let date = new Date(2026, 8, 23)
    const filteredStore = createDiscoveryStore({ accountID: 'account-next-day-filter', storage: memoryStorage(), dateProvider: () => date })
    const controlStore = createDiscoveryStore({ accountID: 'account-next-day-filter', storage: memoryStorage(), dateProvider: () => date })
    expect(filteredStore.getSnapshot(emptyWallet).freeUserIDs).toEqual(controlStore.getSnapshot(emptyWallet).freeUserIDs)
    filteredStore.setFilters({ regions: ['eastAsia'], languages: ['ko'], onlineNow: true }, emptyWallet)
    date = new Date(2026, 8, 24)
    expect(filteredStore.getSnapshot(emptyWallet).freeUserIDs).toEqual(controlStore.getSnapshot(emptyWallet).freeUserIDs)
  })

  it('keeps coin recommendations on the purchase day and expires them at local midnight', () => {
    const storage = memoryStorage()
    let date = new Date(2026, 8, 23)
    const store = createDiscoveryStore({ accountID: 'account-5', storage, dateProvider: () => date })
    const bonusIDs = store.getNextEligibleIDs(5, emptyWallet)
    const wallet = { transactions: [{ type: 'discovery_card_pack', createdAt: '2026-09-23T08:00:00Z', metadata: { userIDs: bonusIDs, dayKey: '2026-09-23' } }] }
    expect(store.getSnapshot(wallet).bonusUserIDs).toEqual(bonusIDs)
    date = new Date(2026, 8, 24)
    expect(store.getSnapshot(wallet).bonusUserIDs).toEqual([])
  })

  it('suppresses a blocked allocated user for the rest of the day without granting an eighth free opportunity', () => {
    const storage = memoryStorage()
    const relationships = Object.fromEntries(Object.values(discoveryPeople).map((person) => [person.id, { ...person.relationship }]))
    const store = createDiscoveryStore({ accountID: 'account-6', storage, relationshipsByUserID: relationships })
    const initial = store.getSnapshot(emptyWallet, relationships)
    const blockedID = initial.remainingUserIDs[0]
    relationships[blockedID] = { ...relationships[blockedID], friendshipStatus: 'none', blockStatus: 'blocked_by_viewer' }
    const blocked = store.getSnapshot(emptyWallet, relationships)
    expect(blocked.remainingCount).toBe(initial.remainingCount - 1)
    expect(blocked.remainingUserIDs).not.toContain(blockedID)
    expect(blocked.earthUserIDs).not.toContain(blockedID)
    relationships[blockedID] = { ...relationships[blockedID], blockStatus: 'none' }
    expect(store.getSnapshot(emptyWallet, relationships).remainingUserIDs).not.toContain(blockedID)
  })

  it('keeps earned users on Voice Earth after a decision while excluding every blocked relationship', () => {
    const relationships = Object.fromEntries(Object.values(discoveryPeople).map((person) => [person.id, { ...person.relationship }]))
    const store = createDiscoveryStore({
      accountID: 'account-earth',
      storage: memoryStorage(),
      dateProvider: () => new Date(2026, 8, 23),
      relationshipsByUserID: relationships,
    })
    const initial = store.getSnapshot(emptyWallet, relationships)
    const decidedID = initial.remainingUserIDs[0]
    store.decide({ userID: decidedID, kind: 'pass', operationID: 'earth-pass', walletSnapshot: emptyWallet, relationships })
    expect(store.getSnapshot(emptyWallet, relationships).earthUserIDs).toContain(decidedID)

    const bonusIDs = store.getNextEligibleIDs(5, emptyWallet, relationships)
    const wallet = { transactions: [{ type: 'discovery_card_pack', metadata: { userIDs: bonusIDs, dayKey: '2026-09-23' } }] }
    relationships[bonusIDs[0]] = { ...relationships[bonusIDs[0]], blockStatus: 'blocked_by_viewer' }
    relationships[bonusIDs[1]] = { ...relationships[bonusIDs[1]], blockStatus: 'blocked_by_them' }
    const earth = store.getSnapshot(wallet, relationships)
    expect(earth.earthUserIDs).not.toContain(bonusIDs[0])
    expect(earth.earthUserIDs).not.toContain(bonusIDs[1])
    expect(earth.earthUserIDs).toEqual(expect.arrayContaining(bonusIDs.slice(2)))
  })

  it('keeps the random daily free opportunities and their order unchanged when filters change', () => {
    const store = createDiscoveryStore({ accountID: 'account-filter', storage: memoryStorage(), dateProvider: () => new Date(2026, 8, 23) })
    const before = store.getSnapshot(emptyWallet)
    const filters = { regions: ['eastAsia'], languages: ['ja'] }
    const snapshot = store.setFilters(filters, emptyWallet)
    expect(snapshot.freeUserIDs).toEqual(before.freeUserIDs)
    expect(snapshot.remainingFreeUserIDs).toEqual(before.remainingFreeUserIDs)
    expect(snapshot.remainingUserIDs).toEqual(before.remainingUserIDs)
    expect(snapshot.filters).toEqual({ regions: ['eastAsia'], languages: ['ja'], onlineNow: false, notHeardYet: false })
  })

  it('does not restore a consumed opportunity when filters change', () => {
    const store = createDiscoveryStore({ accountID: 'account-filter-consumed', storage: memoryStorage(), dateProvider: () => new Date(2026, 8, 23) })
    const firstID = store.getSnapshot(emptyWallet).remainingUserIDs[0]
    store.decide({ userID: firstID, kind: 'pass', operationID: 'filter-pass', walletSnapshot: emptyWallet })
    const filtered = store.setFilters({ languages: ['en'] }, emptyWallet)
    expect(filtered.freeUserIDs).toHaveLength(7)
    expect(filtered.remainingCount).toBe(6)
    expect(filtered.remainingUserIDs).not.toContain(firstID)
  })

  it('uses filters only for newly purchased opportunities and fills shortages after matches', () => {
    const store = createDiscoveryStore({ accountID: 'account-filter-purchase', storage: memoryStorage(), dateProvider: () => new Date(2026, 8, 23) })
    const freeBeforeFiltering = store.getSnapshot(emptyWallet).freeUserIDs
    const filters = { regions: ['eastAsia'], languages: ['ko'] }
    store.setFilters(filters, emptyWallet)
    const purchased = store.getNextEligibleIDs(5, emptyWallet)
    const firstFallback = purchased.findIndex((id) => !discoveryPersonMatchesFilters(discoveryPeople[id], filters))
    expect(purchased).toHaveLength(5)
    expect(firstFallback).toBeGreaterThan(0)
    expect(purchased.slice(0, firstFallback).every((id) => discoveryPersonMatchesFilters(discoveryPeople[id], filters))).toBe(true)
    expect(purchased.slice(firstFallback).every((id) => !discoveryPersonMatchesFilters(discoveryPeople[id], filters))).toBe(true)

    const wallet = { transactions: [{ type: 'discovery_card_pack', metadata: { userIDs: purchased, dayKey: '2026-09-23' } }] }
    const snapshot = store.getSnapshot(wallet)
    expect(snapshot.freeUserIDs).toEqual(freeBeforeFiltering)
    expect(snapshot.remainingBonusUserIDs).toEqual(purchased)
    expect(snapshot.remainingUserIDs.slice(0, snapshot.freeRemainingCount)).toEqual(snapshot.remainingFreeUserIDs)
    expect(snapshot.remainingUserIDs.slice(snapshot.freeRemainingCount)).toEqual(snapshot.remainingBonusUserIDs)
  })
})
