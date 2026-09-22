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
})
