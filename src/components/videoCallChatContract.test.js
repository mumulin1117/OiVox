import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { videoCallContent, videoCallLocales } from '../data/videoCallContent'

const component = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

describe('Lanhu chat and video call contract', () => {
  it('uses the existing bridge for both call permissions and cancels page-scoped work', () => {
    expect(component).toContain("nativeBridge.requestPermission('microphone', { pageInstanceID: videoPageInstanceID })")
    expect(component).toContain("nativeBridge.requestPermission('camera', { pageInstanceID: videoPageInstanceID })")
    expect(component).toContain('nativeBridge.cancelPage(videoPageInstanceID)')
    expect(component).toContain("document.visibilityState === 'hidden'")
  })

  it('finishes seven-second chat recordings from native events and cleans listeners on exit', () => {
    expect(component).toContain('nativeBridge.onEvent(handleNativeMediaEvent)')
    expect(component).toContain("event?.type === 'voice.recordingFinished'")
    expect(component).toContain("event?.type === 'media.interrupted'")
    expect(component).toContain('recordingFinalizingAssetID')
    expect(component).toContain('removeNativeMediaListener()')
  })

  it('renders the required avatar, connecting and topic interaction states without a call timer', () => {
    expect(component).toContain(':src="selectedPerson.avatarAsset"')
    expect(component).toContain('v-if="ownCallAvatar"')
    expect(component).toContain('callCopy.connecting')
    expect(component).toContain('@click="selectCallCategory(index)"')
    expect(component).toContain('@click="toggleCallTopics"')
    expect(component).not.toContain('video-call-timer')
  })

  it('keeps the chat composer keyboard-safe and backed by Lanhu slices', () => {
    expect(component).toContain('ref="chatInput"')
    expect(component).toContain('@pointerdown="dismissChatKeyboard"')
    expect(styles).toContain('grid-template-columns: minmax(0,1fr) 44px 44px')
    ;[
      'chat-video-call@2x.png', 'chat-more@2x.png', 'chat-translate@2x.png', 'chat-coin@2x.png',
      'chat-mic@2x.png', 'chat-send@2x.png', 'call-mute@2x.png', 'call-end@2x.png',
      'call-ai-topics@2x.png', 'call-topic-strip@2x.png',
    ].forEach((file) => expect(existsSync(resolve(process.cwd(), 'src/assets/slices', file))).toBe(true))
  })

  it('keeps the chat back destination stable after nested video and safety routes', () => {
    expect(component).toContain("const chatReturnScreen = ref(props.entry === 'chat' ? '' : props.entry)")
    expect(component).toContain("else if (screen.value === 'chat')")
    expect(component).toContain("if (screen.value !== 'chat') chatReturnScreen.value = screen.value")
    expect(styles).toContain('width: 44px; height: 44px')
    expect(styles).toContain('touch-action: manipulation')
  })

  it('provides complete call copy for all eight locales', () => {
    expect(videoCallLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    videoCallLocales.forEach((locale) => {
      const copy = videoCallContent(locale)
      expect(copy.categories).toHaveLength(5)
      expect(copy.categoryPrompts).toHaveLength(5)
      expect(copy.topics).toHaveLength(4)
      expect(copy.connecting).toBeTruthy()
      expect(copy.permissionRequired).toBeTruthy()
      expect(copy.voiceRecordingUnavailable).toBeTruthy()
      expect(copy.voiceRecordingFailed).toBeTruthy()
      expect(copy.voiceRecordingInterrupted).toBeTruthy()
    })
  })
})
