import { discoveryPeople } from '../data/discoveryFixtures'

export const DISCOVERY_REGION_COUNTRIES = Object.freeze({
  middleEast: Object.freeze(['EG', 'IL', 'TR']),
  europe: Object.freeze(['GB', 'FR', 'DE']),
  eastAsia: Object.freeze(['JP', 'KR']),
})

export const EMPTY_DISCOVERY_FILTERS = Object.freeze({
  regions: Object.freeze([]),
  languages: Object.freeze([]),
  onlineNow: false,
  notHeardYet: false,
})

const regionKeys = new Set(Object.keys(DISCOVERY_REGION_COUNTRIES))
const languageKeys = new Set(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])

export function normalizeDiscoveryFilters(filters = {}) {
  return {
    regions: [...new Set(Array.isArray(filters.regions) ? filters.regions.filter((item) => regionKeys.has(item)) : [])],
    languages: [...new Set(Array.isArray(filters.languages) ? filters.languages.filter((item) => languageKeys.has(item)) : [])],
    onlineNow: filters.onlineNow === true,
    notHeardYet: filters.notHeardYet === true,
  }
}

export function hasDiscoveryFilters(filters = {}) {
  const normalized = normalizeDiscoveryFilters(filters)
  return normalized.regions.length > 0
    || normalized.languages.length > 0
    || normalized.onlineNow
    || normalized.notHeardYet
}

export function discoveryPersonMatchesFilters(person, filters = {}, heardVoiceIDs = []) {
  if (!person) return false
  const normalized = normalizeDiscoveryFilters(filters)
  const heard = heardVoiceIDs instanceof Set ? heardVoiceIDs : new Set(heardVoiceIDs)
  const matchesRegion = normalized.regions.length === 0 || normalized.regions.some((region) => DISCOVERY_REGION_COUNTRIES[region]?.includes(person.countryCode))
  const matchesLanguage = normalized.languages.length === 0 || normalized.languages.some((language) => person.spokenLanguages?.includes(language))
  const matchesOnline = !normalized.onlineNow || person.onlineNow === true
  const matchesUnheard = !normalized.notHeardYet || !heard.has(person.voiceClip?.id)
  return matchesRegion && matchesLanguage && matchesOnline && matchesUnheard
}

export function prioritizeDiscoveryUserIDs(userIDs, filters = {}, heardVoiceIDs = []) {
  const normalized = normalizeDiscoveryFilters(filters)
  if (!hasDiscoveryFilters(normalized)) return [...userIDs]
  const preferred = []
  const fallback = []
  for (const userID of userIDs) {
    const target = discoveryPersonMatchesFilters(discoveryPeople[userID], normalized, heardVoiceIDs) ? preferred : fallback
    target.push(userID)
  }
  return [...preferred, ...fallback]
}
