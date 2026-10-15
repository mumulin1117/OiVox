import { describe, expect, it } from 'vitest'
import { LEGAL_DOCUMENT_VERSION, LEGAL_EFFECTIVE_DATE, legalDocumentLocales, legalDocuments } from './legalDocuments'

describe('OiVox legal document contract', () => {
  it('provides complete, separate documents in every supported language', () => {
    expect(legalDocumentLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    for (const locale of legalDocumentLocales) {
      const copy = legalDocuments(locale)
      expect(copy.labels.effective, `${locale}.effective`).toBeTruthy()
      expect(copy.labels.version, `${locale}.version`).toContain('v3')
      expect(copy.labels.supportEmail, `${locale}.supportEmail`).toBe('OiVox@gmail.com')
      expect(copy.labels.contact, `${locale}.contact`).toContain('OiVox@gmail.com')
      for (const kind of ['eula', 'terms', 'privacy']) {
        const value = copy[kind]
        expect(value.title, `${locale}.${kind}.title`).toBeTruthy()
        expect(value.intro.length, `${locale}.${kind}.intro`).toBeGreaterThan(20)
        expect(value.sections.length, `${locale}.${kind}.sections`).toBeGreaterThanOrEqual(kind === 'privacy' ? 10 : 8)
        expect(value.sections.every((item) => item.title && item.body.length > 45), `${locale}.${kind}.content`).toBe(true)
      }
      expect(copy.eula.title).not.toBe(copy.terms.title)
      expect(copy.terms.title).not.toBe(copy.privacy.title)
      const localizedEula = copy.eula.sections.map((item) => item.body).join(' ')
      expect(localizedEula, `${locale}.eula.age`).toMatch(/18/)
      expect(localizedEula, `${locale}.eula.responseTime`).toMatch(/24/)
    }
  })

  it('uses a stable effective date and consent version', () => {
    expect(LEGAL_EFFECTIVE_DATE).toBe('2026-10-15')
    expect(LEGAL_DOCUMENT_VERSION).toBe('2026-10-oivox-legal-v3')
  })

  it('documents the privacy and safety controls required by the current product', () => {
    const english = legalDocuments('en')
    const policy = english.privacy.sections.map((item) => `${item.title} ${item.body}`).join(' ')
    const terms = english.terms.sections.map((item) => `${item.title} ${item.body}`).join(' ')
    expect(policy).toMatch(/camera/i)
    expect(policy).toMatch(/microphone/i)
    expect(policy).toMatch(/Keychain/i)
    expect(policy).toMatch(/delete/i)
    expect(policy).toMatch(/does not sell/i)
    expect(terms).toMatch(/block/i)
    expect(terms).toMatch(/report/i)
    expect(terms).toMatch(/StoreKit/i)
    expect(terms).toMatch(/18/)
    const eula = english.eula.sections.map((item) => `${item.title} ${item.body}`).join(' ')
    expect(eula).toMatch(/zero tolerance/i)
    expect(eula).toMatch(/within 24 hours/i)
    expect(eula).toMatch(/will be removed/i)
    expect(eula).toMatch(/permanently terminated/i)
    expect(eula).not.toMatch(/stored locally|simulated report/i)
  })
})
