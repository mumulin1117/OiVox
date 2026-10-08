import { beforeEach, describe, expect, it } from 'vitest'
import { createTranslationHistoryStore } from './translationHistoryStore'
import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'

beforeEach(() => localStorage.clear())

describe('translation history store', () => {
  it('keeps original and translated text as separate fixture fields', () => {
    const entry = createTranslationHistoryStore({ accountID: OIVOX_TEST_USER_ID }).getSnapshot().entries[0]
    expect(entry.originalText).toBeTruthy()
    expect(entry.translatedText).toBeTruthy()
    expect(entry.originalText).not.toBe(entry.translatedText)
    expect(entry.isFixture).toBe(true)
  })

  it('starts non-test accounts without another user’s translation fixtures', () => {
    expect(createTranslationHistoryStore({ accountID: 'new-account' }).getSnapshot().entries).toEqual([])
  })

  it('clears once and leaves unrelated local data untouched', () => {
    localStorage.setItem('unrelated', 'keep')
    const store = createTranslationHistoryStore({ accountID: 'account-a' })
    store.clear('clear-1')
    store.clear('clear-1')
    expect(store.getSnapshot().entries).toEqual([])
    expect(store.getSnapshot().processedOperationIDs).toEqual(['clear-1'])
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('adds one translation without overwriting the original text', () => {
    const store = createTranslationHistoryStore({ accountID: 'account-a' })
    const entry = { userID: 'user-1', displayName: 'A', originalText: 'Bonjour', translatedText: 'Hello', sourceLanguage: 'fr', targetLanguage: 'en' }
    store.add(entry, 'translation-1')
    store.add(entry, 'translation-1')
    const matches = store.getSnapshot().entries.filter((item) => item.userID === 'user-1')
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({ originalText: 'Bonjour', translatedText: 'Hello' })
  })
})
