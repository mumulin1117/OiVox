import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { createAccessToken, hashPassword, hashToken, verifyPassword } from './security.js'

const TERMS_VERSION = '2026-09-oivox-local-v1'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUPPORTED_LANGUAGES = new Set(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
const AGE_RANGES = new Set(['17-24', '25-34', '35+'])
const PRESET_AVATAR_KEYS = new Set(['portrait-02', 'portrait-03', 'portrait-04', 'portrait-07', 'portrait-09'])
const AVATAR_ASSET_ID_PATTERN = /^avatar_[A-Za-z0-9_-]{8,100}$/
const INTERESTS = new Set(['food', 'travel', 'movies', 'music', 'photography', 'sports', 'books', 'games', 'pets', 'festivals', 'city-life', 'languages'])
const QUESTIONNAIRE_OPTIONS = [
  new Set(['middle-east', 'europe', 'east-asia', 'world', 'skipped']),
  new Set(['english', 'arabic', 'another', 'three-plus', 'skipped']),
  new Set(['food-life', 'travel-cities', 'movies-music', 'everything', 'skipped']),
  new Set(['voice', 'heart', 'text', 'anything', 'skipped']),
  new Set(['morning', 'lunch', 'evening', 'late-night', 'skipped']),
  new Set(['translate', 'openers', 'both', 'none', 'skipped']),
]

class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

function publicUser(user) {
  const coinBalance = Number.isSafeInteger(user.wallet?.coinBalance) && user.wallet.coinBalance >= 0
    ? user.wallet.coinBalance
    : (user.isTestAccount ? 120 : 0)
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    profileComplete: Boolean(user.profile?.displayName && user.profile?.ageRange && hasValidAvatarReference(user.profile)),
    isTestAccount: user.isTestAccount,
    wallet: { coinBalance },
    profile: user.profile,
    terms: user.terms,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function normalizeEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new ApiError(400, 'INVALID_EMAIL', 'Enter a valid email address.')
  return email
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new ApiError(400, 'INVALID_PASSWORD_FORMAT', 'Password must contain 8 to 128 characters.')
  }
  return value
}

async function readJSON(request) {
  const contentType = request.headers['content-type'] || ''
  if (!contentType.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use application/json.')
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body) > 16 * 1024) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body must be no larger than 16 KiB.')
  }
  try { return body ? JSON.parse(body) : {} } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Check the JSON format.') }
}

function assertOnly(body, fields) {
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new ApiError(400, 'VALIDATION_ERROR', 'A JSON object is required.')
  const unknown = Object.keys(body).find((key) => !fields.includes(key))
  if (unknown) throw new ApiError(400, 'VALIDATION_ERROR', `Unknown field: ${unknown}.`)
}

function bearerToken(request) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.authorization || '')
  if (!match) throw new ApiError(401, 'UNAUTHORIZED', 'Sign in again.')
  return match[1]
}

function createSession(data, userID, sessionHours, now) {
  const token = createAccessToken()
  const expiresAt = new Date(now.getTime() + sessionHours * 60 * 60 * 1000).toISOString()
  data.sessions.push({ id: randomUUID(), userID, tokenHash: hashToken(token), expiresAt, createdAt: now.toISOString() })
  return { accessToken: token, tokenType: 'Bearer', expiresAt }
}

function findSession(data, request, now) {
  const tokenHash = hashToken(bearerToken(request))
  const session = data.sessions.find((item) => item.tokenHash === tokenHash && item.expiresAt > now.toISOString())
  const user = session && data.users.find((item) => item.id === session.userID && item.status === 'active')
  if (!session || !user) throw new ApiError(401, 'UNAUTHORIZED', 'Sign in again.')
  return { session, user }
}

function hasValidAvatarReference(profile) {
  // Existing local accounts created before avatarSource was introduced remain readable.
  // New registrations still pass through validateAvatarReference and must send it.
  if (!profile?.avatarSource) return PRESET_AVATAR_KEYS.has(profile?.avatarKey) && !profile?.localAssetID
  if (profile?.avatarSource === 'preset') return PRESET_AVATAR_KEYS.has(profile.avatarKey) && !profile.localAssetID
  if (['photoLibrary', 'camera'].includes(profile?.avatarSource)) return AVATAR_ASSET_ID_PATTERN.test(profile.localAssetID || '') && !profile.avatarKey
  return false
}

