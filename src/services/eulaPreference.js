import { LEGAL_DOCUMENT_VERSION } from '../data/legalDocuments'

export const EULA_TERMS_VERSION = LEGAL_DOCUMENT_VERSION
export const EULA_STORAGE_KEY = 'oivox.eulaConsent'

export function readEulaConsent() {
  try {
    const value = JSON.parse(localStorage.getItem(EULA_STORAGE_KEY) || 'null')
    return {
      accepted: value?.accepted === true && value?.version === EULA_TERMS_VERSION,
      version: value?.version || null,
      acceptedAt: value?.acceptedAt || null,
    }
  } catch {
    return { accepted: false, version: null, acceptedAt: null }
  }
}

export function setEulaAccepted(accepted) {
  const value = {
    accepted: accepted === true,
    version: EULA_TERMS_VERSION,
    acceptedAt: accepted ? new Date().toISOString() : null,
  }
  localStorage.setItem(EULA_STORAGE_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('oivox:eula-change', { detail: value }))
  return value
}
