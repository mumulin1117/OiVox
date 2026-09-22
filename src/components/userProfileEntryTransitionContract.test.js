import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Main Hub to own profile transition contract', () => {
  const hub = readFileSync(resolve(process.cwd(), 'src/components/MainHub.vue'), 'utf8')
  const transition = readFileSync(resolve(process.cwd(), 'src/components/UserProfileEntryTransition.vue'), 'utf8')
  const social = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('extracts the authenticated top-right avatar before opening the profile center', () => {
    expect(hub).toContain('data-profile-center-source')
    expect(hub).toContain('@click="openProfileCenter"')
    expect(hub).toContain(':avatar="ownAvatar"')
    expect(transition).toContain("document.querySelector('[data-profile-center-source]')")
    expect(transition).toContain(':src="avatar"')
  })

  it('drops the avatar to the shared origin and expands the profile from that point', () => {
    for (const phase of ['extracting', 'falling', 'handing-off', 'complete']) {
      expect(transition).toContain(`phase.value = '${phase}'`)
    }
    expect(transition).toContain('x: rootRect.width * .5')
    expect(transition).toContain('y: rootRect.height * .43')
    expect(social).toContain("clipPath: 'circle(0% at 50% 43%)'")
    expect(social).toContain("clipPath: 'circle(150% at 50% 43%)'")
    expect(social).toContain(':inert="entryPhase !== \'ready\'"')
    expect(css).toContain('.user-profile-entry-transition')
    expect(css).toContain('.social-screen.is-profile-entry-pending .social-profile-entry-surface')
    expect(transition).not.toContain('setTimeout')
  })

  it('locks repeat interaction and safely handles reduced motion and interruption', () => {
    expect(hub).toContain(':disabled="profileTransitionActive"')
    expect(hub).toContain("'hub-profile-transition-active': profileTransitionActive")
    expect(transition).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(transition).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(transition).toContain("window.visualViewport?.addEventListener('resize', handleViewportChange)")
    expect(transition).toContain('cancelAnimations()')
    expect(transition).toContain('clearSourceState()')
    expect(social).toContain('profileEntryAnimation?.cancel()')
  })
})
