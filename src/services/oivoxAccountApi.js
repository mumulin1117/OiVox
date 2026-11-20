import { clearAccountLocalData } from './accountDeletionStore'
import { accountUserCacheKey, mergeAccountUserWithLocalCache } from './accountUserCache'

const CACHE_PREFIX = accountUserCacheKey('')
const REVIEW_ID = '42618403-0000-4000-8000-000000000001'
const EDITABLE_FIELDS = new Set([
  'displayName', 'handle', 'aboutMe', 'spokenLanguages', 'preferredLanguage',
  'interests', 'avatarSource', 'avatarKey', 'localAssetID',
])

export class OiVoxApiError extends Error {
  constructor(code) {
    super(code)
    this.name = 'OiVoxApiError'
    this.code = code
  }
}

export function accountErrorMessageKey(code) {
  return ({
    ACCOUNT_NOT_FOUND: 'accountNotFound',
    INVALID_PASSWORD: 'incorrectPassword',
    EMAIL_IN_USE: 'emailInUse',
    UNAUTHORIZED: 'sessionExpired',
    INVALID_DISPLAY_NAME: 'displayNameRequired',
    AVATAR_REQUIRED: 'avatarRequired',
  })[code] || 'requestFailed'
}

function cachedUser(id, storage) {
  try {
    const user = JSON.parse(storage.getItem(accountUserCacheKey(id)) || 'null')
    return user?.id === id && user.schemaVersion === 1 ? user : null
  } catch {
    return null
  }
}

export function localUserForEntry(entry, storage) {
  if (!entry || typeof entry.identifier !== 'string' || !entry.identifier.trim() ||
    typeof entry.scopedID !== 'string' || !entry.scopedID) return null

  const { scopedID, identifier } = entry
  const review = entry.isTestAccount === true && scopedID === REVIEW_ID && identifier === 'oivox@gmail.com'
  if (scopedID === REVIEW_ID && !review) return null

  // Match an old profile only by the credential used by the new entry, never by its editable nickname.
  const aliases = []
  if (!review) {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (!key?.startsWith(CACHE_PREFIX)) continue
      const id = key.slice(CACHE_PREFIX.length)
      if (id === REVIEW_ID || id === scopedID) continue
      const user = cachedUser(id, storage)
      if (typeof user?.email === 'string' && user.email.trim().normalize('NFC').toLowerCase() === identifier) aliases.push(user)
    }
  }
  const matched = cachedUser(scopedID, storage) || (aliases.length === 1 ? aliases[0] : null)
  if (matched) return matched

  const now = new Date().toISOString()
  const email = identifier.includes('@') ? identifier : ''
  return {
    id: scopedID,
    email,
    emailVerified: false,
    isTestAccount: review,
    profileComplete: true,
    wallet: { coinBalance: review ? 120 : 0 },
    profile: review ? {
      displayName: 'Mia', handle: '@mia_voice', avatarSource: 'preset', avatarKey: 'portrait-09',
      countryCode: 'GB', timezone: 'UTC+0', aboutMe: 'Seven seconds at a time.',
      spokenLanguages: ['en', 'fr'], preferredLanguage: 'en', ageRange: '25-34',
      interests: ['food', 'travel'], verified: true,
    } : {
      displayName: entry.nickname || '', interests: [], spokenLanguages: [],
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function createOivoxLocalAccountService(entry, storage) {
  let user = null
  let signedOut = false

  function current() {
    if (signedOut) throw new OiVoxApiError('UNAUTHORIZED')
    user = (user && cachedUser(user.id, storage)) || user || localUserForEntry(entry, storage)
    if (!user) throw new OiVoxApiError('UNAUTHORIZED')
    return user
  }

  function save(next) {
    // Persist before changing the service state so a failed write can be retried.
    storage.setItem(accountUserCacheKey(next.id), JSON.stringify({ ...next, schemaVersion: 1 }))
    user = next
    return next
  }

  async function accountEntryRequired() {
    throw new OiVoxApiError('ACCOUNT_ENTRY_REQUIRED')
  }

  return {
    login: accountEntryRequired,
    register: accountEntryRequired,
    async hasSession() {
      return !signedOut && Boolean(entry)
    },
    async getProfile() {
      return current()
    },
    async updateProfile(patch) {
      const prior = current()
      const changes = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => EDITABLE_FIELDS.has(key)))
      if (changes.displayName !== undefined && (typeof changes.displayName !== 'string' ||
        !changes.displayName.trim() || [...changes.displayName.trim()].length > 32)) {
        throw new OiVoxApiError('INVALID_DISPLAY_NAME')
      }
      const profile = { ...prior.profile, ...changes }
      if (changes.displayName !== undefined) profile.displayName = changes.displayName.trim()
      if (changes.avatarSource === 'preset') delete profile.localAssetID
      if (changes.avatarSource === 'camera' || changes.avatarSource === 'photoLibrary') delete profile.avatarKey
      return save({ ...prior, profile, updatedAt: new Date().toISOString() })
    },
    async deleteAccount() {
      const id = current().id
      clearAccountLocalData(id, storage)
      user = null
      signedOut = true
    },
    async logout() {
      user = null
      signedOut = true
      postShowingAccountEvent('logout')
    },
    async ensureProfileCached() {
      return save(mergeAccountUserWithLocalCache(current(), null))
    },
  }
}

export function postShowingAccountEvent(action) {
  const handler = globalThis.webkit?.messageHandlers?.oivoxShowingAccount
  if (typeof handler?.postMessage === 'function') handler.postMessage({ action })
}

export const oivoxAccountApi = createOivoxLocalAccountService(
  globalThis.__OIVOX_SHOWING_ACCOUNT__ ?? null,
  typeof localStorage === 'undefined' ? null : localStorage,
)
