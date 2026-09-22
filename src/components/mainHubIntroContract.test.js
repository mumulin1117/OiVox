import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Main Hub Voice Earth intro contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/MainHubIntro.vue'), 'utf8')

  it('uses the seven live recommendation records and their local media', () => {
    expect(component).toContain('v-for="(voice, index) in voices"')
    expect(component).toContain(':src="voice.avatarAsset"')
    expect(component).toContain(':src="voice.flagAsset"')
    expect(component).toContain('greetingByCountry')
    expect(component).toContain('targetForVoice(props.voices[index])')
  })

  it('runs one cancellable animation state machine without timeout chains', () => {
    expect(component).toContain("phase.value = 'entering'")
    expect(component).toContain("phase.value = 'flying'")
    expect(component).toContain("phase.value = 'landing'")
    expect(component).toContain("phase.value = 'complete'")
    expect(component).toContain('animation.cancel()')
    expect(component).toContain('onBeforeUnmount')
    expect(component).not.toContain('setTimeout(')
    expect(component).not.toContain('setInterval(')
  })

  it('honors reduced motion and stops cleanly when the app enters the background', () => {
    expect(component).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(component).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(component).toContain("document.visibilityState === 'hidden'")
    expect(component).toContain("emit('complete')")
    expect(component).toContain("emit('ready')")
  })

  it('hands animated words and people to exact homepage targets', () => {
    expect(component).toContain('[data-hub-title-word]')
    expect(component).toContain('[data-intro-user=')
    expect(component).toContain('wordLandingOrder')
    expect(component).toContain('revealTarget(target, landingTime)')
    expect(component).toContain('delay: 6500')
  })
})
