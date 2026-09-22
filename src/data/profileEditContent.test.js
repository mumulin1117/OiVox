import { describe, expect, it } from 'vitest'
import { profileEditContent, profileEditContentKeys, profileEditLocales } from './profileEditContent'

describe('profile editor localization', () => {
  it('covers every editor message in all eight interface languages', () => {
    expect(profileEditLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    for (const locale of profileEditLocales) {
      const content = profileEditContent(locale)
      expect(Object.keys(content).sort()).toEqual([...profileEditContentKeys].sort())
      expect(profileEditContentKeys.every((key) => typeof content[key] === 'string' && content[key].length > 0)).toBe(true)
    }
  })
})
