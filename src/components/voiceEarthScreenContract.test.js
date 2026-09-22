import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('unlocked Voice Earth transition contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/VoiceEarthScreen.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('uses the live seven-person data for source extraction and final Earth avatars', () => {
    expect(component).toContain('props.voices.forEach((voice) =>')
    expect(component).toContain('document.querySelector(`[data-earth-source="${voice.id}"]`)')
    expect(component).toContain('v-for="(voice, index) in voices"')
    expect(component).toContain(':src="voice.avatarAsset"')
    expect(component).toContain(':src="voice.flagAsset"')
    expect(component).toContain(':data-voice-earth-traveler="voice.id"')
    expect(component).toContain(':data-voice-earth-anchor="voice.id"')
  })

  it('runs explicit forward and reverse phases instead of timer-chained navigation', () => {
    for (const phase of ['extracting', 'revealing-earth', 'settling', 'earth', 'lifting', 'revealing-hub', 'returning', 'complete']) {
      expect(component).toContain(`phase.value = '${phase}'`)
    }
    expect(component).toContain('async function enterEarth()')
    expect(component).toContain('async function closeEarth()')
    expect(component).not.toContain('setTimeout')
  })

  it('shortens both seven-avatar transition directions by two seconds', () => {
    expect(component).toContain('enter: 690ms extraction + 300ms reveal + 450ms settle = 1440ms (previously 3440ms)')
    expect(component).toContain('exit: 390ms lift + 260ms reveal + 394ms return = 1044ms (previously 3044ms)')
    expect(component).toContain('extract: Object.freeze({ duration: 480, stagger: 35 })')
    expect(component).toContain('settle: Object.freeze({ duration: 330, stagger: 20 })')
    expect(component).toContain('lift: Object.freeze({ duration: 300, stagger: 15 })')
    expect(component).toContain('return: Object.freeze({ duration: 304, stagger: 15 })')
  })

  it('locks repeated interaction and cleans up motion on interruption or unmount', () => {
    expect(component).toContain(':disabled="phase !== \'earth\'"')
    expect(component).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(component).toContain("document.removeEventListener('visibilitychange', handleVisibilityChange)")
    expect(component).toContain("window.addEventListener('resize', handleViewportResize)")
    expect(component).toContain("window.removeEventListener('resize', handleViewportResize)")
    expect(component).toContain("window.visualViewport?.addEventListener('resize', handleViewportResize)")
    expect(component).toContain('window.cancelAnimationFrame(resizeFrame)')
    expect(component).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(component).toContain('cancelAnimations()')
    expect(component).toContain('clearInlineState()')
  })

  it('keeps the unlocked screen safe-area aware, RTL safe and free of TabBar UI', () => {
    expect(css).toContain('.voice-earth-transition')
    expect(css).toContain('.voice-earth-unlocked-nav')
    expect(css).toContain('env(safe-area-inset-top)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('[dir="rtl"] .voice-earth-unlocked-nav button img')
    expect(css).toContain('@media (max-width: 340px), (max-height: 700px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(component).not.toMatch(/tab-?bar/i)
  })

  it('matches HTML page 45 controls while retaining the existing globe and transition', () => {
    expect(component).toContain('voice-earth-live-count')
    expect(component).toContain('voice-earth-region-list')
    expect(component).toContain('voice-earth-preview')
    expect(component).toContain('voice-earth-privacy')
    expect(component).toContain('selectVoice(voice.id)')
    expect(component).toContain('selectedVoice.countryLabel')
    expect(css).toContain('linear-gradient(172deg, #dceffa 0%, #e4eafb 46%, #f2edfa 100%)')
    expect(css).toContain('.voice-earth-unlocked-globe .hub-earth-surface')
    expect(css).toContain('.voice-earth-transition.is-earth .voice-earth-traveler.is-floating')
  })

  it('uses the shared player and keeps avatar selection separate from profile navigation', () => {
    expect(component).toContain('voicePlaybackService.play(voice.voiceClip')
    expect(component).toContain('voicePlaybackService.stop()')
    expect(component).toContain('voicePlaybackProgress(playbackState.value')
    expect(component).toContain('voicePlaybackRemainingMs(playbackState.value')
    expect(component).toContain('formatVoiceDuration(playbackRemaining)')
    expect(component).toContain('@click="selectVoice(voice.id)"')
    expect(component).toContain('@click="openSelectedProfile"')
    expect(component).toContain(':disabled="playbackBusy || phase !== \'earth\'"')
    expect(component).toContain('stopVoicePlayback()')
  })
})
