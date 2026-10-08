import { describe, expect, it } from 'vitest'
import { discoveryCommerceContent } from './discoveryCommerceContent'
import { discoveryExperienceContent } from './discoveryExperienceContent'
import { legalDocuments } from './legalDocuments'
import { postRegistrationContent } from './postRegistrationContent'
import { privacyAccountContent } from './privacyAccountContent'
import { registrationContent } from './registrationContent'
import { reportBlockContent } from './reportBlockContent'
import { socialContent } from './socialContent'

const locales = ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']
const contentFactories = [
  discoveryCommerceContent,
  discoveryExperienceContent,
  legalDocuments,
  postRegistrationContent,
  privacyAccountContent,
  registrationContent,
  reportBlockContent,
  socialContent,
]

const environmentDisclosure = /(local review|local data|local demo|local test|review build|review data|test data|demo data|fixture|simulat|مراجعة محلية|اختبار محلي|بيانات مراجعة|בדיקה מקומית|נתוני בדיקה|גרסת הבדיקה|yerel inceleme|yerel test|démo locale|version locale|version de test|examen local|lokale prüf|lokalen test|ローカル審査|ローカルデモ|テストデータ|로컬 검토|로컬 데모|검토 빌드|모의 데이터)/i

function stringValues(value) {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(stringValues)
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringValues)
  return []
}

describe('release-facing copy', () => {
  it.each(locales)('does not expose development data wording in %s', (locale) => {
    contentFactories.forEach((createContent) => {
      stringValues(createContent(locale)).forEach((value) => expect(value).not.toMatch(environmentDisclosure))
    })
  })
})
