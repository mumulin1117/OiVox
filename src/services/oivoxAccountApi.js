import { nativeBridge } from '../nativeBridge'

const CONFIGURED_API_URL = String(import.meta.env.VITE_OIVOX_API_URL || '').replace(/\/$/, '')
// Keep the development server convenient without baking a localhost address into
// the WKWebView production bundle. Native builds use the existing bridge below.
export function resolveAccountBaseUrl(configuredUrl, developmentUrl = '') {
  return String(configuredUrl || '').replace(/\/$/, '') || developmentUrl
}

export function shouldUseNativeAccountService(isNative, configuredUrl) {
  return Boolean(isNative && !configuredUrl)
}

const API_BASE_URL = resolveAccountBaseUrl(CONFIGURED_API_URL, import.meta.env.DEV ? 'http://localhost:3102' : '')
const TOKEN_KEY = 'oivox.serverAccessToken'
let accessToken = ''

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
  }[code] || 'requestFailed'
}

async function request(path, options = {}) {
  const token = await readToken()
  if (shouldUseNativeAccountService(nativeBridge.isNative, CONFIGURED_API_URL)) {
    try {
      return await nativeBridge.call('Account', 'request', {
        path,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : {},
        token,
        headers: options.headers || {},
      })
    } catch (error) {
      throw new OiVoxApiError(error?.code || 'REQUEST_FAILED', error?.message || 'Request failed.', 0)
    }
  }
  if (!API_BASE_URL) throw new OiVoxApiError('ACCOUNT_SERVICE_UNAVAILABLE', 'The local account service is unavailable.', 0)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 204) return null
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new OiVoxApiError(result.error?.code || 'REQUEST_FAILED', result.error?.message || 'Request failed.', response.status)
  return result
}

async function readToken() {
  if (accessToken) return accessToken
  if (nativeBridge.isNative) {
    const result = await nativeBridge.call('SecureStore', 'get', { key: TOKEN_KEY }).catch(() => null)
    accessToken = result?.value || ''
  } else {
    accessToken = sessionStorage.getItem(TOKEN_KEY) || ''
  }
  return accessToken
}

async function saveSession(result) {
  accessToken = result.accessToken
  // A successful account request must not be reported as an authentication
  // failure solely because the local secure persistence callback was lost.
  // The in-memory token remains authoritative for this running session.
  if (nativeBridge.isNative) {
    await nativeBridge.call('SecureStore', 'set', { key: TOKEN_KEY, value: accessToken }).catch(() => {})
  }
  else sessionStorage.setItem(TOKEN_KEY, accessToken)
  return result
}

export const oivoxAccountApi = {
  async login(email, password) {
    return saveSession(await request('/oivox/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }))
  },
  async register(registration, submissionID) {
    return saveSession(await request('/oivox/v1/auth/register', {
      method: 'POST',
      headers: submissionID ? { 'Idempotency-Key': submissionID } : {},
      body: JSON.stringify(registration),
    }))
  },
  getProfile: () => request('/oivox/v1/me/profile'),
  updateProfile: (patch) => request('/oivox/v1/me/profile', { method: 'PATCH', body: JSON.stringify(patch) }),
  async logout() {
    try { await request('/oivox/v1/auth/logout', { method: 'POST' }) } finally {
      accessToken = ''
      if (nativeBridge.isNative) await nativeBridge.call('SecureStore', 'delete', { key: TOKEN_KEY }).catch(() => {})
      else sessionStorage.removeItem(TOKEN_KEY)
    }
  },
  hasSession: async () => Boolean(await readToken()),
}
