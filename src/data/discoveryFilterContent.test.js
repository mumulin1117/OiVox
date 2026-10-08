import { describe, expect, it } from 'vitest'
import { discoveryFilterContent, discoveryFilterLanguageOptions } from './discoveryFilterContent'

describe('discovery filter localization', () => {
  it('covers every supported locale and all eight native language chips', () => {
    for (const locale of ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']) {
      const copy = discoveryFilterContent(locale)
      expect(copy.title).toBeTruthy()
      expect(copy.purchaseOnlyNote).toBeTruthy()
      expect(copy.purchaseOnlyNote.toLowerCase()).not.toMatch(/random|zufällig|rastgele|aléatoire|ランダム|무작위|عشوائ|אקרא/)
      expect(copy.regions.middleEast).toBeTruthy()
      expect(copy.showVoices).toBeTruthy()
    }
    expect(discoveryFilterLanguageOptions.map((item) => item.id)).toEqual(['en', 'ar', 'tr', 'he', 'fr', 'de', 'ja', 'ko'])
  })
})
