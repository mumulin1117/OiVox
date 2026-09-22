import { describe, expect, it } from 'vitest'
import { socialContent, socialContentKeys, socialLocales } from './socialContent'

describe('social module localization', () => {
  it('provides all social keys in all eight interface languages', () => {
    expect(socialLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    for (const locale of socialLocales) {
      const content = socialContent(locale)
      expect(Object.keys(content).sort()).toEqual([...socialContentKeys].sort())
      expect(socialContentKeys.every((key) => typeof content[key] === 'string' && content[key].length > 0)).toBe(true)
    }
  })
})
