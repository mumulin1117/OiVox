import portrait02 from '../assets/portraits/portrait-02.png'
import portrait03 from '../assets/portraits/portrait-03.png'
import portrait04 from '../assets/portraits/portrait-04.png'
import portrait07 from '../assets/portraits/portrait-07.png'
import portrait09 from '../assets/portraits/portrait-09.png'

const presetAvatars = Object.freeze({
  'portrait-02': portrait02,
  'portrait-03': portrait03,
  'portrait-04': portrait04,
  'portrait-07': portrait07,
  'portrait-09': portrait09,
})

export function resolveAccountAvatar(user) {
  const preview = user?.profile?.clientAvatarPreview
  if (typeof preview === 'string' && preview.startsWith('data:image/')) return preview
  return presetAvatars[user?.profile?.avatarKey] || portrait09
}

export function resolveAccountCoinBalance(user) {
  const balance = user?.wallet?.coinBalance
  return Number.isSafeInteger(balance) && balance >= 0 ? balance : 0
}

const nonNegativeInteger = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null
const firstInteger = (...values) => values.map(nonNegativeInteger).find((value) => value !== null)

export function resolveAccountProfileSummary({
  user,
  relationshipsByUserID = {},
  translationEntries = [],
  heardVoices = [],
  peopleByID = {},
  listenerUserIDs = [],
  voiceClips = [],
  coinBalance = 0,
  fallback = {},
} = {}) {
  const api = user?.stats || user?.profileStats || {}
  const translatedCountries = new Set(translationEntries.map((entry) => entry.countryCode || peopleByID[entry.userID]?.countryCode).filter(Boolean))
  const heardVoiceIDs = new Set([
    ...heardVoices.map((entry) => entry.voiceID),
    ...translationEntries.map((entry) => entry.voiceID || peopleByID[entry.userID]?.voiceClip?.id),
  ].filter(Boolean))
  const localListenerIDs = new Set(listenerUserIDs.filter(Boolean))
  const localVoiceClipIDs = new Set(voiceClips.map((clip) => clip?.id).filter(Boolean))
  const localFriends = Object.values(relationshipsByUserID).filter((relationship) => relationship?.friendshipStatus === 'friends' && (!relationship?.blockStatus || relationship.blockStatus === 'none')).length

  return {
    translatedCountryCount: firstInteger(api.translatedCountryCount, api.countriesTranslated, translatedCountries.size, fallback.countriesHeard) || 0,
    friendsCount: firstInteger(api.friendsCount, localFriends, fallback.friendsCount) || 0,
    voicesHeardCount: firstInteger(api.voicesHeardCount, api.heardVoiceCount, heardVoiceIDs.size, fallback.voicesCount) || 0,
    heardByCount: firstInteger(api.heardByCount, localListenerIDs.size, fallback.heardByCount) || 0,
    voiceClipsCount: firstInteger(api.voiceClipsCount, localVoiceClipIDs.size, fallback.voiceClipsCount) || 0,
    coinBalance: firstInteger(coinBalance, fallback.coinBalance) || 0,
  }
}
