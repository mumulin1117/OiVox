import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { discoveryDatasetSummary, discoveryPeople } from '../data/discoveryFixtures'

describe('welcome discovery data contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/WelcomeScreen.vue'), 'utf8')
  const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('uses the same first two local discovery records without the removed community summary row', () => {
    expect(discoveryDatasetSummary.voiceCount).toBe(Object.keys(discoveryPeople).length)
    expect(discoveryDatasetSummary.countryCount).toBe(new Set(Object.values(discoveryPeople).map((person) => person.countryCode)).size)
    expect(component).toContain('firstDayFreeDiscoveryIDs')
    expect(component).toContain('firstDayFreeDiscoveryIDs.slice(0, 2)')
    expect(component).toContain('frontVoice.displayName')
    expect(component).toContain('frontVoice.countryLabel')
    expect(component).toContain('frontVoice.voiceClip.durationMs')
    expect(component).toContain('backVoice.avatarAsset')
    expect(component).not.toContain('communitySummary')
    expect(component).not.toContain('voice-community')
    expect(component).not.toContain('avatar-stack')
    expect(component).not.toContain('<strong>Layla</strong>')
    expect(component).not.toContain('UAE · UTC+4')
  })

  it('matches the Lanhu welcome button typography and card overlap proportions', () => {
    expect(styles).toContain('font-family: "Figtree","PingFang SC","Microsoft YaHei","Hiragino Sans GB",sans-serif')
    expect(styles).toContain('background: rgba(43,45,75,1)')
    expect(styles).toContain('color: rgba(255,255,255,1)')
    expect(styles).toContain('font: 800 16px/19px "Figtree","PingFang SC","Microsoft YaHei","Hiragino Sans GB",sans-serif')
    expect(styles).toContain('.voice-card-back { z-index: 1; width: 151px;')
    expect(styles).toContain('.voice-card-back img { height: 220px; }')
    expect(styles).toContain('.voice-card-front { z-index: 2; width: min(266px, 80.4vw);')
    expect(styles).toContain('.voice-card-front img { height: 244px; }')
    expect(styles).toContain('.voice-cards { height: 174px; transform: scale(.58); width: 172%; }')
  })

  it('opens EULA, terms, and privacy with the shared draggable three-quarter sheet treatment', () => {
    expect(component).toContain("import { legalDocuments } from '../data/legalDocuments'")
    expect(component).toContain("eulaMode === 'eula'")
    expect(component).toContain('class="eula-standalone-page"')
    expect(component).toContain('class="eula-drag-zone"')
    expect(component).toContain('@pointerdown="beginEulaDrag"')
    expect(component).toContain('@pointermove="moveEulaDrag"')
    expect(component).toContain('@pointerup="finishEulaDrag"')
    expect(component).toContain('@pointercancel="finishEulaDrag($event, true)"')
    expect(component).toContain('@lostpointercapture="finishEulaDrag($event, true)"')
    expect(component).toContain("{{ t('cancel') }}")
    expect(component).toContain("['terms', 'privacy']")
    expect(component).toContain('class="eula-standalone-page legal-document-sheet"')
    expect(component).toContain("'eula-manual-sheet': eulaEntryMode === 'manual'")
    expect(styles).toContain('.eula-manual-sheet .eula-standalone-page')
    expect(styles).toContain('.legal-document-sheet')
    expect(styles).toContain('height: min(76dvh, 760px)')
    expect(component).toContain('activeLegalDocument.sections')
    expect(component).toContain('legalCopy.labels.effective')
  })

  it('waits for the launch transition before sliding an unaccepted EULA up from the bottom', () => {
    expect(component).toContain('wasDeferred && !isDeferred && !accepted.value')
    expect(component).toContain("eulaEntryMode.value = 'after-launch'")
    expect(component).toContain("'eula-after-launch': eulaMode === 'eula' && eulaEntryMode === 'after-launch'")
    expect(styles).toContain('.eula-after-launch .eula-standalone-page')
    expect(styles).toContain('@keyframes eula-page-after-launch')
    expect(styles).toContain('transform: translateY(100%)')
  })
})
