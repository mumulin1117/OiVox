export const VOICE_ACTIVITY_SCHEMA_VERSION = 1
const STORAGE_PREFIX = 'oivox.voiceActivity.v1'
const clone = (value) => JSON.parse(JSON.stringify(value))

function validState(value, accountID) {
  return value?.schemaVersion === VOICE_ACTIVITY_SCHEMA_VERSION
    && value.accountID === accountID
    && Array.isArray(value.heardVoices)
}

export function createVoiceActivityStore({ accountID, storage = typeof localStorage === 'undefined' ? null : localStorage, clock = () => new Date().toISOString() } = {}) {
  const stableAccountID = String(accountID || 'local-review-account')
  const storageKey = `${STORAGE_PREFIX}:${stableAccountID}`
  let state = { schemaVersion: VOICE_ACTIVITY_SCHEMA_VERSION, accountID: stableAccountID, heardVoices: [] }
  try {
    const saved = JSON.parse(storage?.getItem(storageKey) || 'null')
    if (validState(saved, stableAccountID)) state = saved
  } catch {
    // Fall back only for this domain and keep all other account data intact.
  }

  function persist(next) {
    storage?.setItem(storageKey, JSON.stringify(next))
    state = next
    return clone(state)
  }

  return {
    storageKey,
    getSnapshot: () => clone(state),
    markHeard({ voiceID, userID = '', countryCode = '' } = {}) {
      if (!voiceID) return clone(state)
      if (state.heardVoices.some((item) => item.voiceID === voiceID)) return clone(state)
      return persist({
        ...clone(state),
        heardVoices: [{ voiceID, userID, countryCode, heardAt: clock() }, ...state.heardVoices],
      })
    },
  }
}
