<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import checkGreenIcon from '../assets/icons/check-green.svg'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { profileRouteContent } from '../data/profileRouteContent'
import { useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { createOpaqueID } from '../services/livenessFlow'
import { savePublishedVoiceClip } from '../services/localBusinessStore'
import { unlockVoiceEarth } from '../services/voiceEarthAccess'
import { EMPTY_VOICE_PLAYBACK_STATE, voicePlaybackService } from '../services/voicePlaybackService'

const props = defineProps({
  user: { type: Object, required: true },
  avatar: { type: String, required: true },
  initialClip: { type: Object, default: null },
  startAt: { type: String, default: 'record' },
  accountId: { type: String, required: true },
})
const emit = defineEmits(['back', 'published'])
const { locale } = useI18n()
const copy = computed(() => postRegistrationContent(locale.value))
const routeCopy = computed(() => profileRouteContent(locale.value))
const pageInstanceID = `profile-voice-${globalThis.crypto?.randomUUID?.() || Date.now()}`
const stage = ref(props.startAt === 'preview' && props.initialClip ? 'preview' : 'record')
const stageTransitionDirection = ref('forward')
const clip = ref(props.initialClip ? { ...props.initialClip, localAssetID: props.initialClip.localAssetID || props.initialClip.nativeAssetID } : null)
const state = ref(stage.value === 'preview' ? 'ready' : 'idle')
const secondsLeft = ref(7)
const busy = ref(false)
const error = ref('')
const guidelineAccepted = ref(false)
const playback = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const ownsTemporaryAsset = ref(false)
const previewReturnsToProfile = ref(props.startAt === 'preview' && Boolean(props.initialClip))
let timer = 0
let startedAt = 0
const isPlaying = computed(() => playback.value.status === 'playing')
const displayName = computed(() => props.user?.profile?.displayName || props.user?.email?.split('@')[0] || 'OiVox')
const countryCode = computed(() => props.user?.profile?.countryCode || '')

function clearTimer() { window.clearInterval(timer); timer = 0 }
async function finishRecording(result) {
  clearTimer()
  const durationMs = Math.min(7000, Math.max(0, Number(result?.durationMs) || Date.now() - startedAt))
  clip.value = { id: createOpaqueID('clip'), localAssetID: result?.assetID || clip.value?.localAssetID, durationMs, createdAt: new Date().toISOString() }
  state.value = 'ready'
  secondsLeft.value = Math.max(0, Math.ceil((7000 - durationMs) / 1000))
}
async function toggleRecording() {
  if (busy.value) return
  error.value = ''
  if (state.value === 'recording') {
    busy.value = true
    try { await finishRecording(await nativeBridge.stopVoiceRecording(clip.value.localAssetID, { pageInstanceID })) }
    catch { state.value = 'idle'; error.value = copy.value.recordingFailed }
    finally { busy.value = false }
    return
  }
  busy.value = true
  const assetID = createOpaqueID('profile_voice')
  try {
    const permission = await nativeBridge.requestPermission('microphone', { pageInstanceID })
    if (!permission?.granted) {
      error.value = copy.value.microphoneRequired
      return
    }
    const result = await nativeBridge.startVoiceRecording(assetID, { pageInstanceID })
    clip.value = { id: createOpaqueID('clip'), localAssetID: result?.assetID || assetID, durationMs: 0, createdAt: new Date().toISOString() }
    ownsTemporaryAsset.value = true
    state.value = 'recording'; secondsLeft.value = 7; startedAt = Date.now()
    clearTimer()
    timer = window.setInterval(async () => {
      secondsLeft.value = Math.max(0, 7 - Math.floor((Date.now() - startedAt) / 1000))
      if (secondsLeft.value === 0 && state.value === 'recording') await toggleRecording()
    }, 200)
  } catch (value) {
    error.value = value?.code === 'PERMISSION_DENIED' ? copy.value.microphoneRequired : copy.value.recordingFailed
  } finally { busy.value = false }
}
async function showPreview() {
  if (state.value !== 'ready') return
  stageTransitionDirection.value = 'forward'
  stage.value = 'preview'
}
async function backFromPreview() {
  if (previewReturnsToProfile.value) {
    await close()
    return
  }
  stageTransitionDirection.value = 'back'
  stage.value = 'record'
}
async function togglePlayback() {
  if (!clip.value || busy.value) return
  busy.value = true; error.value = ''
  try { await voicePlaybackService.play({ id: clip.value.id, nativeAssetID: clip.value.localAssetID || clip.value.nativeAssetID, asset: clip.value.asset, durationMs: clip.value.durationMs || 7000 }, (value) => { playback.value = value }) }
  catch { error.value = copy.value.recordingFailed }
  finally { busy.value = false }
}
async function recordAgain() {
  if (busy.value) return
  busy.value = true; voicePlaybackService.stop()
  try { if (ownsTemporaryAsset.value && clip.value?.localAssetID) await nativeBridge.discardVoiceRecording(clip.value.localAssetID, { pageInstanceID }) }
  finally { previewReturnsToProfile.value = false; ownsTemporaryAsset.value = false; clip.value = null; state.value = 'idle'; secondsLeft.value = 7; guidelineAccepted.value = false; playback.value = { ...EMPTY_VOICE_PLAYBACK_STATE }; error.value = ''; stageTransitionDirection.value = 'back'; stage.value = 'record'; busy.value = false }
}
async function publish() {
  if (busy.value || !guidelineAccepted.value || !clip.value?.localAssetID) return
  busy.value = true; error.value = ''; state.value = 'publishing'; voicePlaybackService.stop()
  try {
    if (globalThis.__OIVOX_PUBLISH_FIXTURE__ === 'failure') throw new Error('Injected publish failure')
    const result = await nativeBridge.publishVoiceRecording(clip.value.localAssetID, { pageInstanceID, timeout: 20000 })
    const saved = savePublishedVoiceClip(
      { ...clip.value, localAssetID: result?.assetID || clip.value.localAssetID },
      { accountID: props.accountId },
    )
    unlockVoiceEarth({ accountID: props.accountId, voiceClipID: saved.id })
    ownsTemporaryAsset.value = false; state.value = 'published'; emit('published', saved)
  } catch { state.value = 'publishFailed'; error.value = copy.value.publishFailed }
  finally { busy.value = false }
}
async function close() {
  if (busy.value) return
  clearTimer(); voicePlaybackService.stop()
  if (state.value === 'recording' && clip.value?.localAssetID) await nativeBridge.stopVoiceRecording(clip.value.localAssetID, { pageInstanceID }).catch(() => {})
  if (ownsTemporaryAsset.value && clip.value?.localAssetID) await nativeBridge.discardVoiceRecording(clip.value.localAssetID, { pageInstanceID }).catch(() => {})
  ownsTemporaryAsset.value = false
  emit('back')
}
async function backgroundCleanup() {
  if (document.visibilityState !== 'hidden') return
  clearTimer(); voicePlaybackService.stop()
  if (state.value === 'recording' && clip.value?.localAssetID) await nativeBridge.stopVoiceRecording(clip.value.localAssetID, { pageInstanceID }).catch(() => {})
  if (ownsTemporaryAsset.value && clip.value?.localAssetID) await nativeBridge.discardVoiceRecording(clip.value.localAssetID, { pageInstanceID }).catch(() => {})
  ownsTemporaryAsset.value = false; clip.value = null; state.value = 'idle'; secondsLeft.value = 7
}
onMounted(() => document.addEventListener('visibilitychange', backgroundCleanup))
onBeforeUnmount(() => {
  clearTimer(); document.removeEventListener('visibilitychange', backgroundCleanup); voicePlaybackService.stop(); nativeBridge.cancelPage(pageInstanceID)
  if (!ownsTemporaryAsset.value || !clip.value?.localAssetID) return
  const assetID = clip.value.localAssetID
  const stop = state.value === 'recording' ? nativeBridge.stopVoiceRecording(assetID, { pageInstanceID }).catch(() => {}) : Promise.resolve()
  stop.finally(() => nativeBridge.discardVoiceRecording(assetID, { pageInstanceID }).catch(() => {}))
  ownsTemporaryAsset.value = false
})
</script>

<template>
  <Transition :name="`ios-page-${stageTransitionDirection}`">
  <main v-if="stage === 'record'" class="profile-voice-record app-screen">
    <header><button type="button" :disabled="busy" @click="close">{{ routeCopy.cancel }}</button><strong>{{ copy.recordTitle }}</strong><span>{{ routeCopy.stepOne }}</span></header>
    <section class="profile-voice-record-body">
      <h1>{{ copy.recordHint }}</h1>
      <div class="profile-record-timer" :class="{ active: state === 'recording' }"><strong>{{ secondsLeft }}</strong><span>{{ copy.secondsLeft }}</span></div>
      <div class="profile-record-wave" aria-hidden="true"><i v-for="(height, index) in [8,18,22,14,28,20,32,17,27,36,19,42,25,34,22,30,17,25,12,20,9]" :key="index" :style="{ height: `${height}px` }" /></div>
      <button class="profile-record-control" :class="{ active: state === 'recording' }" type="button" :disabled="busy" @click="toggleRecording"><span /></button>
      <p>{{ state === 'recording' ? copy.recording : copy.tapRecord }}</p>
      <p v-if="error" class="profile-voice-error" role="alert">{{ error }}</p>
    </section>
    <footer><button type="button" :disabled="state !== 'ready'" @click="showPreview">{{ copy.listenBack }}</button></footer>
  </main>

  <main v-else class="profile-voice-preview app-screen">
    <header><button type="button" :disabled="busy" @click="backFromPreview"><img :src="arrowLeftIcon" alt=""></button><strong>OiVox</strong><span>{{ routeCopy.stepTwo }}</span></header>
    <section class="profile-voice-preview-scroll">
      <h1>{{ copy.previewTitle }}</h1><p>{{ copy.previewBody }}</p>
      <article class="profile-preview-card">
        <img :src="avatar" alt="">
        <button type="button" :disabled="busy" :aria-label="isPlaying ? copy.pause : copy.play" @click="togglePlayback"><span :class="{ pause: isPlaying }" /></button>
        <div><strong>{{ displayName }}</strong><small>{{ countryCode }} · {{ Math.round((clip?.durationMs || 7000) / 1000) }}s</small></div>
      </article>
      <button class="profile-record-again" type="button" :disabled="busy" @click="recordAgain"><strong>{{ copy.recordAgain }}</strong><small>{{ copy.retakeNote }}</small><b>›</b></button>
      <button class="profile-guideline-row" type="button" :aria-pressed="guidelineAccepted" @click="guidelineAccepted = !guidelineAccepted"><span :class="{ checked: guidelineAccepted }"><img v-if="guidelineAccepted" :src="checkGreenIcon" alt=""></span><p>{{ copy.guidelinesPrefix }} <strong>{{ copy.guidelines }}</strong> {{ copy.guidelinesSuffix }}</p></button>
      <p v-if="error" class="profile-voice-error" role="alert">{{ error }}</p>
    </section>
    <footer><button type="button" :disabled="busy || !guidelineAccepted" @click="publish">{{ state === 'publishFailed' ? copy.publishRetry : busy ? copy.publishing : copy.publish }}</button><small>{{ copy.localPublishNote }}</small></footer>
  </main>
  </Transition>
</template>
