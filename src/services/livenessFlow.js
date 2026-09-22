let fallbackSequence = 0

function platformCrypto() {
  return globalThis.crypto
}

export function createOpaqueID(prefix) {
  const cryptoAPI = platformCrypto()
  if (cryptoAPI?.randomUUID) return `${prefix}_${cryptoAPI.randomUUID()}`
  fallbackSequence += 1
  return `${prefix}_${Date.now()}_${fallbackSequence}`
}

export function createLivenessChallenge(randomValues, previousDigits = []) {
  const values = new Uint32Array(3)
  if (randomValues) randomValues(values)
  else if (platformCrypto()?.getRandomValues) platformCrypto().getRandomValues(values)
  else throw new Error('Secure random values are unavailable.')

  const digits = Array.from(values, (value) => value % 10)
  if (digits.length === previousDigits.length && digits.every((digit, index) => digit === previousDigits[index])) {
    digits[digits.length - 1] = (digits[digits.length - 1] + 1) % 10
  }

  return {
    id: createOpaqueID('liv'),
    challengeID: createOpaqueID('challenge'),
    digits,
    displayState: 'symbols',
    captureState: 'idle',
    faceState: 'unknown',
    outcome: 'pending',
    outcomeSource: 'injected-local-fixture',
    mediaSessionID: null,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    completedAt: null,
    failureCode: null,
  }
}

export function resolveLivenessFixture(attempt, source = globalThis.__OIVOX_LIVENESS_FIXTURE__) {
  let fixture = source
  if (Array.isArray(source)) fixture = source[Math.min(Math.max((attempt?.attemptNumber || 1) - 1, 0), source.length - 1)]
  if (typeof fixture === 'function') fixture = fixture(attempt)
  const result = fixture === 'failure' || fixture?.outcome === 'failed' ? 'failed' : 'passed'
  return {
    outcome: result,
    fixtureID: typeof fixture === 'object' && fixture?.id ? fixture.id : `local-${result}`,
    failureCode: result === 'failed' ? (fixture?.failureCode || 'VERIFICATION_FAILED') : null,
  }
}

export function createRegistrationSubmissionID() {
  return createOpaqueID('registration')
}
