const freeze = (value) => Object.freeze(value)

export const OIVOX_SIGNAL_CONTRACT = freeze({
  version: '2',
  routes: freeze({
    pulse: '/oivox/v2/echo/pulse',
    seed: '/oivox/v2/orbit/seed',
    enter: '/oivox/v2/orbit/enter',
    self: '/oivox/v2/echo/self',
    leave: '/oivox/v2/orbit/leave',
  }),
  headers: freeze({
    seedRef: 'x-oivox-seed-ref',
  }),
  keys: freeze({
    email: 'echoAddress',
    password: 'signalPhrase',
    acceptedTerms: 'accordMark',
    termsVersion: 'accordEdition',
    ageRange: 'seasonBand',
    profile: 'speakerShape',
    onboarding: 'journeySketch',
    verification: 'presenceSeal',
    displayName: 'echoName',
    handle: 'signalTag',
    avatarSource: 'portraitOrigin',
    avatarKey: 'portraitMark',
    localAssetID: 'portraitVaultRef',
    countryCode: 'regionMark',
    timezone: 'daylightBand',
    aboutMe: 'speakerNote',
    spokenLanguages: 'tongueSet',
    preferredLanguage: 'primaryTongue',
    interests: 'curiositySet',
    questionnaire: 'discoveryAnswers',
    status: 'sealState',
    method: 'sealMode',
    attemptID: 'sealAttemptRef',
    challengeID: 'sealChallengeRef',
    fixtureID: 'sealFixtureRef',
    completedAt: 'sealFinishedAt',
    user: 'speakerRecord',
    accessToken: 'orbitToken',
    tokenType: 'orbitScheme',
    expiresAt: 'orbitEndsAt',
    idempotentReplay: 'seedReplay',
    id: 'speakerID',
    emailVerified: 'echoConfirmed',
    profileComplete: 'speakerReady',
    isTestAccount: 'reviewFixture',
    localReviewFixture: 'reviewEcho',
    wallet: 'echoMeter',
    coinBalance: 'echoUnits',
    terms: 'accordRecord',
    createdAt: 'seededAt',
    updatedAt: 'revisedAt',
    version: 'accordEdition',
    acceptedAt: 'accordStampedAt',
    curiousRegion: 'horizonInterest',
    conversationTopic: 'dialogTheme',
    replyPreference: 'responseStyle',
    onlineWindow: 'activeSpan',
    aiAssistance: 'assistChoice',
    verified: 'presenceReady',
    verificationMethod: 'presenceMode',
    verifiedAt: 'presenceStampedAt',
    error: 'fault',
    code: 'faultMark',
    message: 'faultText',
    requestId: 'traceRef',
    ok: 'pulseReady',
    service: 'pulseLabel',
  }),
})

const keys = OIVOX_SIGNAL_CONTRACT.keys

const registrationKeys = freeze({
  email: keys.email,
  password: keys.password,
  acceptedTerms: keys.acceptedTerms,
  termsVersion: keys.termsVersion,
  ageRange: keys.ageRange,
  profile: keys.profile,
  onboarding: keys.onboarding,
  verification: keys.verification,
})

const loginKeys = freeze({ email: keys.email, password: keys.password })

const profileKeys = freeze({
  displayName: keys.displayName,
  handle: keys.handle,
  avatarSource: keys.avatarSource,
  avatarKey: keys.avatarKey,
  localAssetID: keys.localAssetID,
  countryCode: keys.countryCode,
  timezone: keys.timezone,
  aboutMe: keys.aboutMe,
  spokenLanguages: keys.spokenLanguages,
  preferredLanguage: keys.preferredLanguage,
  ageRange: keys.ageRange,
  interests: keys.interests,
  curiousRegion: keys.curiousRegion,
  conversationTopic: keys.conversationTopic,
  replyPreference: keys.replyPreference,
  onlineWindow: keys.onlineWindow,
  aiAssistance: keys.aiAssistance,
  verified: keys.verified,
  verificationMethod: keys.verificationMethod,
  verifiedAt: keys.verifiedAt,
})

const onboardingKeys = freeze({ questionnaire: keys.questionnaire, interests: keys.interests })
const verificationKeys = freeze({
  status: keys.status,
  method: keys.method,
  attemptID: keys.attemptID,
  challengeID: keys.challengeID,
  fixtureID: keys.fixtureID,
  completedAt: keys.completedAt,
})

const publicUserKeys = freeze({
  id: keys.id,
  email: keys.email,
  emailVerified: keys.emailVerified,
  profileComplete: keys.profileComplete,
  isTestAccount: keys.isTestAccount,
  localReviewFixture: keys.localReviewFixture,
  wallet: keys.wallet,
  profile: keys.profile,
  terms: keys.terms,
  createdAt: keys.createdAt,
  updatedAt: keys.updatedAt,
})

