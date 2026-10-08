import { describe, expect, it } from 'vitest'
import { launchTransitionContent, launchTransitionMessages } from './launchTransitionContent'

describe('launch transition localization', () => {
  it('covers every supported OiVox language', () => {
    expect(Object.keys(launchTransitionMessages)).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    Object.values(launchTransitionMessages).forEach((message) => {
      expect(message.label).toBeTruthy()
      expect(message.skip).toBeTruthy()
      expect(message.tagline).toBeTruthy()
    })
  })

  it('falls back to English for an unsupported locale', () => {
    expect(launchTransitionContent('zh')).toBe(launchTransitionMessages.en)
  })
})
