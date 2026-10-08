import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { privacyAccountContent, privacyAccountLocales } from '../data/privacyAccountContent'

describe('Blue Lake privacy and account contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/PrivacyAccountPanel.vue'), 'utf8')
  const socialModule = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('covers every privacy string in all eight supported languages', () => {
    expect(privacyAccountLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    const keys = Object.keys(privacyAccountContent('en'))
    for (const locale of privacyAccountLocales) {
      const copy = privacyAccountContent(locale)
      for (const key of keys) expect(copy[key], `${locale}.${key}`).toBeTruthy()
      expect(copy.ruleItems).toHaveLength(5)
      expect(copy.deleteItems).toHaveLength(4)
    }
  })

  it('renders EULA independently while terms and privacy retain the shared layout', () => {
    expect(component).toContain("import { legalDocuments } from '../data/legalDocuments'")
    expect(component).toContain("@click=\"open('eula')\"")
    expect(component).toContain("page === 'eula'")
    expect(component).toContain('privacy-eula-page')
    expect(component).toContain("['terms', 'privacy']")
    expect(component).toContain('activeLegalDocument.sections')
    expect(component).toContain('legalCopy.labels.effective')
    expect(component).toContain('legalCopy.labels.version')
  })

  it('routes the profile settings button to the privacy screen and preserves language return context', () => {
    expect(socialModule).toContain("screen.value = 'settings'")
    expect(socialModule).toContain('<PrivacyAccountPanel')
    expect(socialModule).toContain("screen.value = 'privacy-language'")
    expect(socialModule).toContain("screen.value = 'settings'")
    expect(socialModule).toContain('<LanguageScreen v-else-if="screen === \'privacy-language\'"')
  })

  it('uses explicit user actions for notifications, unblock and logout without support media controls', () => {
    expect(component).toContain("nativeBridge.requestNotifications({ pageInstanceID: 'privacy-notification' })")
    expect(component).not.toContain('nativeBridge.selectSupportScreenshot()')
    expect(component).not.toContain('privacy-support-tools')
    expect(component).not.toContain('supportScreenshotID')
    expect(component).not.toContain('sendDiagnostics')
    expect(component).toContain("emit('unblock', personID)")
    expect(component).toContain("unblockingID.value = personID")
    expect(component).toContain("emit('logout')")
    expect(component).toContain("deleteText.value.trim().toUpperCase() === copy.value.deleteWord")
    expect(component).toContain('deleteUnavailable')
  })

  it('opens the H5 s57 delete confirmation as a guarded bottom sheet', () => {
    expect(component).toContain('@click="openDeleteDialog"')
    expect(component).toContain('class="privacy-delete-backdrop"')
    expect(component).toContain('class="privacy-delete-sheet"')
    expect(component).toContain('role="dialog" aria-modal="true"')
    expect(component).toContain('autocomplete="off" autocapitalize="characters"')
    expect(component).toContain(':disabled="!deleteCanConfirm || deleteBusy"')
    expect(component).toContain("deleteSubmissionState.value = 'unavailable'")
    expect(component).not.toContain("open('delete')")
    expect(component).not.toContain("emit('delete")
    expect(css).toContain('background: rgba(27,28,46,.42)')
    expect(css).toContain('border-radius: 24px')
  })

  it('matches the H5 s25, s26 and s58 route and state contract', () => {
    expect(component).toContain(`else if (page.value === 'support') page.value = 'help'`)
    expect(component).toContain(`@click="open('help')"><strong>{{ copy.support }}`)
    expect(component).toContain(`@click="open('support')"><span>{{ copy.reportProblem }}`)
    expect(component).toContain(`@click="emit('open-store')"`)
    expect(component).toContain('createCoinWalletStore({ accountID: props.accountId })')
    expect(component).toContain("filter((item) => item.type === 'storekit_purchase')")
    expect(component).toContain('supportSubmissionState.value = \'sent\'')
    expect(component).toContain('localOnly: true')
    expect(component).toContain('supportCopy.supportSimulated')
    expect(socialModule).toContain(`@open-store="openCoinStore('settings')"`)
  })

  it('uses local image assets for the designed guideline and support icons', () => {
    expect(component).toContain("../assets/icons/guideline-heart.svg")
    expect(component).toContain("../assets/icons/guideline-mic.svg")
    expect(component).not.toContain("../assets/icons/support-paperclip.svg")
    expect(component).toContain("../assets/icons/check-green.svg")
    expect(component).toContain("../assets/icons/account-delete-trash.svg")
    expect(component).not.toMatch(/[❤📎🎤✅]/u)
  })

  it('matches the annotated single-scroll, safe-area, small-screen and RTL layout', () => {
    expect(css).toContain('Blue Lake “Privacy & account”, Version 1')
    expect(css).toContain('.privacy-account-scroll { flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto;')
    expect(css).toContain('env(safe-area-inset-top)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('[dir="rtl"] .privacy-account-nav button img')
    expect(css).toContain('@media (max-width: 340px), (max-height: 620px)')
    expect(component).not.toMatch(/tab-?bar/i)
  })
})