const sessionKeys = freeze({
  user: keys.user,
  accessToken: keys.accessToken,
  tokenType: keys.tokenType,
  expiresAt: keys.expiresAt,
  idempotentReplay: keys.idempotentReplay,
  localReviewFixture: keys.localReviewFixture,
})

const walletKeys = freeze({ coinBalance: keys.coinBalance })
const termsKeys = freeze({ version: keys.version, acceptedAt: keys.acceptedAt })
const faultKeys = freeze({ code: keys.code, message: keys.message, requestId: keys.requestId })
const pulseKeys = freeze({ ok: keys.ok, service: keys.service })

const reverse = (mapping) => Object.fromEntries(Object.entries(mapping).map(([plain, signal]) => [signal, plain]))

function translateStrict(value, mapping, driftPrefix) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return value
  let drift = 0
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    mapping[key] || `${driftPrefix}${drift++}`,
    entry,
  ]))
}

function translateCompatible(value, mapping) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [mapping[key] || key, entry]))
}

function nested(value, key, transform) {
  if (value && Object.prototype.hasOwnProperty.call(value, key)) value[key] = transform(value[key])
  return value
}

export function encodeRegistrationPayload(payload) {
  const encoded = translateStrict(payload, registrationKeys, 'echoDrift')
  nested(encoded, keys.profile, (value) => translateStrict(value, profileKeys, 'shapeDrift'))
  nested(encoded, keys.onboarding, (value) => translateStrict(value, onboardingKeys, 'journeyDrift'))
  nested(encoded, keys.verification, (value) => translateStrict(value, verificationKeys, 'sealDrift'))
  return encoded
}

export function decodeRegistrationPayload(payload) {
  const decoded = translateStrict(payload, reverse(registrationKeys), 'echoDrift')
  nested(decoded, 'profile', (value) => translateStrict(value, reverse(profileKeys), 'shapeDrift'))
  nested(decoded, 'onboarding', (value) => translateStrict(value, reverse(onboardingKeys), 'journeyDrift'))
  nested(decoded, 'verification', (value) => translateStrict(value, reverse(verificationKeys), 'sealDrift'))
  return decoded
}

export const encodeLoginPayload = (payload) => translateStrict(payload, loginKeys, 'echoDrift')
export const decodeLoginPayload = (payload) => translateStrict(payload, reverse(loginKeys), 'echoDrift')
export const encodeProfilePatch = (payload) => translateStrict(payload, profileKeys, 'shapeDrift')
export const decodeProfilePatch = (payload) => translateStrict(payload, reverse(profileKeys), 'shapeDrift')

export function encodePublicUser(user) {
  const encoded = translateCompatible(user, publicUserKeys)
  nested(encoded, keys.profile, (value) => translateCompatible(value, profileKeys))
  nested(encoded, keys.wallet, (value) => translateCompatible(value, walletKeys))
  nested(encoded, keys.terms, (value) => translateCompatible(value, termsKeys))
  return encoded
}

export function decodePublicUser(user) {
  const decoded = translateCompatible(user, reverse(publicUserKeys))
  nested(decoded, 'profile', (value) => translateCompatible(value, reverse(profileKeys)))
  nested(decoded, 'wallet', (value) => translateCompatible(value, reverse(walletKeys)))
  nested(decoded, 'terms', (value) => translateCompatible(value, reverse(termsKeys)))
  return decoded
}

export function encodeSessionEnvelope(result) {
  const encoded = translateCompatible(result, sessionKeys)
  nested(encoded, keys.user, encodePublicUser)
  return encoded
}

export function decodeSessionEnvelope(result) {
  const decoded = translateCompatible(result, reverse(sessionKeys))
  nested(decoded, 'user', decodePublicUser)
  return decoded
}

export function encodeFaultEnvelope(result) {
  const encoded = { [keys.error]: translateCompatible(result?.error || {}, faultKeys) }
  return encoded
}

export function decodeFaultEnvelope(result) {
  return { error: translateCompatible(result?.[keys.error] || {}, reverse(faultKeys)) }
}

export const encodePulseEnvelope = (result) => translateCompatible(result, pulseKeys)
export const decodePulseEnvelope = (result) => translateCompatible(result, reverse(pulseKeys))

export const OIVOX_SIGNAL_FORBIDDEN_PARTS = freeze([
  'message', 'room', 'live', 'video', 'chat', 'purchase', 'product', 'buy', 'web',
  'coin', 'payment', 'pay', 'price', 'webview', 'community', 'location', 'gift',
  'meet', 'adult', 'audio', 'balance',
])
