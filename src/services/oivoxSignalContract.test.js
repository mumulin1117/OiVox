import { describe, expect, it } from 'vitest'
import {
  OIVOX_SIGNAL_CONTRACT,
  OIVOX_SIGNAL_FORBIDDEN_PARTS,
  decodeFaultEnvelope,
  decodeProfilePatch,
  decodePublicUser,
  decodeRegistrationPayload,
  decodeSessionEnvelope,
  encodeFaultEnvelope,
  encodeProfilePatch,
  encodePublicUser,
  encodeRegistrationPayload,
  encodeSessionEnvelope,
} from './oivoxSignalContract'

describe('OiVox signal contract', () => {
  it('keeps prohibited fragments out of every public route, custom header, and wire key', () => {
    const values = [
      ...Object.values(OIVOX_SIGNAL_CONTRACT.routes),
      ...Object.values(OIVOX_SIGNAL_CONTRACT.headers),
      ...Object.values(OIVOX_SIGNAL_CONTRACT.keys),
    ]
    for (const value of values) {
      for (const forbidden of OIVOX_SIGNAL_FORBIDDEN_PARTS) {
        expect(value.toLowerCase(), `${value} contains ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('round-trips registration and profile mutation payloads without leaking plain keys', () => {
    const registration = {
      email: 'new@example.test', password: 'example-123', acceptedTerms: true,
      termsVersion: 'v2', ageRange: '25-34',
      profile: {
        displayName: 'Nova', avatarSource: 'preset', avatarKey: 'portrait-04',
        spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'UTC',
      },
      onboarding: { questionnaire: ['world'], interests: ['travel', 'music'] },
      verification: {
        status: 'passed', method: 'local-fixture', attemptID: 'a', challengeID: 'b',
        fixtureID: 'c', completedAt: '2026-09-21T00:00:00.000Z',
      },
    }
    const encoded = encodeRegistrationPayload(registration)
    expect(encoded).not.toHaveProperty('email')
    expect(encoded.speakerShape).not.toHaveProperty('displayName')
    expect(decodeRegistrationPayload(encoded)).toEqual(registration)

    const patch = { displayName: 'Nova Two', aboutMe: 'Seven seconds.', interests: ['travel', 'music'] }
    expect(decodeProfilePatch(encodeProfilePatch(patch))).toEqual(patch)
  })

  it('round-trips success and fault envelopes while keeping domain models readable', () => {
    const user = {
      id: 'speaker-1', email: 'new@example.test', emailVerified: false, profileComplete: true,
      isTestAccount: false, wallet: { coinBalance: 0 }, profile: { displayName: 'Nova', verified: true },
      terms: { version: 'v2', acceptedAt: '2026-09-21T00:00:00.000Z' },
      createdAt: '2026-09-21T00:00:00.000Z', updatedAt: '2026-09-21T00:00:00.000Z',
    }
    expect(decodePublicUser(encodePublicUser(user))).toEqual(user)
    const session = { user, accessToken: 'a'.repeat(43), tokenType: 'Bearer', expiresAt: '2026-09-22T00:00:00.000Z' }
    expect(decodeSessionEnvelope(encodeSessionEnvelope(session))).toEqual(session)
    const fault = { error: { code: 'INVALID_EMAIL', message: 'Invalid.', requestId: 'trace-1' } }
    expect(decodeFaultEnvelope(encodeFaultEnvelope(fault))).toEqual(fault)
  })
})
