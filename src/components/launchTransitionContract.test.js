import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('unauthenticated launch transition contract', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')
  const transition = readFileSync(resolve(process.cwd(), 'src/components/FirstLaunchTransition.vue'), 'utf8')

  it('starts only after session restoration confirms there is no authenticated user', () => {
    expect(app).toContain('let hadSessionAtLaunch = false')
    expect(app).toContain('hadSessionAtLaunch = await oivoxAccountApi.hasSession()')
    expect(app).toContain('if (!hadSessionAtLaunch) launchTransitionActive.value = true')
    expect(app).toContain('v-if="launchTransitionActive"')
  })

  it('resolves the native language before mounting the localized transition', () => {
    const languageSyncIndex = app.indexOf('await syncNativeLanguage().catch(() => {})')
    const sessionCheckIndex = app.indexOf('hadSessionAtLaunch = await oivoxAccountApi.hasSession()')
    const transitionStartIndex = app.indexOf('if (!hadSessionAtLaunch) launchTransitionActive.value = true')

    expect(languageSyncIndex).toBeGreaterThan(-1)
    expect(languageSyncIndex).toBeLessThan(sessionCheckIndex)
    expect(languageSyncIndex).toBeLessThan(transitionStartIndex)
    expect(transition).toContain('computed(() => launchTransitionContent(locale.value))')
  })

  it('does not replay when the user logs out or returns to welcome', () => {
    expect(app).toContain('function cancelAuth()')
    expect(app).toContain('async function logout()')
    expect(app.match(/launchTransitionActive\.value = true/g)).toHaveLength(1)
    expect(app.match(/launchTransitionActive\.value = false/g).length).toBeGreaterThanOrEqual(2)
  })

  it('uses an idempotent 6.2 second state machine and cleans up lifecycle work', () => {
    expect(transition).toContain('const animationDurationMs = 6200')
    expect(transition).toContain("phase.value = 'playing'")
    expect(transition).toContain('if (completed) return')
    expect(transition).toContain("document.addEventListener('visibilitychange'")
    expect(transition).toContain("window.addEventListener('pagehide'")
    expect(transition).toContain('clearScheduledCompletion()')
    expect(transition).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(transition).not.toContain('Math.random')
  })

  it('reveals the real welcome screen instead of duplicating it', () => {
    expect(app).toContain(':defer-initial-eula="launchTransitionActive"')
    expect(app).toContain(':inert="launchTransitionActive"')
    expect(transition).toContain('discoveryPeople')
    expect(transition).not.toContain('Log In or Sign Up')
  })
})
