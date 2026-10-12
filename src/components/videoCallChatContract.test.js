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

  it('renders the Lanhu call header, safety actions and topic interaction states', () => {
    expect(component).toContain(':src="selectedPerson.avatarAsset"')
    expect(component).toContain('v-if="ownCallAvatar"')
    expect(component).toContain('callCopy.connecting')
    expect(component).toContain('@click="selectCallCategory(index)"')
    expect(component).toContain('@click="toggleCallTopics"')
    expect(component).not.toContain('class="video-call-timer"')
    expect(component).not.toContain('formattedCallTime')
    expect(component).toContain('<div class="video-call-connecting" role="status">{{ callCopy.connecting }}</div>')
    expect(component).toContain('class="video-call-report"')
    expect(component).toContain('videoReportIcon')
    expect(component).toContain('<img :src="videoReportIcon" alt=""><span>{{ callCopy.report }}</span>')
    expect(component).toContain('class="video-call-block"')
    expect(component).toContain('{{ callCopy.block }}')
    expect(component).toContain('@click="requestVideoBlock"')
    expect(component).toContain('nativeBridge.blockUser(targetUserID, transactionID')
    expect(component).toContain('store.blockUser(targetUserID, transactionID)')
    expect(styles).toContain('border-radius: 999px; background: rgba(26,27,46,.58)')
    expect(styles).toContain('.video-call-safety button img { width: 12px; height: 12px; flex: 0 0 12px; }')
    expect(styles).toContain('background: rgba(244,241,250,.94)')
    expect(styles).toContain('font: 700 19px/23.8px "Caveat-Bold"')
    expect(styles).toContain('.video-call-controls button { width: 54px; min-width: 54px; height: 89px; display: grid; grid-template-rows: 70px 12px; align-items: center; justify-items: center; gap: 7px;')
    expect(styles).toContain('.video-call-controls button:nth-child(2) { width: 70px; min-width: 70px; overflow: visible; }')
    expect(styles).not.toContain('.video-call-controls button:nth-child(2)::before')
    expect(styles).toContain('.video-call-controls img.end { width: 70px; height: 70px; display: block; object-fit: contain; transform: translateY(5px) scale(1.8); transform-origin: center; }')
  })

  it('keeps the chat composer keyboard-safe and backed by Lanhu slices', () => {
    expect(component).toContain('ref="chatInput"')
    expect(component).toContain('@pointerdown="dismissChatKeyboard"')
    expect(styles).toContain('grid-template-columns: minmax(0,1fr) 44px 44px')
    expect(component).toContain('chat-composer-slice chat-composer-mic')
    expect(component).toContain('chat-composer-slice chat-composer-send')
    expect(styles).toContain('transform: scale(1.375)')
    expect(styles).toContain('transform: scale(1.5715)')
    ;[
      'chat-video-call@2x.png', 'chat-more@2x.png', 'chat-translate@2x.png', 'chat-coin@2x.png',
      'chat-mic@2x.png', 'chat-send@2x.png', 'call-mute@2x.png', 'call-end@2x.png',
      'call-ai-topics@2x.png', 'call-topic-strip@2x.png',
    ].forEach((file) => expect(existsSync(resolve(process.cwd(), 'src/assets/slices', file))).toBe(true))
    expect(existsSync(resolve(process.cwd(), 'src/assets/icons/video-report.svg'))).toBe(true)
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
