import { describe, expect, it } from 'vitest'
import { discoveryMediaPairs } from './discoveryMediaManifest'
import {
  DISCOVERY_TRANSLATION_LANGUAGES,
  discoveryVoiceTranslationsByOriginalText,
  discoveryVoiceTranslationsByPairingID,
  getDiscoveryVoiceTranslation,
} from './discoveryVoiceTranslations'

describe('bundled discovery voice translations', () => {
  it('maps every one of the twenty transcripts to all eight app languages', () => {
    expect(Object.keys(discoveryVoiceTranslationsByPairingID)).toHaveLength(20)
    expect(Object.keys(discoveryVoiceTranslationsByOriginalText)).toHaveLength(20)

    for (const media of discoveryMediaPairs) {
      const entry = discoveryVoiceTranslationsByPairingID[media.pairingID]
      expect(entry.originalText).toBe(media.transcript)
      expect(entry.sourceLanguage).toBe(media.languageCode)
      expect(Object.keys(entry.translations)).toEqual(DISCOVERY_TRANSLATION_LANGUAGES)
      for (const language of DISCOVERY_TRANSLATION_LANGUAGES) {
        expect(entry.translations[language]?.trim()).toBeTruthy()
        expect(getDiscoveryVoiceTranslation({
          voiceID: entry.voiceID,
          originalText: media.transcript,
          targetLanguage: language,
        })?.translatedText).toBe(entry.translations[language])
      }
      expect(entry.translations[media.languageCode]).toBe(media.transcript)
    }
  })

  it('resolves by exact original content and target language', () => {
    const media = discoveryMediaPairs[0]
    const result = getDiscoveryVoiceTranslation({ originalText: media.transcript, targetLanguage: 'ja-JP' })
    expect(result.targetLanguage).toBe('ja')
    expect(result.pairingID).toBe(media.pairingID)
    expect(result.translatedText).toBe(discoveryVoiceTranslationsByPairingID[media.pairingID].translations.ja)
  })

  it('does not return a translation when an id is paired with different original content', () => {
    const media = discoveryMediaPairs[0]
    expect(getDiscoveryVoiceTranslation({
      pairingID: media.pairingID,
      originalText: 'Different transcript',
      targetLanguage: 'en',
    })).toBeNull()
  })
})
