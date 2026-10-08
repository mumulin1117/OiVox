import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACCOUNT_REQUEST_TIMEOUT_MS, accountErrorMessageKey, oivoxAccountApi, resolveAccountBaseUrl, shouldUseNativeAccountService, shouldUseNativeReviewLogin } from './oivoxAccountApi'
import { OIVOX_SIGNAL_CONTRACT, encodeSessionEnvelope } from './oivoxSignalContract'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('account error localization', () => {
  it.each([
    ['ACCOUNT_NOT_FOUND', 'accountNotFound'],
    ['INVALID_PASSWORD', 'incorrectPassword'],
    ['EMAIL_IN_USE', 'emailInUse'],
    ['TERMS_REQUIRED', 'termsRequired'],
    ['AGE_RESTRICTED', 'ageRestricted'],
    ['RATE_LIMITED', 'rateLimited'],
    ['ONBOARDING_INCOMPLETE', 'invalidInput'],
    ['VERIFICATION_REQUIRED', 'invalidInput'],
    ['ACCOUNT_SERVICE_UNAVAILABLE', 'requestFailed'],
    ['REQUEST_TIMEOUT', 'requestFailed'],
  ])('maps %s to %s', (code, key) => {
    expect(accountErrorMessageKey(code)).toBe(key)
  })

  it('injects a Debug-only native account URL while Release stays empty', () => {
    const controller = readFileSync(resolve(process.cwd(), 'ios/OiVox/WebViewController.swift'), 'utf8')
    const project = readFileSync(resolve(process.cwd(), 'ios/OiVox.xcodeproj/project.pbxproj'), 'utf8')
    expect(controller).toContain('window.__OIVOX_ACCOUNT_API_URL__')
    expect(controller).toContain('#if DEBUG')
    expect(project).toContain('OIVOX_ACCOUNT_API_URL = "http://linqiannew.local:3102";')
    expect(project).toContain('OIVOX_ACCOUNT_API_URL = "";')
  })

  it('keeps the native offline account adapter on the v2 signal contract', () => {
    const bridge = readFileSync(resolve(process.cwd(), 'ios/OiVox/NativeBridge.swift'), 'utf8')
    expect(bridge).toContain(OIVOX_SIGNAL_CONTRACT.routes.enter)
    expect(bridge).toContain(OIVOX_SIGNAL_CONTRACT.routes.seed)
    expect(bridge).toContain(OIVOX_SIGNAL_CONTRACT.routes.self)
    expect(bridge).toContain(OIVOX_SIGNAL_CONTRACT.routes.leave)
    expect(bridge).toContain('"speakerRecord": publicUser()')
    expect(bridge).toContain('"echoMeter": ["echoUnits": 120]')
    expect(bridge).not.toContain('/oivox/v1/')
  })

  it('fails a stalled account request after a bounded timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    })))
    const request = oivoxAccountApi.login('Oivox@gmail.com', '34563456')
    const assertion = expect(request).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' })
    await vi.advanceTimersByTimeAsync(ACCOUNT_REQUEST_TIMEOUT_MS + 1)
    await assertion
  })
})

describe('account transport selection', () => {
  it('does not include a development server URL in production', () => {
    expect(resolveAccountBaseUrl('', '')).toBe('')
  })

  it('uses the unified native account service only when no API URL is configured', () => {
    expect(shouldUseNativeAccountService(true, '')).toBe(true)
    expect(shouldUseNativeAccountService(true, 'https://accounts.example.test')).toBe(false)
    expect(shouldUseNativeAccountService(false, '')).toBe(false)
  })

  it('keeps the fixed review login available through the native adapter when Debug HTTP is unavailable', () => {
    expect(shouldUseNativeReviewLogin(true, 'Oivox@gmail.com')).toBe(true)
    expect(shouldUseNativeReviewLogin(true, 'other@example.test')).toBe(false)
    expect(shouldUseNativeReviewLogin(false, 'Oivox@gmail.com')).toBe(false)
  })

  it('sends and decodes only the v2 signal contract at the transport boundary', async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      ok: true,
      json: async () => encodeSessionEnvelope({
        accessToken: 'a'.repeat(43),
        tokenType: 'Bearer',
        expiresAt: '2026-09-22T00:00:00.000Z',
        user: {
          id: 'speaker-1', email: 'oivox@gmail.com', emailVerified: false, profileComplete: true,
          isTestAccount: true, wallet: { coinBalance: 120 }, profile: { displayName: 'Mia' },
          terms: { version: 'v2', acceptedAt: '2026-09-21T00:00:00.000Z' },
          createdAt: '2026-09-21T00:00:00.000Z', updatedAt: '2026-09-21T00:00:00.000Z',
        },
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await oivoxAccountApi.login('Oivox@gmail.com', '34563456')
    const [url, options] = fetchMock.mock.calls[0]
    const payload = JSON.parse(options.body)
    expect(url).toContain(OIVOX_SIGNAL_CONTRACT.routes.enter)
    expect(payload).toEqual({ echoAddress: 'Oivox@gmail.com', signalPhrase: '34563456' })
    expect(payload).not.toHaveProperty('email')
    expect(payload).not.toHaveProperty('password')
    expect(result.user).toMatchObject({ id: 'speaker-1', wallet: { coinBalance: 120 }, profile: { displayName: 'Mia' } })
  })
})
