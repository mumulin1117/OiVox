import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('authentication navigation transition contract', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')
  const registration = readFileSync(resolve(process.cwd(), 'src/components/RegistrationFlow.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('uses one directional route transition across welcome, auth, and registration', () => {
    expect(app).toContain("const authRouteDirection = ref('forward')")
    expect(app).toContain("['welcome', 'auth', 'registration'].includes(screen.value)")
    expect(app).toContain(':name="`auth-route-${authRouteDirection}`"')
    expect(app).toContain('mode="out-in"')
    expect(app).toContain("authRouteDirection.value = 'forward'")
    expect(app).toContain("authRouteDirection.value = 'back'")
    expect(app).toContain('@open-auth="openAuth"')
  })

  it('animates registration stages and questionnaire pages in the correct direction', () => {
    expect(registration).toContain('const registrationTransitionRanks = Object.freeze({')
    expect(registration).toContain('const registrationTransitionKey = computed')
    expect(registration).toContain("stage.value === 'questionnaire' ? `${stage.value}-${questionIndex.value}`")
    expect(registration).toContain("registrationTransitionDirection.value = registrationTransitionRank(nextStage, nextQuestion) < registrationTransitionRank(previousStage, previousQuestion) ? 'back' : 'forward'")
    expect(registration).toContain(':name="`registration-route-${registrationTransitionDirection}`"')
    expect(registration).toContain(':key="registrationTransitionKey"')
    expect(registration).toContain('document.activeElement?.blur?.()')
  })

  it('keeps transitions brief, RTL-aware, interruption-safe, and reduced-motion compatible', () => {
    expect(css).toContain('--auth-forward-enter-x: 18px')
    expect(css).toContain('[dir="rtl"]')
    expect(css).toContain('--auth-forward-enter-x: -18px')
    expect(css).toContain('.auth-route-forward-enter-active')
    expect(css).toContain('.registration-route-forward-enter-active')
    expect(css).toContain('pointer-events: none')
    expect(css).toContain('transition: opacity 140ms')
    expect(css).toContain('transition: opacity 130ms')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
