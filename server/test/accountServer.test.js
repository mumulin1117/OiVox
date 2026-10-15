import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createOiVoxApp, TERMS_VERSION } from '../src/app.js'
import { AccountStore } from '../src/store.js'
import { OIVOX_TEST_ACCOUNT_ID, seedTestAccount } from '../src/testAccount.js'
import {
  OIVOX_SIGNAL_CONTRACT,
  OIVOX_SIGNAL_FORBIDDEN_PARTS,
  decodeFaultEnvelope,
  decodePublicUser,
  decodePulseEnvelope,
  decodeSessionEnvelope,
  encodeLoginPayload,
  encodeProfilePatch,
  encodeRegistrationPayload,
} from '../../src/services/oivoxSignalContract.js'

let directory
let dataFile
let store
let server
let baseURL

async function api(path, options = {}) {
  const { rawWire = false, ...requestOptions } = options
  let body = requestOptions.body
  if (body && !rawWire) {
    const parsed = JSON.parse(body)
    if (path === OIVOX_SIGNAL_CONTRACT.routes.seed) body = JSON.stringify(encodeRegistrationPayload(parsed))
    else if (path === OIVOX_SIGNAL_CONTRACT.routes.enter) body = JSON.stringify(encodeLoginPayload(parsed))
    else if (path === OIVOX_SIGNAL_CONTRACT.routes.self && requestOptions.method === 'PATCH') body = JSON.stringify(encodeProfilePatch(parsed))
  }
  const response = await fetch(`${baseURL}${path}`, {
    ...requestOptions,
    body,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...requestOptions.headers },
  })
  const wireBody = response.status === 204 ? null : await response.json()
  if (rawWire || wireBody === null) return { response, body: wireBody }
  if (!response.ok) return { response, body: decodeFaultEnvelope(wireBody) }
  if (path === OIVOX_SIGNAL_CONTRACT.routes.pulse) return { response, body: decodePulseEnvelope(wireBody) }
  if ([OIVOX_SIGNAL_CONTRACT.routes.seed, OIVOX_SIGNAL_CONTRACT.routes.enter].includes(path)) return { response, body: decodeSessionEnvelope(wireBody) }
  if (path === OIVOX_SIGNAL_CONTRACT.routes.self) return { response, body: decodePublicUser(wireBody) }
  return { response, body: wireBody }
}

let registrationSequence = 0
function registrationHeaders() {
  registrationSequence += 1
  return { [OIVOX_SIGNAL_CONTRACT.headers.seedRef]: `registration-test-${registrationSequence}` }
}

function verificationSummary(suffix = 'default') {
  return { status: 'passed', method: 'local-dynamic-face', attemptID: `attempt-${suffix}`, challengeID: `challenge-${suffix}`, fixtureID: `dynamic-face-${suffix}`, completedAt: '2026-09-21T00:00:00.000Z' }
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'oivox-server-test-'))
  dataFile = join(directory, 'accounts.json')
  store = await new AccountStore(dataFile).open()
  await seedTestAccount(store, new Date('2026-09-21T00:00:00Z'))
  server = createOiVoxApp({ store, now: () => new Date('2026-09-21T00:00:00Z') })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  baseURL = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server.closeAllConnections()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await rm(directory, { recursive: true })
})

test('health check identifies the OiVox service', async () => {
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.pulse)
  assert.equal(response.status, 200)
  assert.deepEqual(body, { ok: true, service: 'oivox-account-server' })
})