function validateAvatarReference(body, { required = false } = {}) {
  const includesAvatarField = ['avatarSource', 'avatarKey', 'localAssetID'].some((field) => field in body)
  const avatarKey = typeof body.avatarKey === 'string' ? body.avatarKey : ''
  const localAssetID = typeof body.localAssetID === 'string' ? body.localAssetID : ''
  if (!avatarKey && !localAssetID) {
    if (required || includesAvatarField) throw new ApiError(400, 'AVATAR_REQUIRED', 'Choose and confirm a profile avatar.')
    return {}
  }
  if (avatarKey && localAssetID) throw new ApiError(400, 'INVALID_AVATAR', 'Provide exactly one avatar reference.')
  if (body.avatarSource === 'preset' && PRESET_AVATAR_KEYS.has(avatarKey) && !localAssetID) return { avatarSource: 'preset', avatarKey }
  if (['photoLibrary', 'camera'].includes(body.avatarSource) && AVATAR_ASSET_ID_PATTERN.test(localAssetID) && !avatarKey) return { avatarSource: body.avatarSource, localAssetID }
  throw new ApiError(400, 'INVALID_AVATAR', 'Choose a valid confirmed avatar and source.')
}

function validateProfilePatch(body) {
  const allowed = ['displayName', 'handle', 'avatarSource', 'avatarKey', 'localAssetID', 'countryCode', 'timezone', 'aboutMe', 'spokenLanguages', 'preferredLanguage', 'ageRange', 'interests']
  assertOnly(body, allowed)
  if (!Object.keys(body).length) throw new ApiError(400, 'VALIDATION_ERROR', 'Provide at least one profile field.')
  const patch = {}
  if ('displayName' in body) {
    if (typeof body.displayName !== 'string' || !body.displayName.trim() || body.displayName.trim().length > 32) throw new ApiError(400, 'INVALID_DISPLAY_NAME', 'Display name must contain 1 to 32 characters.')
    patch.displayName = body.displayName.trim()
  }
  if ('handle' in body) {
    if (typeof body.handle !== 'string' || !/^@[a-z0-9_]{3,24}$/i.test(body.handle)) throw new ApiError(400, 'INVALID_HANDLE', 'Handle must start with @ and contain 3 to 24 letters, numbers, or underscores.')
    patch.handle = body.handle.toLowerCase()
  }
  Object.assign(patch, validateAvatarReference(body))
  if ('countryCode' in body) {
    if (typeof body.countryCode !== 'string' || !/^[A-Z]{2}$/.test(body.countryCode)) throw new ApiError(400, 'INVALID_COUNTRY', 'Use a two-letter country code.')
    patch.countryCode = body.countryCode
  }
  if ('timezone' in body) {
    if (typeof body.timezone !== 'string' || body.timezone.length > 40) throw new ApiError(400, 'INVALID_TIMEZONE', 'Choose a valid timezone.')
    patch.timezone = body.timezone
  }
  if ('aboutMe' in body) {
    if (typeof body.aboutMe !== 'string' || body.aboutMe.length > 280) throw new ApiError(400, 'INVALID_ABOUT_ME', 'About me must be 280 characters or fewer.')
    patch.aboutMe = body.aboutMe.trim()
  }
  if ('spokenLanguages' in body) {
    if (!Array.isArray(body.spokenLanguages) || !body.spokenLanguages.length || body.spokenLanguages.length > 8 || body.spokenLanguages.some((code) => !SUPPORTED_LANGUAGES.has(code)) || new Set(body.spokenLanguages).size !== body.spokenLanguages.length) throw new ApiError(400, 'INVALID_LANGUAGES', 'Choose one or more supported languages without duplicates.')
    patch.spokenLanguages = body.spokenLanguages
  }
  if ('preferredLanguage' in body) {
    if (!SUPPORTED_LANGUAGES.has(body.preferredLanguage)) throw new ApiError(400, 'INVALID_LANGUAGE', 'Choose a supported app language.')
    patch.preferredLanguage = body.preferredLanguage
  }
  if ('ageRange' in body) {
    if (!AGE_RANGES.has(body.ageRange)) throw new ApiError(400, 'AGE_RESTRICTED', 'OiVox accounts require an age range of 17 or older.')
    patch.ageRange = body.ageRange
  }
  if ('interests' in body) {
    if (!Array.isArray(body.interests) || body.interests.length < 2 || body.interests.length > 5 || body.interests.some((interest) => !INTERESTS.has(interest)) || new Set(body.interests).size !== body.interests.length) throw new ApiError(400, 'INVALID_INTERESTS', 'Choose 2 to 5 supported interests without duplicates.')
    patch.interests = body.interests
  }
  return patch
}

