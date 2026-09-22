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
    expect(css).toContain('.voice-discovery-player.playing .voice-discovery-wave i')
  })
})
