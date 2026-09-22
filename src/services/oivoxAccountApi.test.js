import { describe, expect, it } from 'vitest'
import { accountErrorMessageKey, resolveAccountBaseUrl, shouldUseNativeAccountService } from './oivoxAccountApi'

describe('account error localization', () => {
  it.each([
    ['ACCOUNT_NOT_FOUND', 'accountNotFound'],
    ['INVALID_PASSWORD', 'incorrectPassword'],
    ['EMAIL_IN_USE', 'emailInUse'],
    ['TERMS_REQUIRED', 'termsRequired'],
    ['AGE_RESTRICTED', 'ageRestricted'],
    ['RATE_LIMITED', 'rateLimited'],
    ['ONBOARDING_INCOMPLETE', 'invalidInput'],
    ['VERIFICATION_REQUIRED', 'invalidInput'],
  ])('maps %s to %s', (code, key) => {
    expect(accountErrorMessageKey(code)).toBe(key)
  })
})

describe('account transport selection', () => {
  it('does not include a development server URL in production', () => {
    expect(resolveAccountBaseUrl('', '')).toBe('')
  })

  it('uses the unified native account service only when no API URL is configured', () => {
    expect(shouldUseNativeAccountService(true, '')).toBe(true)
    expect(shouldUseNativeAccountService(true, 'https://accounts.example.test')).toBe(false)
    expect(shouldUseNativeAccountService(false, '')).toBe(false)
  })
})
