import { beforeEach, describe, expect, it } from 'vitest'
import { createCoinWalletStore } from './coinWalletStore'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

beforeEach(() => localStorage.clear())

describe('coin wallet store', () => {
  it('spends once and persists the account-scoped balance', () => {
    const wallet = createCoinWalletStore({ accountID: 'a', initialBalance: 120 })
    wallet.spend({ amount: 5, reason: 'translation', transactionID: 'translate-1' })
    wallet.spend({ amount: 5, reason: 'translation', transactionID: 'translate-1' })
    expect(wallet.getSnapshot().balance).toBe(115)
    expect(createCoinWalletStore({ accountID: 'a', initialBalance: 120 }).getSnapshot().balance).toBe(115)
  })

  it('atomically exchanges 50 coins for five stable discovery cards', () => {
    const storage = memoryStorage()
    const wallet = createCoinWalletStore({ accountID: 'discovery-pack-account', initialBalance: 50, storage })
    const userIDs = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
    const first = wallet.exchangeDiscoveryCards({ cost: 50, userIDs, transactionID: 'pack-1', dayKey: '2026-09-23' })
    const duplicate = wallet.exchangeDiscoveryCards({ cost: 50, userIDs, transactionID: 'pack-1', dayKey: '2026-09-23' })
    expect(first.balance).toBe(0)
    expect(duplicate.balance).toBe(0)
    expect(duplicate.transactions.filter((item) => item.type === 'discovery_card_pack')).toHaveLength(1)
    expect(duplicate.transactions[0].metadata.userIDs).toEqual(userIDs)
  })

  it('does not deduct when a discovery pack is invalid or the balance is insufficient', () => {
    const wallet = createCoinWalletStore({ accountID: 'low-pack-account', initialBalance: 49, storage: memoryStorage() })
    expect(() => wallet.exchangeDiscoveryCards({ cost: 50, userIDs: ['1', '2', '3', '4', '5'], transactionID: 'pack-low' })).toThrowError('INSUFFICIENT_BALANCE')
    expect(wallet.getSnapshot().balance).toBe(49)
    expect(() => wallet.exchangeDiscoveryCards({ cost: 50, userIDs: ['1'], transactionID: 'pack-invalid' })).toThrowError('INVALID_CARD_PACK')
    expect(wallet.getSnapshot().transactions).toHaveLength(0)
  })

  it('never mutates on insufficient balance or failed persistence', () => {
    const wallet = createCoinWalletStore({ accountID: 'a', initialBalance: 4 })
    expect(() => wallet.spend({ amount: 5, reason: 'translation', transactionID: 'translate-1' })).toThrowError(expect.objectContaining({ code: 'INSUFFICIENT_BALANCE' }))
    expect(wallet.getSnapshot().balance).toBe(4)
    const broken = createCoinWalletStore({ accountID: 'b', initialBalance: 50, storage: { getItem: () => null, setItem: () => { throw new Error('quota') } } })
    expect(() => broken.spend({ amount: 5, reason: 'translation', transactionID: 'translate-2' })).toThrowError(expect.objectContaining({ code: 'PERSIST_FAILED' }))
    expect(broken.getSnapshot().balance).toBe(50)
  })

  it('credits a verified StoreKit transaction only once', () => {
    const wallet = createCoinWalletStore({ accountID: 'a', initialBalance: 0 })
    wallet.creditPurchase({ amount: 60, productID: 'mwxeencdjybvgjcs', transactionID: 'apple-42' })
    wallet.creditPurchase({ amount: 60, productID: 'mwxeencdjybvgjcs', transactionID: 'apple-42' })
    expect(wallet.getSnapshot().balance).toBe(60)
  })
})
