import { hashPassword } from './security.js'

export const OIVOX_TEST_ACCOUNT_ID = '42618403-0000-4000-8000-000000000001'
export const OIVOX_TEST_EMAIL = 'oivox@gmail.com'
export const OIVOX_TEST_PASSWORD = '34563456'

export async function seedTestAccount(store, now = new Date()) {
  const existing = store.data.users.find((user) => user.id === OIVOX_TEST_ACCOUNT_ID)
  if (existing) return existing

  const timestamp = now.toISOString()
  const user = {
    id: OIVOX_TEST_ACCOUNT_ID,
    email: OIVOX_TEST_EMAIL,
    passwordHash: await hashPassword(OIVOX_TEST_PASSWORD),
    status: 'active',
    isTestAccount: true,
    emailVerified: false,
    wallet: { coinBalance: 120 },
    terms: { version: '2026-09-oivox-local-v1', acceptedAt: timestamp },
    profile: {
      displayName: 'Mia',
      handle: '@mia_voice',
      avatarSource: 'preset',
      avatarKey: 'portrait-09',
      countryCode: 'GB',
      timezone: 'UTC+0',
      aboutMe: 'Seven seconds at a time.',
      spokenLanguages: ['en', 'fr'],
      preferredLanguage: 'en',
      ageRange: '25-34',
      interests: ['food', 'travel'],
      verified: true,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await store.update((data) => data.users.push(user))
  return user
}
