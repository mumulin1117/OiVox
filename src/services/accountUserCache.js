export const ACCOUNT_USER_CACHE_SCHEMA_VERSION = 1
const STORAGE_PREFIX = 'oivox.accountUser.v1'

const PROFILE_FIELDS = Object.freeze([
  'displayName', 'handle', 'avatarSource', 'avatarKey', 'localAssetID', 'countryCode',
  'timezone', 'aboutMe', 'spokenLanguages', 'preferredLanguage', 'ageRange',
  'interests', 'verified', 'avatarFrameID', 'avatarFrameLabel',
])

const definedEntries = (value, allowedFields) => Object.fromEntries(
  allowedFields
    .filter((field) => value?.[field] !== undefined)
    .map((field) => [field, value[field]]),
)

function read(accountID, storage) {
  try {
    const value = JSON.parse(storage?.getItem(`${STORAGE_PREFIX}:${accountID}`) || 'null')
    if (value?.schemaVersion === ACCOUNT_USER_CACHE_SCHEMA_VERSION && value.id === accountID) return value
  } catch {
    // A damaged account cache never clears unrelated local business data.
  }
  return null
}

export function mergeAccountUserWithLocalCache(user, storage = typeof localStorage === 'undefined' ? null : localStorage) {
  const accountID = String(user?.id || user?.userID || '')
  if (!accountID) return user
  const cached = read(accountID, storage) || {}
  const liveProfile = definedEntries(user?.profile, PROFILE_FIELDS)
  const liveWallet = definedEntries(user?.wallet, ['coinBalance'])
  const liveStats = definedEntries(user?.stats || user?.profileStats, [
    'translatedCountryCount', 'countriesTranslated', 'friendsCount', 'voicesHeardCount',
    'heardVoiceCount', 'heardByCount', 'voiceClipsCount',
  ])
  const merged = {
    ...cached,
    ...definedEntries(user, ['id', 'email', 'emailVerified', 'profileComplete', 'isTestAccount', 'createdAt', 'updatedAt']),
    id: accountID,
    profile: { ...(cached.profile || {}), ...liveProfile },
    wallet: { ...(cached.wallet || {}), ...liveWallet },
    stats: { ...(cached.stats || {}), ...liveStats },
  }
  const stored = { ...merged, schemaVersion: ACCOUNT_USER_CACHE_SCHEMA_VERSION }
  try { storage?.setItem(`${STORAGE_PREFIX}:${accountID}`, JSON.stringify(stored)) } catch {}
  const preview = user?.profile?.clientAvatarPreview
  return preview ? { ...merged, profile: { ...merged.profile, clientAvatarPreview: preview } } : merged
}

export function accountUserCacheKey(accountID) {
  return `${STORAGE_PREFIX}:${String(accountID || '')}`
}

export function updateLocalAccountProfile(user, profilePatch, storage = typeof localStorage === 'undefined' ? null : localStorage) {
  const accountID = String(user?.id || user?.userID || '')
  if (!accountID) return user
  const safePatch = definedEntries(profilePatch, ['avatarFrameID', 'avatarFrameLabel'])
  const merged = {
    ...user,
    id: accountID,
    profile: { ...(user?.profile || {}), ...safePatch },
  }
  const cached = read(accountID, storage) || {}
  const stored = {
    ...cached,
    ...definedEntries(merged, ['id', 'email', 'emailVerified', 'profileComplete', 'isTestAccount', 'createdAt', 'updatedAt']),
    id: accountID,
    profile: { ...(cached.profile || {}), ...definedEntries(merged.profile, PROFILE_FIELDS) },
    wallet: { ...(cached.wallet || {}), ...definedEntries(merged.wallet, ['coinBalance']) },
    stats: { ...(cached.stats || {}), ...definedEntries(merged.stats, [
      'translatedCountryCount', 'countriesTranslated', 'friendsCount', 'voicesHeardCount',
      'heardVoiceCount', 'heardByCount', 'voiceClipsCount',
    ]) },
    schemaVersion: ACCOUNT_USER_CACHE_SCHEMA_VERSION,
  }
  try { storage?.setItem(`${STORAGE_PREFIX}:${accountID}`, JSON.stringify(stored)) } catch {}
  return merged
}
