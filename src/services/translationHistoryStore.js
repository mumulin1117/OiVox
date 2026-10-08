import { discoveryTranslationHistoryFixtures } from '../data/discoveryExperienceContent'
import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'

export const TRANSLATION_HISTORY_SCHEMA_VERSION = 1
const STORAGE_PREFIX = 'oivox.translationHistory.v1'
const clone = (value) => JSON.parse(JSON.stringify(value))

function initialState(accountID) {
  return {
    schemaVersion: TRANSLATION_HISTORY_SCHEMA_VERSION,
    accountID,
    entries: accountID === OIVOX_TEST_USER_ID ? clone(discoveryTranslationHistoryFixtures) : [],
    processedOperationIDs: [],
    isFixture: accountID === OIVOX_TEST_USER_ID,
  }
}

function validState(value, accountID) {
  return value?.schemaVersion === TRANSLATION_HISTORY_SCHEMA_VERSION
    && value.accountID === accountID
    && Array.isArray(value.entries)
    && Array.isArray(value.processedOperationIDs)
}

export function createTranslationHistoryStore({ accountID, storage = typeof localStorage === 'undefined' ? null : localStorage } = {}) {
  const stableAccountID = String(accountID || 'local-review-account')
  const storageKey = `${STORAGE_PREFIX}:${stableAccountID}`
  let state = initialState(stableAccountID)
  try {
    const saved = JSON.parse(storage?.getItem(storageKey) || 'null')
    if (validState(saved, stableAccountID)) state = saved
  } catch {
    // This domain falls back independently and never removes other business keys.
  }

  function persist(next) {
    storage?.setItem(storageKey, JSON.stringify(next))
    state = next
    return clone(state)
  }

  return {
    storageKey,
    getSnapshot: () => clone(state),
    add(entry, operationID) {
      if (!operationID) throw new Error('OPERATION_ID_REQUIRED')
      if (state.processedOperationIDs.includes(operationID)) return clone(state)
      if (!entry?.userID || !entry?.originalText || !entry?.translatedText) throw new Error('INVALID_TRANSLATION_ENTRY')
      const next = clone(state)
      next.entries.unshift({ ...clone(entry), id: entry.id || `translation-${operationID}`, isFixture: Boolean(entry.isFixture) })
      next.processedOperationIDs.push(operationID)
      return persist(next)
    },
    clear(operationID) {
      if (!operationID) throw new Error('OPERATION_ID_REQUIRED')
      if (state.processedOperationIDs.includes(operationID)) return clone(state)
      const next = clone(state)
      next.entries = []
      next.processedOperationIDs.push(operationID)
      return persist(next)
    },
  }
}
