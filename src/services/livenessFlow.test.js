import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLivenessChallenge, resolveLivenessFixture } from './livenessFlow'

afterEach(() => { delete globalThis.__OIVOX_LIVENESS_FIXTURE__; vi.restoreAllMocks() })

describe('liveness fixtures', () => {
  it('creates deterministic digits from the injected secure random source', () => {
    const mathRandom = vi.spyOn(Math, 'random')
    const challenge = createLivenessChallenge((values) => values.set([12, 23, 34]))
    expect(challenge.digits).toEqual([2, 3, 4])
    expect(mathRandom).not.toHaveBeenCalled()
  })

  it('keeps digits independent from success and failure fixtures', () => {
    const challenge = createLivenessChallenge((values) => values.set([1, 2, 3]))
    challenge.attemptNumber = 1
    expect(resolveLivenessFixture(challenge, { id: 'forced-fail', outcome: 'failed' })).toMatchObject({ outcome: 'failed', fixtureID: 'forced-fail' })
    expect(resolveLivenessFixture(challenge, { id: 'forced-pass', outcome: 'passed' })).toMatchObject({ outcome: 'passed', fixtureID: 'forced-pass' })
    expect(challenge.digits).toEqual([1, 2, 3])
  })

  it('uses repeatable results by attempt number for retry testing', () => {
    expect(resolveLivenessFixture({ attemptNumber: 1 }, ['failure', 'success']).outcome).toBe('failed')
    expect(resolveLivenessFixture({ attemptNumber: 2 }, ['failure', 'success']).outcome).toBe('passed')
  })
})
