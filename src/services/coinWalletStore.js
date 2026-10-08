export const COIN_WALLET_SCHEMA_VERSION = 1
const STORAGE_PREFIX = 'oivox.coinWallet.v1'
const clone = (value) => JSON.parse(JSON.stringify(value))

export class CoinWalletError extends Error {
  constructor(code, message = code) {
    super(message)
    this.name = 'CoinWalletError'
    this.code = code
  }
}

function validState(value, accountID) {
  return value?.schemaVersion === COIN_WALLET_SCHEMA_VERSION
    && value.accountID === accountID
    && Number.isSafeInteger(value.balance)
    && value.balance >= 0
    && Array.isArray(value.transactions)
    && Array.isArray(value.processedTransactionIDs)
}

export function createCoinWalletStore({ accountID, initialBalance = 0, storage = typeof localStorage === 'undefined' ? null : localStorage, clock = () => new Date().toISOString() } = {}) {
  const stableAccountID = String(accountID || 'local-review-account')
  const storageKey = `${STORAGE_PREFIX}:${stableAccountID}`
  const safeInitialBalance = Number.isSafeInteger(initialBalance) && initialBalance >= 0 ? initialBalance : 0
  let state = {
    schemaVersion: COIN_WALLET_SCHEMA_VERSION,
    accountID: stableAccountID,
    balance: safeInitialBalance,
    transactions: [],
    processedTransactionIDs: [],
    updatedAt: clock(),
    isFixture: true,
  }
  try {
    const saved = JSON.parse(storage?.getItem(storageKey) || 'null')
    if (validState(saved, stableAccountID)) state = saved
  } catch {
    // This business domain falls back independently and never clears other keys.
  }

  const snapshot = () => clone(state)
  function commit(transactionID, mutator) {
    if (!transactionID) throw new CoinWalletError('TRANSACTION_ID_REQUIRED')
    if (state.processedTransactionIDs.includes(transactionID)) return snapshot()
    const next = snapshot()
    mutator(next)
    next.processedTransactionIDs.push(transactionID)
    next.updatedAt = clock()
    try {
      storage?.setItem(storageKey, JSON.stringify(next))
    } catch {
      throw new CoinWalletError('PERSIST_FAILED')
    }
    state = next
    return snapshot()
  }

  return {
    storageKey,
    getSnapshot: snapshot,
    spend({ amount, reason, transactionID, metadata = {} }) {
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new CoinWalletError('INVALID_AMOUNT')
      return commit(transactionID, (next) => {
        if (next.balance < amount) throw new CoinWalletError('INSUFFICIENT_BALANCE')
        next.balance -= amount
        next.transactions.unshift({ transactionID, type: 'spend', amount: -amount, reason, metadata: clone(metadata), createdAt: clock(), isFixture: true })
      })
    },
    exchangeDiscoveryCards({ cost, userIDs, transactionID, dayKey }) {
      if (!Number.isSafeInteger(cost) || cost <= 0 || !Array.isArray(userIDs) || userIDs.length !== 5 || new Set(userIDs).size !== 5) {
        throw new CoinWalletError('INVALID_CARD_PACK')
      }
      return commit(transactionID, (next) => {
        if (next.balance < cost) throw new CoinWalletError('INSUFFICIENT_BALANCE')
        next.balance -= cost
        next.transactions.unshift({
          transactionID,
          type: 'discovery_card_pack',
          amount: -cost,
          reason: 'five_more_discovery_cards',
          metadata: { userIDs: clone(userIDs), dayKey: String(dayKey || '') },
          createdAt: clock(),
          isFixture: true,
        })
      })
    },
    creditPurchase({ amount, productID, transactionID }) {
      if (!Number.isSafeInteger(amount) || amount <= 0 || !productID) throw new CoinWalletError('INVALID_PURCHASE')
      return commit(transactionID, (next) => {
        next.balance += amount
        next.transactions.unshift({ transactionID, type: 'storekit_purchase', amount, productID, createdAt: clock(), isFixture: false })
      })
    },
    refund({ amount, reason, transactionID, relatedTransactionID }) {
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new CoinWalletError('INVALID_AMOUNT')
      return commit(transactionID, (next) => {
        next.balance += amount
        next.transactions.unshift({ transactionID, type: 'refund', amount, reason, relatedTransactionID, createdAt: clock(), isFixture: true })
      })
    },
  }
}
