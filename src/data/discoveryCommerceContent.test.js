import { describe, expect, it } from 'vitest'
import { discoveryCardPackContent, discoveryCommerceContent } from './discoveryCommerceContent'

describe('discovery card pack localization', () => {
  it('covers all eight UI languages without placeholder leakage', () => {
    for (const locale of ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']) {
      const copy = discoveryCardPackContent(locale)
      expect(copy.remaining).toContain('{count}')
      expect(copy.exhaustedTitle).toBeTruthy()
      expect(copy.confirmTitle).toBeTruthy()
      expect(copy.insufficientTitle).toBeTruthy()
      expect(copy.getCoins).toBeTruthy()
      expect(copy.notEnoughProfiles).toBeTruthy()
    }
  })
})

describe('coin spend dialog localization', () => {
  it('covers the confirmation and insufficient-balance sheet in all eight languages', () => {
    for (const locale of ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']) {
      const copy = discoveryCommerceContent(locale)
      expect(copy.confirmTitle).toBeTruthy()
      expect(copy.after).toBeTruthy()
      expect(copy.dontAskAgain).toBeTruthy()
      expect(copy.insufficientTitle).toBeTruthy()
      expect(copy.insufficientNeed).toContain('{cost}')
      expect(copy.shortBy).toBeTruthy()
      expect(copy.getCoins).toBeTruthy()
      expect(copy.freeFeaturesNote).toBeTruthy()
    }
  })
})
