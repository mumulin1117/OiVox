import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('language preference', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('persists an explicit user selection', async () => {
    const { LANGUAGE_KEY, useI18n } = await import('./i18n')
    await useI18n().setLocale('ja')
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('ja')
    expect(document.documentElement.lang).toBe('ja')
  })

  it('enables RTL for Arabic and Hebrew', async () => {
    const { useI18n } = await import('./i18n')
    await useI18n().setLocale('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('uses a concise Agree action on the EULA in every supported language', async () => {
    const { useI18n } = await import('./i18n')
    const expected = {
      en: 'Agree', ar: 'موافق', he: 'אישור', tr: 'Kabul et',
      fr: 'Accepter', de: 'Zustimmen', ja: '同意する', ko: '동의',
    }
    const i18n = useI18n()
    for (const [locale, label] of Object.entries(expected)) {
      await i18n.setLocale(locale)
      expect(i18n.t('agreeContinue')).toBe(label)
    }
  })
})
