import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'

export const VOICE_EARTH_ACCESS_SCHEMA_VERSION = 1
const STORAGE_PREFIX = 'oivox.voiceEarthAccess.v1'

function storageKey(accountID) {
  return `${STORAGE_PREFIX}:${String(accountID || 'local-review-account')}`
}

function profileHasVoice(user) {
  const clip = user?.voiceClip || user?.profile?.voiceClip
  return Boolean(clip?.id || clip?.localAssetID || clip?.nativeAssetID || clip?.asset)
}

export function isVoiceEarthUnlocked({ accountID, user, storage = typeof localStorage === 'undefined' ? null : localStorage } = {}) {
  const stableAccountID = String(accountID || user?.id || user?.userID || 'local-review-account')
  if (stableAccountID === OIVOX_TEST_USER_ID || profileHasVoice(user)) return true
  try {
    const value = JSON.parse(storage?.getItem(storageKey(stableAccountID)) || 'null')
    return value?.schemaVersion === VOICE_EARTH_ACCESS_SCHEMA_VERSION
      && value.accountID === stableAccountID
      && value.status === 'unlocked'
      && Boolean(value.voiceClipID)
  } catch {
    return false
  }
}

export function unlockVoiceEarth({ accountID, voiceClipID, storage = typeof localStorage === 'undefined' ? null : localStorage, clock = () => new Date().toISOString() } = {}) {
  const stableAccountID = String(accountID || '')
  const stableVoiceClipID = String(voiceClipID || '')
  if (!stableAccountID || !stableVoiceClipID) throw new Error('VOICE_EARTH_UNLOCK_INVALID')
  const value = {
    schemaVersion: VOICE_EARTH_ACCESS_SCHEMA_VERSION,
    accountID: stableAccountID,
    status: 'unlocked',
    voiceClipID: stableVoiceClipID,
    unlockedAt: clock(),
  }
  storage?.setItem(storageKey(stableAccountID), JSON.stringify(value))
  return value
}

export function voiceEarthAccessKey(accountID) {
  return storageKey(accountID)
}