function validateRegistrationData(body) {
  assertOnly(body, ['email', 'password', 'acceptedTerms', 'termsVersion', 'ageRange', 'profile', 'onboarding', 'verification'])
  const email = normalizeEmail(body.email)
  const password = validatePassword(body.password)
  if (body.acceptedTerms !== true || body.termsVersion !== TERMS_VERSION) throw new ApiError(400, 'TERMS_REQUIRED', 'Accept the current Terms and Privacy Policy.')
  if (!AGE_RANGES.has(body.ageRange)) throw new ApiError(400, 'AGE_RESTRICTED', 'OiVox accounts require an age range of 17 or older.')

  if (!body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)) throw new ApiError(400, 'INVALID_DISPLAY_NAME', 'Display name must contain 1 to 32 characters.')
  if (typeof body.profile.displayName !== 'string' || !body.profile.displayName.trim() || body.profile.displayName.trim().length > 32) throw new ApiError(400, 'INVALID_DISPLAY_NAME', 'Display name must contain 1 to 32 characters.')
  assertOnly(body.profile, ['displayName', 'avatarSource', 'avatarKey', 'localAssetID', 'spokenLanguages', 'preferredLanguage', 'timezone'])
  validateAvatarReference(body.profile, { required: true })
  const profile = validateProfilePatch({ ...body.profile, ageRange: body.ageRange })
  if (!('displayName' in profile) || !hasValidAvatarReference(profile) || !('spokenLanguages' in profile) || !('preferredLanguage' in profile)) throw new ApiError(400, 'ONBOARDING_INCOMPLETE', 'Complete your nickname, avatar, and language profile.')

  assertOnly(body.onboarding, ['questionnaire', 'interests'])
  if (!Array.isArray(body.onboarding.questionnaire) || body.onboarding.questionnaire.length !== QUESTIONNAIRE_OPTIONS.length || body.onboarding.questionnaire.some((answer, index) => !QUESTIONNAIRE_OPTIONS[index].has(answer))) throw new ApiError(400, 'ONBOARDING_INCOMPLETE', 'Answer every onboarding question.')
  const interestPatch = validateProfilePatch({ interests: body.onboarding.interests })

  assertOnly(body.verification, ['status', 'method', 'attemptID', 'challengeID', 'fixtureID', 'completedAt'])
  if (body.verification.status !== 'passed' || !['local-fixture', 'local-simulator'].includes(body.verification.method)) throw new ApiError(400, 'VERIFICATION_REQUIRED', 'Complete the verification step before registering.')
  for (const key of ['attemptID', 'challengeID', 'fixtureID']) {
    if (typeof body.verification[key] !== 'string' || !body.verification[key] || body.verification[key].length > 100) throw new ApiError(400, 'VERIFICATION_REQUIRED', 'Provide a valid local verification summary.')
  }

  return { email, password, profile: { ...profile, ...interestPatch }, questionnaire: body.onboarding.questionnaire }
}

