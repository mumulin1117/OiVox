import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Main Hub to voice discovery transition contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/VoiceDiscoveryEntryTransition.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('extracts the clicked stable user avatar and keeps its matching local flag', () => {
    expect(component).toContain('document.querySelector(`[data-discovery-source="${props.voice.id}"]`)')
    expect(component).toContain(':src="voice.avatarAsset"')
    expect(component).toContain(':src="voice.flagAsset"')
    expect(component).toContain("emit('complete', props.voice.id)")
  })

  it('uses explicit extract, fall and hand-off phases without timer chains', () => {
    for (const phase of ['extracting', 'falling', 'handing-off', 'complete']) {
      expect(component).toContain(`phase.value = '${phase}'`)
    }
    expect(component).toContain('async function runEntry()')
    expect(component).not.toContain('setTimeout')
  })

  it('locks the underlying Hub and cleans up interruption state', () => {
    expect(component).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(component).toContain("document.removeEventListener('visibilitychange', handleVisibilityChange)")
    expect(component).toContain("window.visualViewport?.addEventListener('resize', handleViewportChange)")
    expect(component).toContain("window.visualViewport?.removeEventListener('resize', handleViewportChange)")
    expect(component).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(component).toContain('cancelAnimations()')
    expect(component).toContain('clearSourceState()')
    expect(css).toContain('.hub-discovery-transition-active .hub-scroll')
    expect(css).toContain('.voice-discovery-entry-transition')
    expect(css).toContain('.voice-discovery-entry-blank')
  })
})
