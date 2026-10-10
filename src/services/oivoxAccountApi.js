import { nativeBridge } from '../nativeBridge'
import {
  OIVOX_SIGNAL_CONTRACT,
  decodeFaultEnvelope,
  decodePublicUser,
  decodeSessionEnvelope,
  encodeLoginPayload,
  encodeProfilePatch,
  encodeRegistrationPayload,
} from './oivoxSignalContract'

const RUNTIME_NATIVE_API_URL = typeof window === 'undefined' ? '' : window.__OIVOX_ACCOUNT_API_URL__
const CONFIGURED_API_URL = String(import.meta.env.VITE_OIVOX_API_URL || RUNTIME_NATIVE_API_URL || '').replace(/\/$/, '')
// Keep the development server convenient without baking a localhost address into
// the WKWebView production bundle. Native builds use the existing bridge below.
export function resolveAccountBaseUrl(configuredUrl, developmentUrl = '') {
  return String(configuredUrl || '').replace(/\/$/, '') || developmentUrl
}

export function shouldUseNativeAccountService(isNative, configuredUrl) {
  return Boolean(isNative && !configuredUrl)
}

export function shouldUseNativeReviewLogin(isNative, email) {
  return Boolean(isNative && String(email || '').trim().toLowerCase() === 'oivox@gmail.com')
}

const API_BASE_URL = resolveAccountBaseUrl(CONFIGURED_API_URL, import.meta.env.DEV ? 'http://localhost:3102' : '')
const TOKEN_KEY = 'oivox.serverAccessToken'
const TRANSPORT_KEY = 'oivox.accountTransport'
const NATIVE_REVIEW_TRANSPORT = 'native-review'
export const ACCOUNT_REQUEST_TIMEOUT_MS = 15000
let accessToken = ''
let nativeReviewSession = false

export class OiVoxApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'OiVoxApiError'
    this.code = code
    this.status = status
  }
}

export function accountErrorMessageKey(code) {
  return {
    ACCOUNT_NOT_FOUND: 'accountNotFound',
    INVALID_PASSWORD: 'incorrectPassword',
    EMAIL_IN_USE: 'emailInUse',
    INVALID_EMAIL: 'invalidEmail',
    INVALID_PASSWORD_FORMAT: 'passwordTooShort',
    TERMS_REQUIRED: 'termsRequired',
    AGE_RESTRICTED: 'ageRestricted',
    RATE_LIMITED: 'rateLimited',
    UNAUTHORIZED: 'sessionExpired',
    INVALID_JSON: 'invalidInput',
    VALIDATION_ERROR: 'invalidInput',
    ONBOARDING_INCOMPLETE: 'invalidInput',
    AVATAR_REQUIRED: 'invalidInput',
    INVALID_AVATAR: 'invalidInput',
    INVALID_DISPLAY_NAME: 'invalidInput',
    INVALID_HANDLE: 'invalidInput',
    INVALID_ABOUT_ME: 'invalidInput',
    INVALID_LANGUAGES: 'invalidInput',
    INVALID_COUNTRY: 'invalidInput',
    VERIFICATION_REQUIRED: 'invalidInput',
    INVALID_INTERESTS: 'invalidInput',
    ACCOUNT_SERVICE_UNAVAILABLE: 'requestFailed',
    REQUEST_TIMEOUT: 'requestFailed',
  }[code] || 'requestFailed'
}

async function request(path, options = {}, decodeResult = (value) => value) {
  const token = await readToken()
  const useNativeReviewTransport = options.nativeReviewTransport === true
  if (shouldUseNativeAccountService(nativeBridge.isNative, CONFIGURED_API_URL) || nativeReviewSession || useNativeReviewTransport) {
    try {
      const result = await nativeBridge.call('Account', 'request', {
        path,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : {},
        token,
        headers: options.headers || {},
      })
      return decodeResult(result)
    } catch (error) {
      throw new OiVoxApiError(error?.code || 'REQUEST_FAILED', error?.message || 'Request failed.', 0)
    }
  }
  if (!API_BASE_URL) throw new OiVoxApiError('ACCOUNT_SERVICE_UNAVAILABLE', 'The local account service is unavailable.', 0)
  const { timeoutMs = ACCOUNT_REQUEST_TIMEOUT_MS, nativeReviewTransport: _nativeReviewTransport, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    const code = controller.signal.aborted ? 'REQUEST_TIMEOUT' : 'ACCOUNT_SERVICE_UNAVAILABLE'
    console.warn(`[OiVox Account] ${options.method || 'GET'} ${path} failed: ${code}`)
    throw new OiVoxApiError(code, code === 'REQUEST_TIMEOUT' ? 'The account request timed out.' : 'The account service is unavailable.', 0)
  } finally {
    window.clearTimeout(timer)
  }
  if (response.status === 204) return null
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fault = decodeFaultEnvelope(result).error
    throw new OiVoxApiError(fault?.code || 'REQUEST_FAILED', fault?.message || 'Request failed.', response.status)
  }
  return decodeResult(result)
}

