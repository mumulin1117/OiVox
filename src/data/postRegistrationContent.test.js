import { describe, expect, it } from 'vitest'
import { postRegistrationContent, postRegistrationLocales } from './postRegistrationContent'

describe('post-registration localization', () => {
  it('covers all eight supported languages with the same keys and three notification benefits', () => {
    expect(postRegistrationLocales.sort()).toEqual(['ar', 'de', 'en', 'fr', 'he', 'ja', 'ko', 'tr'])
    const keys = Object.keys(postRegistrationContent('en')).sort()
    for (const locale of postRegistrationLocales) {
      const copy = postRegistrationContent(locale)
      expect(Object.keys(copy).sort()).toEqual(keys)
      expect(copy.notificationBenefits).toHaveLength(3)
      expect(Object.values(copy).every((value) => Array.isArray(value) || typeof value === 'string')).toBe(true)
    }
  })
})
