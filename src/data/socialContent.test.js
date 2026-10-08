import { describe, expect, it } from 'vitest'
import { socialContent, socialContentKeys, socialLocales } from './socialContent'

describe('social module localization', () => {
  it('provides all social keys in all eight interface languages', () => {
    expect(socialLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    for (const locale of socialLocales) {
      const content = socialContent(locale)
      expect(Object.keys(content).sort()).toEqual([...socialContentKeys].sort())
      expect(socialContentKeys.every((key) => {
        const value = content[key]
        if (Array.isArray(value)) return value.length > 0 && value.every((item) => typeof item === 'string' && item.trim())
        return typeof value === 'string' && value.trim()
      })).toBe(true)
    }
  })
})