async function readToken() {
  if (accessToken) return accessToken
  if (nativeBridge.isNative) {
    const result = await nativeBridge.call('SecureStore', 'get', { key: TOKEN_KEY }).catch(() => null)
    accessToken = result?.value || ''
    const transport = await nativeBridge.call('SecureStore', 'get', { key: TRANSPORT_KEY }).catch(() => null)
    nativeReviewSession = transport?.value === NATIVE_REVIEW_TRANSPORT
  } else {
    accessToken = sessionStorage.getItem(TOKEN_KEY) || ''
  }
  return accessToken
}

async function saveSession(result) {
  accessToken = result.accessToken
  nativeReviewSession = Boolean(nativeBridge.isNative && result.localReviewFixture === true)
  // A successful account request must not be reported as an authentication
  // failure solely because the local secure persistence callback was lost.
  // The in-memory token remains authoritative for this running session.
  if (nativeBridge.isNative) {
    await nativeBridge.call('SecureStore', 'set', { key: TOKEN_KEY, value: accessToken }).catch(() => {})
    await nativeBridge.call('SecureStore', 'set', { key: TRANSPORT_KEY, value: nativeReviewSession ? NATIVE_REVIEW_TRANSPORT : 'http' }).catch(() => {})
  }
  else sessionStorage.setItem(TOKEN_KEY, accessToken)
  return result
}

export const oivoxAccountApi = {
  async login(email, password) {
    return saveSession(await request(OIVOX_SIGNAL_CONTRACT.routes.enter, {
      method: 'POST',
      nativeReviewTransport: shouldUseNativeReviewLogin(nativeBridge.isNative, email),
      body: JSON.stringify(encodeLoginPayload({ email, password })),
    }, decodeSessionEnvelope))
  },
  async register(registration, submissionID) {
    return saveSession(await request(OIVOX_SIGNAL_CONTRACT.routes.seed, {
      method: 'POST',
      headers: submissionID ? { [OIVOX_SIGNAL_CONTRACT.headers.seedRef]: submissionID } : {},
      body: JSON.stringify(encodeRegistrationPayload(registration)),
    }, decodeSessionEnvelope))
  },
  getProfile: () => request(OIVOX_SIGNAL_CONTRACT.routes.self, {}, decodePublicUser),
  updateProfile: (patch) => request(OIVOX_SIGNAL_CONTRACT.routes.self, {
    method: 'PATCH',
    body: JSON.stringify(encodeProfilePatch(patch)),
  }, decodePublicUser),
  async deleteAccount() {
    const result = await request(OIVOX_SIGNAL_CONTRACT.routes.deleteSelf, { method: 'DELETE' })
    accessToken = ''
    nativeReviewSession = false
    if (nativeBridge.isNative) {
      await nativeBridge.call('SecureStore', 'delete', { key: TOKEN_KEY }).catch(() => {})
      await nativeBridge.call('SecureStore', 'delete', { key: TRANSPORT_KEY }).catch(() => {})
    } else sessionStorage.removeItem(TOKEN_KEY)
    return result
  },
  async logout() {
    try { await request(OIVOX_SIGNAL_CONTRACT.routes.leave, { method: 'POST' }) } finally {
      accessToken = ''
      nativeReviewSession = false
      if (nativeBridge.isNative) {
        await nativeBridge.call('SecureStore', 'delete', { key: TOKEN_KEY }).catch(() => {})
        await nativeBridge.call('SecureStore', 'delete', { key: TRANSPORT_KEY }).catch(() => {})
      } else sessionStorage.removeItem(TOKEN_KEY)
    }
  },
  hasSession: async () => Boolean(await readToken()),
}