test('wire routes and field keys use the approved OiVox signal vocabulary', async () => {
  const surface = [
    ...Object.values(OIVOX_SIGNAL_CONTRACT.routes),
    ...Object.values(OIVOX_SIGNAL_CONTRACT.headers),
    ...Object.values(OIVOX_SIGNAL_CONTRACT.keys),
  ].map((value) => value.toLowerCase())
  for (const value of surface) {
    for (const forbidden of OIVOX_SIGNAL_FORBIDDEN_PARTS) assert.equal(value.includes(forbidden), false, `${value} contains ${forbidden}`)
  }

  const raw = await api(OIVOX_SIGNAL_CONTRACT.routes.enter, {
    method: 'POST',
    rawWire: true,
    body: JSON.stringify(encodeLoginPayload({ email: 'Oivox@gmail.com', password: '34563456' })),
  })
  assert.equal(raw.response.status, 200)
  assert.ok(raw.body.orbitToken)
  assert.equal(raw.body.speakerRecord.echoMeter.echoUnits, 120)
  assert.equal('accessToken' in raw.body, false)
  assert.equal('user' in raw.body, false)

  const plainKeys = await api(OIVOX_SIGNAL_CONTRACT.routes.enter, {
    method: 'POST',
    rawWire: true,
    body: JSON.stringify({ email: 'Oivox@gmail.com', password: '34563456' }),
  })
  assert.equal(plainKeys.response.status, 400)
  assert.equal(plainKeys.body.fault.faultMark, 'VALIDATION_ERROR')

  const retired = await api('/oivox/v1/auth/login', {
    method: 'POST',
    rawWire: true,
    body: JSON.stringify(encodeLoginPayload({ email: 'Oivox@gmail.com', password: '34563456' })),
  })
  assert.equal(retired.response.status, 404)
  assert.equal(retired.body.fault.faultMark, 'NOT_FOUND')
})

test('unknown login returns ACCOUNT_NOT_FOUND and never creates an account', async () => {
  const beforeCount = store.data.users.length
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.enter, {
    method: 'POST',
    body: JSON.stringify({ email: 'missing@example.test', password: '12345678' }),
  })
  assert.equal(response.status, 404)
  assert.equal(body.error.code, 'ACCOUNT_NOT_FOUND')
  assert.equal(store.data.users.length, beforeCount)
})

test('fixed test account authenticates and password hashes never leave the server', async () => {
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.enter, {
    method: 'POST',
    body: JSON.stringify({ email: 'Oivox@gmail.com', password: '34563456' }),
  })
  assert.equal(response.status, 200)
  assert.equal(body.user.id, OIVOX_TEST_ACCOUNT_ID)
  assert.equal(body.user.isTestAccount, true)
  assert.equal(body.user.wallet.coinBalance, 120)
  assert.match(body.accessToken, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(JSON.stringify(body).includes('passwordHash'), false)
  assert.equal(JSON.stringify(store.data).includes(body.accessToken), false)

  const wrong = await api(OIVOX_SIGNAL_CONTRACT.routes.enter, {
    method: 'POST',
    body: JSON.stringify({ email: 'oivox@gmail.com', password: '87654321' }),
  })
  assert.equal(wrong.response.status, 401)
  assert.equal(wrong.body.error.code, 'INVALID_PASSWORD')
})

test('registration is explicit and duplicate registration does not overwrite users', async () => {
  const registration = {
    email: 'new@example.test',
    password: 'example-123',
    acceptedTerms: true,
    termsVersion: TERMS_VERSION,
    ageRange: '25-34',
    profile: { displayName: 'Nova', avatarSource: 'preset', avatarKey: 'portrait-04', spokenLanguages: ['en', 'fr'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
    onboarding: { questionnaire: ['world', 'three-plus', 'everything', 'voice', 'evening', 'both'], interests: ['travel', 'music', 'languages'] },
    verification: verificationSummary('explicit'),
  }
  const created = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: registrationHeaders(), body: JSON.stringify(registration) })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.user.email, registration.email)
  assert.equal(created.body.user.profile.displayName, 'Nova')
  assert.equal(created.body.user.profile.verified, true)
  assert.equal(created.body.user.profile.verificationMethod, 'local-dynamic-face')
  assert.equal(created.body.user.wallet.coinBalance, 0)
  assert.deepEqual(created.body.user.profile.interests, ['travel', 'music', 'languages'])
  const duplicate = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: registrationHeaders(), body: JSON.stringify({ ...registration, email: 'NEW@example.test' }) })
  assert.equal(duplicate.response.status, 409)
  assert.equal(duplicate.body.error.code, 'EMAIL_IN_USE')
})

