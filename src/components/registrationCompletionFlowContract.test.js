import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('registration completion recording branches', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/RegistrationFlow.vue'), 'utf8')

  it('keeps the primary recording path and replaces language with Skip', () => {
    expect(component).toContain("beginVoiceRecording('complete')")
    expect(component).toContain('@click="skipFirstVoice">{{ copy.skip }}')
    expect(component).not.toContain("emit('open-language', completedUser)")
  })

  it('routes Skip to the page 44 Voice Earth gate with a return to registration complete', () => {
    const gate = component.slice(component.indexOf('stage === \'voiceEarthLocked\''), component.indexOf('stage === \'voiceRecord\''))
    expect(gate).toContain('voice-earth-locked-page')
    expect(gate).toContain('voice-earth-locked-back')
    expect(gate).toContain('@click="stage = \'complete\'"')
    expect(gate).toContain('copy.recordToUnlock')
    expect(gate).toContain('copy.voiceEarthLockedBody')
  })

  it('returns cancelled recording to its actual entry screen', () => {
    expect(component).toContain("beginVoiceRecording('voiceEarthLocked')")
    expect(component).toContain('stage.value = voiceRecordReturnStage.value')
  })

  it('keeps publish and notification completion on the existing authenticated path', () => {
    expect(component).toContain("stage.value = 'notification'")
    expect(component).toContain("emit('authenticated', completedUser.value)")
    expect(component).toContain('finishOnboarding()')
  })

  it('starts a fresh digit challenge from either Step 7 failure page', () => {
    const beginAttempt = component.slice(component.indexOf('async function beginLivenessAttempt()'), component.indexOf('async function processLiveness()'))
    const registrationFailure = component.slice(component.indexOf('stage === \'registrationFailed\''), component.indexOf('stage === \'verificationFailed\''))
    const verificationFailure = component.slice(component.indexOf('stage === \'verificationFailed\''), component.indexOf('stage === \'support\''))
    expect(beginAttempt).toContain('await releaseLiveness()')
    expect(beginAttempt).toContain('registrationPromise = null')
    expect(beginAttempt).toContain('createLivenessChallenge(undefined, previousDigits)')
    expect(beginAttempt).toContain("visibleDigits.value = ['symbol', 'symbol', 'symbol']")
    expect(beginAttempt).toContain("stage.value = 'verificationDigits'")
    expect(registrationFailure).toContain('@click="beginLivenessAttempt"')
    expect(verificationFailure).toContain('@click="beginLivenessAttempt"')
    expect(component).not.toContain('retryRegistration')
  })
})
