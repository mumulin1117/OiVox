import { describe, expect, it } from 'vitest'
import { registrationContent, registrationInterests } from './registrationContent'

const locales = ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']
const requiredPhotoCopy = {
  en: 'A photo and nickname are required.',
  ar: 'الصورة والاسم المستعار مطلوبان.',
  he: 'נדרשים תמונה וכינוי.',
  tr: 'Fotoğraf ve takma ad zorunludur.',
  fr: 'Une photo et un pseudo sont requis.',
  de: 'Foto und Spitzname sind erforderlich.',
  ja: '写真とニックネームは必須です。',
  ko: '사진과 닉네임은 필수입니다.',
}

describe('seven-step registration copy', () => {
  it.each(locales)('provides complete onboarding content for %s', (locale) => {
    const copy = registrationContent(locale)
    expect(copy.step(7)).toContain('7')
    expect(copy.questions).toHaveLength(6)
    expect(copy.questions.every((question) => question.title && question.options.length === 4 && question.options.every(([, label]) => label))).toBe(true)
    expect(copy.tipItems).toHaveLength(3)
    expect(copy.profileSubtitle).toBe(requiredPhotoCopy[locale])
    expect(copy.avatarRequired).toBeTruthy()
    expect(copy.avatarCancelled).toBeTruthy()
    expect(copy.avatarPermissionDenied).toBeTruthy()
    expect(copy.avatarDecodeFailed).toBeTruthy()
    expect(copy.avatarProcessingFailed).toBeTruthy()
    expect(copy.chooseFromPhotos).toBeTruthy()
    expect(copy.takePhoto).toBeTruthy()
    expect(copy.returnToProfile).toBeTruthy()
    expect(registrationInterests(locale)).toHaveLength(12)
  })

  it('localizes question choices and interests instead of falling back to English', () => {
    expect(registrationContent('ja').questions[0].options[0][1]).not.toBe(registrationContent('en').questions[0].options[0][1])
    expect(registrationInterests('ar')[0][1]).not.toBe(registrationInterests('en')[0][1])
  })
})