test('registration rejects incomplete onboarding without creating an account', async () => {
  const beforeCount = store.data.users.length
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, {
    method: 'POST',
    headers: registrationHeaders(), body: JSON.stringify({ email: 'early@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '25-34' }),
  })
  assert.equal(response.status, 400)
  assert.equal(body.error.code, 'INVALID_DISPLAY_NAME')
  assert.equal(store.data.users.length, beforeCount)
})

test('registration rejects the former 17-24 range and stale legal version', async () => {
  const under18 = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, {
    method: 'POST',
    headers: registrationHeaders(),
    body: JSON.stringify({ email: 'age-gate@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '17-24' }),
  })
  assert.equal(under18.response.status, 400)
  assert.equal(under18.body.error.code, 'AGE_RESTRICTED')

  const staleTerms = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, {
    method: 'POST',
    headers: registrationHeaders(),
    body: JSON.stringify({ email: 'stale-terms@example.test', password: 'example-123', acceptedTerms: true, termsVersion: '2026-09-oivox-legal-v2', ageRange: '18-24' }),
  })
  assert.equal(staleTerms.response.status, 400)
  assert.equal(staleTerms.body.error.code, 'TERMS_REQUIRED')
})

test('registration rejects a missing avatar with AVATAR_REQUIRED and creates no account', async () => {
  const beforeCount = store.data.users.length
  const registration = {
    email: 'missing-avatar@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '25-34',
    profile: { displayName: 'No Avatar', spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
    onboarding: { questionnaire: ['world', 'english', 'food-life', 'voice', 'morning', 'translate'], interests: ['food', 'languages'] },
    verification: verificationSummary('missing-avatar'),
  }
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: registrationHeaders(), body: JSON.stringify(registration) })
  assert.equal(response.status, 400)
  assert.equal(body.error.code, 'AVATAR_REQUIRED')
  assert.equal(store.data.users.length, beforeCount)
})

test('registration rejects a blank nickname with INVALID_DISPLAY_NAME and creates no account', async () => {
  const beforeCount = store.data.users.length
  const registration = {
    email: 'missing-name@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '25-34',
    profile: { displayName: '   ', avatarSource: 'preset', avatarKey: 'portrait-03', spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
    onboarding: { questionnaire: ['world', 'english', 'food-life', 'voice', 'morning', 'translate'], interests: ['food', 'languages'] },
    verification: verificationSummary('missing-name'),
  }
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: registrationHeaders(), body: JSON.stringify(registration) })
  assert.equal(response.status, 400)
  assert.equal(body.error.code, 'INVALID_DISPLAY_NAME')
  assert.equal(store.data.users.length, beforeCount)
})

test('registration never accepts the neutral placeholder as a preset avatar', async () => {
  const beforeCount = store.data.users.length
  const registration = {
    email: 'placeholder@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '25-34',
    profile: { displayName: 'Placeholder', avatarSource: 'preset', avatarKey: 'default', spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
    onboarding: { questionnaire: ['world', 'english', 'food-life', 'voice', 'morning', 'translate'], interests: ['food', 'languages'] },
    verification: verificationSummary('placeholder'),
  }
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: registrationHeaders(), body: JSON.stringify(registration) })
  assert.equal(response.status, 400)
  assert.equal(body.error.code, 'INVALID_AVATAR')
  assert.equal(store.data.users.length, beforeCount)
})

test('registration accepts a stable sandbox avatar reference without image data or paths', async () => {
  const registration = {
    email: 'custom-avatar@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '25-34',
    profile: { displayName: 'Custom Avatar', avatarSource: 'photoLibrary', localAssetID: 'avatar_12345678-stable', spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
    onboarding: { questionnaire: ['world', 'english', 'food-life', 'voice', 'morning', 'translate'], interests: ['food', 'languages'] },
    verification: verificationSummary('custom-avatar'),
  }
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: registrationHeaders(), body: JSON.stringify(registration) })
  assert.equal(response.status, 201)
  assert.equal(body.user.profile.avatarSource, 'photoLibrary')
  assert.equal(body.user.profile.localAssetID, 'avatar_12345678-stable')
  assert.equal(JSON.stringify(body).includes('data:image'), false)
  assert.equal(JSON.stringify(body).includes('/var/'), false)
})

