import { beforeEach, describe, expect, it } from 'vitest'
import { EULA_STORAGE_KEY, EULA_TERMS_VERSION, readEulaConsent, setEulaAccepted } from './eulaPreference'

describe('EULA preference', () => {
  beforeEach(() => localStorage.clear())

  it('starts unaccepted and stores the current version when accepted', () => {
    expect(readEulaConsent().accepted).toBe(false)
    setEulaAccepted(true)
    expect(readEulaConsent()).toMatchObject({ accepted: true, version: EULA_TERMS_VERSION })
  })

  it('does not accept consent saved for an old version', () => {
    localStorage.setItem(EULA_STORAGE_KEY, JSON.stringify({ accepted: true, version: 'old-version' }))
    expect(readEulaConsent().accepted).toBe(false)
  })

  it('persists a manual opt-out', () => {
    setEulaAccepted(true)
    setEulaAccepted(false)
    expect(readEulaConsent().accepted).toBe(false)
  })
})
