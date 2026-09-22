import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('single-card voice discovery contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/VoiceDiscoveryScreen.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('opens on the requested stable user and only exposes public profile fields', () => {
    expect(component).toContain('props.initialUserId')
    expect(component).toContain('toPublicSocialProfile')
    expect(component).toContain('firstDayFreeDiscoveryIDs')
    expect(component).toContain('currentProfile.avatarAsset')
    expect(component).toContain('currentProfile.voiceClip')
  })

  it('supports accessible switching, pointer cancellation, and audio cleanup', () => {
    expect(component).toContain('@pointerdown="beginDrag"')
    expect(component).toContain('@pointercancel="cancelDrag"')
    expect(component).toContain('@lostpointercapture="cancelDrag"')
    expect(component).toContain('voicePlaybackService.stop()')
    expect(component).toContain("document.removeEventListener('visibilitychange', stopHiddenAudio)")
    expect(css).toContain('touch-action: pan-y')
    expect(css).toContain('.voice-discovery-player.active .voice-discovery-wave i')
    expect(css).toContain('.voice-discovery-player.paused .voice-discovery-wave i')
  })

  it('reveals the Blue Lake card surface from its center without exposing controls early', () => {
    expect(component).toContain('animateEntry: { type: Boolean, default: false }')
    expect(component).toContain("const entryPhase = ref(props.animateEntry ? 'pending' : 'ready')")
    expect(component).toContain("clipPath: 'circle(0% at 50% 43%)'")
    expect(component).toContain("clipPath: 'circle(150% at 50% 43%)'")
    expect(component).toContain(':inert="entryPhase !== \'ready\'"')
    expect(component).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(component).toContain("window.visualViewport?.addEventListener('resize', handleViewportChange)")
    expect(component).toContain('entryAnimation?.cancel()')
    expect(css).toContain('.voice-discovery-screen.is-entry-pending .voice-discovery-entry-surface')
  })
})
