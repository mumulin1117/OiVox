import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { profileRouteContent, profileRouteLocales } from '../data/profileRouteContent'

const socialSource = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
const listenersSource = readFileSync(resolve(process.cwd(), 'src/components/ProfileListenersScreen.vue'), 'utf8')
const voiceSource = readFileSync(resolve(process.cwd(), 'src/components/ProfileVoiceFlow.vue'), 'utf8')
const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

describe('my profile HTML route contract', () => {
  it('connects every route confirmed by the latest HTML reference', () => {
    expect(socialSource).toContain("action === 'edit'")
    expect(socialSource).toContain("action === 'record'")
    expect(socialSource).toContain("action === 'frames'")
    expect(socialSource).toContain("action === 'heard'")
    expect(socialSource).toContain("action === 'clips'")
    expect(socialSource).toContain("action === 'coins'")
    expect(socialSource).toContain("action === 'privacy'")
    expect(socialSource).toContain("screen === 'avatar-frames'")
    expect(socialSource).toContain("screen === 'listeners'")
    expect(socialSource).toContain("screen === 'profile-voice'")
    expect(socialSource).toContain("screen === 'coin-store'")
    expect(socialSource).toContain(':user-ids="profileListenerUserIDs"')
    expect(listenersSource).toContain('props.userIds.map')
    expect(listenersSource).not.toContain("['EG', 'JP', 'TR', 'IL']")
  })

  it('reuses the unified native bridge and cleans recording on exit/background', () => {
    expect(voiceSource).toContain('nativeBridge.startVoiceRecording')
    expect(voiceSource).toContain('nativeBridge.stopVoiceRecording')
    expect(voiceSource).toContain('nativeBridge.publishVoiceRecording')
    expect(voiceSource).toContain("previewReturnsToProfile = ref(props.startAt === 'preview'")
    expect(voiceSource).toContain('@click="backFromPreview"')
    expect(socialSource).toContain('loadPublishedVoiceClip(accountID)')
    expect(voiceSource).toContain("document.addEventListener('visibilitychange'")
    expect(voiceSource).toContain('nativeBridge.cancelPage(pageInstanceID)')
  })

  it('covers eight languages and the approved responsive surfaces', () => {
    expect(profileRouteLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    for (const locale of profileRouteLocales) expect(profileRouteContent(locale).listenersNote).toBeTruthy()
    expect(styles).toContain('.profile-listeners-screen')
    expect(styles).toContain('.profile-voice-record')
    expect(styles).toContain('@media (max-height: 700px)')
  })
})
