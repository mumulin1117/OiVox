import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('voice discovery to Main Hub transition contract', () => {
  const hub = readFileSync(resolve(process.cwd(), 'src/components/MainHub.vue'), 'utf8')
  const discovery = readFileSync(resolve(process.cwd(), 'src/components/VoiceDiscoveryScreen.vue'), 'utf8')
  const transition = readFileSync(resolve(process.cwd(), 'src/components/VoiceDiscoveryReturnTransition.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('returns the currently visible stable user rather than the original entry user', () => {
    expect(discovery).toContain('userID: currentProfile.value.id')
    expect(discovery).toContain('currentPhoto.value?.getBoundingClientRect()')
    expect(hub).toContain(':source-rect="discoveryReturnState.sourceRect"')
    expect(hub).toContain(':data-discovery-item="voice.id"')
  })

  it('extracts an avatar, drops it onto its matching Hub module, then reveals that module', () => {
    for (const phase of ['extracting', 'falling', 'revealing-target', 'complete']) {
      expect(transition).toContain(`phase.value = '${phase}'`)
    }
    expect(transition).toContain('document.querySelector(`[data-discovery-source="${props.voice.id}"]`)')
    expect(transition).toContain('document.querySelector(`[data-discovery-item="${props.voice.id}"]`)')
    expect(transition).toContain("targetItem.scrollIntoView({ block: 'nearest', inline: 'nearest' })")
    expect(transition).toContain('targetItem.animate([')
    expect(transition).toContain(':src="voice.avatarAsset"')
    expect(transition).toContain(':src="voice.flagAsset"')
    expect(transition).not.toContain('setTimeout')
  })

  it('locks interaction and safely resolves reduced motion, interruption, and resize', () => {
    expect(hub).toContain("'hub-discovery-return-active': discoveryReturnState")
    expect(discovery).toContain(':disabled="closing || entryPhase !== \'ready\'"')
    expect(transition).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(transition).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(transition).toContain("window.visualViewport?.addEventListener('resize', handleViewportChange)")
    expect(transition).toContain('cancelAnimations()')
    expect(transition).toContain('clearInlineState()')
    expect(css).toContain('.voice-discovery-return-transition')
    expect(css).toContain('.hub-discovery-return-active .hub-scroll')
  })
})