test('registration preserves an explicit questionnaire skip without inventing an answer', async () => {
  const { response, body } = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, {
    method: 'POST',
    headers: registrationHeaders(), body: JSON.stringify({
      email: 'skip@example.test',
      password: 'example-123',
      acceptedTerms: true,
      termsVersion: TERMS_VERSION,
      ageRange: '18-24',
      profile: { displayName: 'Mia', avatarSource: 'preset', avatarKey: 'portrait-09', spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
      onboarding: { questionnaire: Array(6).fill('skipped'), interests: ['food', 'travel'] },
      verification: verificationSummary('skip'),
    }),
  })
  assert.equal(response.status, 201)
  assert.equal(body.user.profile.avatarKey, 'portrait-09')
  assert.equal(body.user.profile.curiousRegion, 'skipped')
  assert.equal(body.user.profile.aiAssistance, 'skipped')
})

test('registration idempotency key creates one account and replays the result', async () => {
  const key = 'registration-idempotent-replay'
  const beforeCount = store.data.users.length
  const registration = {
    email: 'once@example.test', password: 'example-123', acceptedTerms: true, termsVersion: TERMS_VERSION, ageRange: '25-34',
    profile: { displayName: 'Once', avatarSource: 'preset', avatarKey: 'portrait-02', spokenLanguages: ['en'], preferredLanguage: 'en', timezone: 'Asia/Shanghai' },
    onboarding: { questionnaire: ['world', 'english', 'food-life', 'voice', 'morning', 'translate'], interests: ['food', 'languages'] },
    verification: verificationSummary('once'),
  }
  const first = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: { [OIVOX_SIGNAL_CONTRACT.headers.seedRef]: key }, body: JSON.stringify(registration) })
  const replay = await api(OIVOX_SIGNAL_CONTRACT.routes.seed, { method: 'POST', headers: { [OIVOX_SIGNAL_CONTRACT.headers.seedRef]: key }, body: JSON.stringify(registration) })
  assert.equal(first.response.status, 201)
  assert.equal(replay.response.status, 201)
  assert.equal(replay.body.idempotentReplay, true)
  assert.equal(replay.body.user.id, first.body.user.id)
  assert.equal(store.data.users.length, beforeCount + 1)
})

test('authenticated profile read and partial update are isolated to the bearer user', async () => {
  const login = await api(OIVOX_SIGNAL_CONTRACT.routes.enter, {
    method: 'POST',
    body: JSON.stringify({ email: 'new@example.test', password: 'example-123' }),
  })
  const headers = { authorization: `Bearer ${login.body.accessToken}` }
  const before = await api(OIVOX_SIGNAL_CONTRACT.routes.self, { headers })
  assert.equal(before.response.status, 200)
  assert.equal(before.body.profileComplete, true)
  const updated = await api(OIVOX_SIGNAL_CONTRACT.routes.self, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ displayName: '  New Voice  ', handle: '@new_voice', aboutMe: 'Seven seconds from a night market.', preferredLanguage: 'ja', spokenLanguages: ['ja', 'en'], interests: ['food', 'travel'] }),
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.profile.displayName, 'New Voice')
  assert.equal(updated.body.profile.preferredLanguage, 'ja')
  assert.equal(updated.body.profile.aboutMe, 'Seven seconds from a night market.')
  assert.deepEqual(updated.body.profile.interests, ['food', 'travel'])
  assert.equal(updated.body.profileComplete, true)
})

test('account data persists with password and session hashes only', async () => {
  const persisted = JSON.parse(await readFile(dataFile, 'utf8'))
  assert.ok(persisted.users.every((user) => user.passwordHash.startsWith('scrypt:')))
  assert.ok(persisted.sessions.every((session) => /^[a-f0-9]{64}$/.test(session.tokenHash)))
  assert.equal(JSON.stringify(persisted).includes('example-123'), false)
})
