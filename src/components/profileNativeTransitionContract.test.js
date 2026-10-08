import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('own profile native-style navigation contract', () => {
  const social = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
  const privacy = readFileSync(resolve(process.cwd(), 'src/components/PrivacyAccountPanel.vue'), 'utf8')
  const editor = readFileSync(resolve(process.cwd(), 'src/components/EditProfilePanel.vue'), 'utf8')
  const voice = readFileSync(resolve(process.cwd(), 'src/components/ProfileVoiceFlow.vue'), 'utf8')
  const frames = readFileSync(resolve(process.cwd(), 'src/components/AvatarFramePanel.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('pushes profile child pages forward and pops them back with RTL-aware geometry', () => {
    expect(social).toContain('const profileRouteDirection = ref(\'forward\')')
    expect(social).toContain('profileRouteDepth(nextScreen) < profileRouteDepth(previousScreen)')
    expect(social).toContain('<Transition :name="profileRouteTransitionName">')
    expect(css).toContain('--ios-page-forward-enter-x: 100%')
    expect(css).toContain('--ios-page-forward-enter-x: -100%')
    expect(css).toContain('.ios-page-back-leave-to')
    expect(css).toContain('transition: transform 240ms cubic-bezier(.32,.72,0,1)')
    expect(css).toContain('transition: transform 220ms cubic-bezier(.4,0,.2,1)')
    expect(css).toContain('--ios-page-forward-leave-x: 0%')
    expect(css).toContain('--ios-page-back-enter-x: 0%')
    expect(css).toContain('transform: translate3d(var(--ios-page-forward-enter-x), 0, 0)')
    expect(css).toContain('contain: layout paint')
    expect(css).toContain('will-change: transform;')
    expect(css).not.toContain('transition: transform 320ms cubic-bezier(.32,.72,0,1), opacity 260ms ease, filter 260ms ease')
  })

  it('keeps nested privacy, profile editing and voice steps on the same navigation language', () => {
    expect(privacy).toContain('pageTransitionDirection.value = \'forward\'')
    expect(privacy).toContain('pageTransitionDirection.value = \'back\'')
    expect(privacy).toContain('class="privacy-page-frame"')
    expect(privacy).toContain(':class="`privacy-page-frame-${page}`"')
    expect(css).toContain('.privacy-page-frame-support')
    expect(editor).toContain('panelTransitionDirection.value = \'forward\'')
    expect(editor).toContain('panelTransitionDirection.value = \'back\'')
    expect(voice).toContain('stageTransitionDirection.value = \'forward\'')
    expect(voice).toContain('stageTransitionDirection.value = \'back\'')
  })

  it('animates sheets upward on presentation and downward on dismissal', () => {
    expect(social.match(/<Transition name="ios-sheet">/g)?.length).toBeGreaterThanOrEqual(2)
    expect(frames).not.toContain('<Transition name="ios-sheet">')
    expect(social).not.toMatch(/<Transition name="ios-sheet">\s*<CoinSpendDialog/)
    expect(css).toContain('.ios-sheet-enter-from :is(')
    expect(css).toContain('transform: translateY(100%)')
    expect(css).toContain('.privacy-delete-leave-active .privacy-delete-sheet')
    expect(privacy).toContain('@after-enter="focusDeleteInput"')
  })
})
