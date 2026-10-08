import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { reportBlockContent, reportBlockLocales } from '../data/reportBlockContent'

describe('Blue Lake Report/Block contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/ReportBlockScreen.vue'), 'utf8')
  const social = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
  const discovery = readFileSync(resolve(process.cwd(), 'src/components/VoiceDiscoveryScreen.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('ships complete localized copy and stable language-independent reason ids', () => {
    expect(reportBlockLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    reportBlockLocales.forEach((locale) => {
      const copy = reportBlockContent(locale)
      expect(copy.title).toBeTruthy()
      expect(copy.reasons.map(([id]) => id)).toEqual(['harassment', 'sexual_explicit', 'hate_threats', 'scam_fraud', 'private_contact', 'fake_voice'])
    })
    expect(reportBlockContent('en').title).toBe('Report/Block')
  })

  it('uses one native-modal component for profile, chat, video and discovery voice reports', () => {
    expect(social).toContain("import ReportBlockScreen from './ReportBlockScreen.vue'")
    expect(social).toContain('@click="openSafety(selectedUserID)"')
    expect(social).toContain("safetyRouteTransitionName.value = 'ios-modal-page-present'")
    expect(social).toContain("safetyRouteTransitionName.value = 'ios-modal-page-dismiss'")
    expect(social).toContain("safetyReturnScreen.value = sourceScreen === 'video' ? 'video' : sourceScreen")
    expect(social).toContain('function closeSafety()')
    expect(social).toContain("safetyReturnScreen.value === 'video'")
    expect(social).toContain('@close="closeSafety"')
    expect(social).toContain("v-else-if=\"screen === 'video' && selectedPerson\"")
    expect(discovery).toContain("activePanel === 'report-block'")
    expect(discovery).toContain('<Transition :name="panelTransitionName">')
    expect(discovery).toContain("panelTransitionName.value = 'ios-modal-page-dismiss'")
    expect(discovery).not.toContain('voice-discovery-report-dialog')
  })

  it('requires a second confirmation before blocking and keeps report details separate', () => {
    expect(component).toContain('confirmOpen.value = true')
    expect(component).toContain("role=\"alertdialog\"")
    expect(component).toContain('<Transition name="ios-sheet" @after-enter="focusConfirmDialog">')
    expect(component).toContain('details.value.trim()')
    expect(component).toContain('voiceID:')
  })

  it('matches the annotated 375 by 812 surface and supports safe areas, RTL and reduced motion', () => {
    expect(css).toContain('Blue Lake “Report user”, Version 1')
    expect(css).toContain('background: #fbdde4')
    expect(css).toContain('padding: 6px 22px 0')
    expect(css).toContain('border-radius: 16px')
    expect(css).toContain('min-height: 51px')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('[dir="rtl"] .report-block-person')
    expect(css).toContain('.ios-modal-page-present-enter-from')
    expect(css).toContain('.ios-modal-page-dismiss-leave-to')
    expect(css).toContain('.report-block-confirm) { transform: translate3d(0, calc(100%')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