export function createOiVoxApp({ store, sessionHours = 24, now = () => new Date(), allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'null'] }) {
  const loginAttempts = new Map()
  const server = createServer(async (request, response) => {
    const requestID = randomUUID()
    const origin = request.headers.origin
    const send = (status, payload) => {
      response.statusCode = status
      response.setHeader('cache-control', 'no-store')
      response.setHeader('x-content-type-options', 'nosniff')
      if (origin && allowedOrigins.includes(origin)) response.setHeader('access-control-allow-origin', origin)
      if (status !== 204) response.setHeader('content-type', 'application/json; charset=utf-8')
      response.end(status === 204 ? '' : JSON.stringify(payload))
    }

    try {
      if (origin && !allowedOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.')
      if (request.method === 'OPTIONS') {
        response.setHeader('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS')
        response.setHeader('access-control-allow-headers', 'authorization,content-type,idempotency-key')
        return send(204)
      }
      const path = new URL(request.url, 'http://localhost').pathname
      if (request.method === 'GET' && path === '/health') return send(200, { ok: true, service: 'oivox-account-server' })

      if (request.method === 'POST' && path === '/oivox/v1/auth/register') {
        const body = await readJSON(request)
        const { email, password, profile, questionnaire } = validateRegistrationData(body)
        const idempotencyKey = request.headers['idempotency-key'] || ''
        if (!/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Provide a valid registration idempotency key.')
        const result = await store.update(async (data) => {
          const previous = data.registrationResults.find((item) => item.key === idempotencyKey)
          if (previous) {
            if (previous.email !== email) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'This registration key belongs to another request.')
            const previousUser = data.users.find((item) => item.id === previous.userID)
            if (!previousUser) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'The previous registration result is unavailable.')
            return { user: publicUser(previousUser), ...createSession(data, previousUser.id, sessionHours, now()), idempotentReplay: true }
          }
          if (data.users.some((user) => user.email === email)) throw new ApiError(409, 'EMAIL_IN_USE', 'An account already uses this email.')
          const timestamp = now().toISOString()
          const user = {
            id: randomUUID(), email, passwordHash: await hashPassword(password), status: 'active', isTestAccount: false, emailVerified: false,
            wallet: { coinBalance: 0 },
            terms: { version: TERMS_VERSION, acceptedAt: timestamp },
            profile: {
              displayName: profile.displayName, handle: '', avatarSource: profile.avatarSource,
              ...(profile.avatarKey ? { avatarKey: profile.avatarKey } : {}), ...(profile.localAssetID ? { localAssetID: profile.localAssetID } : {}),
              countryCode: '', timezone: profile.timezone || '', aboutMe: '',
              spokenLanguages: profile.spokenLanguages, preferredLanguage: profile.preferredLanguage, ageRange: body.ageRange, interests: profile.interests,
              curiousRegion: questionnaire[0], conversationTopic: questionnaire[2], replyPreference: questionnaire[3], onlineWindow: questionnaire[4], aiAssistance: questionnaire[5],
              verified: true, verificationMethod: 'local-fixture', verifiedAt: timestamp,
            },
            createdAt: timestamp, updatedAt: timestamp,
          }
          data.users.push(user)
          data.registrationResults.push({ key: idempotencyKey, email, userID: user.id, createdAt: timestamp })
          return { user: publicUser(user), ...createSession(data, user.id, sessionHours, now()) }
        })
        return send(201, result)
      }

      if (request.method === 'POST' && path === '/oivox/v1/auth/login') {
        const body = await readJSON(request)
        assertOnly(body, ['email', 'password'])
        const email = normalizeEmail(body.email)
        const password = validatePassword(body.password)
        const key = `${request.socket.remoteAddress}:${email}`
        const windowStart = Date.now() - 60_000
        const attempts = (loginAttempts.get(key) || []).filter((value) => value > windowStart)
        if (attempts.length >= 10) throw new ApiError(429, 'RATE_LIMITED', 'Too many login attempts. Try again later.')
        attempts.push(Date.now())
        loginAttempts.set(key, attempts)
        const user = store.data.users.find((item) => item.email === email && item.status === 'active')
        if (!user) throw new ApiError(404, 'ACCOUNT_NOT_FOUND', 'No account exists for this email.')
        if (!await verifyPassword(password, user.passwordHash)) throw new ApiError(401, 'INVALID_PASSWORD', 'The password is incorrect.')
        const result = await store.update((data) => ({ user: publicUser(user), ...createSession(data, user.id, sessionHours, now()) }))
        return send(200, result)
      }

      if (request.method === 'GET' && path === '/oivox/v1/me/profile') {
        const { user } = findSession(store.data, request, now())
        return send(200, publicUser(user))
      }

      if (request.method === 'PATCH' && path === '/oivox/v1/me/profile') {
        const body = await readJSON(request)
        const patch = validateProfilePatch(body)
        const current = findSession(store.data, request, now()).user
        const user = await store.update((data) => {
          const target = data.users.find((item) => item.id === current.id)
          if ('avatarSource' in patch) {
            delete target.profile.avatarKey
            delete target.profile.localAssetID
          }
          target.profile = { ...target.profile, ...patch }
          target.updatedAt = now().toISOString()
          return target
        })
        return send(200, publicUser(user))
      }

      if (request.method === 'POST' && path === '/oivox/v1/auth/logout') {
        const tokenHash = hashToken(bearerToken(request))
        await store.update((data) => { data.sessions = data.sessions.filter((session) => session.tokenHash !== tokenHash) })
        return send(204)
      }

      throw new ApiError(404, 'NOT_FOUND', 'Endpoint not found.')
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR'
      const message = error instanceof ApiError ? error.message : 'The local account server failed.'
      send(status, { error: { code, message, requestId: requestID } })
    }
  })
  return server
}

export { TERMS_VERSION }
