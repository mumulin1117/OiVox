<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import profileChevronIcon from '../assets/icons/profile-chevron.svg'
import profileClipsIcon from '../assets/icons/profile-clips.svg'
import profileCoinIcon from '../assets/icons/profile-coin.svg'
import profileEditIcon from '../assets/icons/profile-edit.svg'
import profileFrameIcon from '../assets/icons/profile-frame.svg'
import profileHeardIcon from '../assets/icons/profile-heard.svg'
import profilePrivacyIcon from '../assets/icons/profile-privacy.svg'
import profileRerecordIcon from '../assets/icons/profile-rerecord.svg'
import profileScribbleIcon from '../assets/icons/profile-scribble.svg'
import profileSettingsIcon from '../assets/icons/profile-settings.svg'
import profileStarIcon from '../assets/icons/profile-star.svg'
import profileVerifiedIcon from '../assets/icons/profile-verified.svg'
import { discoveryFlagAssets, discoveryPeople } from '../data/discoveryFixtures'
import { socialContent } from '../data/socialContent'
import { toPublicSocialProfile } from '../data/socialProfile'
import { OIVOX_TEST_USER_ID, oivoxTestFixtures } from '../data/oivoxTestFixtures'
import { useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { resolveAccountAvatar, resolveAccountCoinBalance } from '../services/accountPresentation'
import { createSocialStore } from '../services/socialStore'
import { EMPTY_VOICE_PLAYBACK_STATE, formatVoiceDuration, voicePlaybackProgress, voicePlaybackRemainingMs, voicePlaybackService } from '../services/voicePlaybackService'
import EditProfilePanel from './EditProfilePanel.vue'

const props = defineProps({
  entry: { type: String, required: true },
  initialUserId: { type: String, default: '' },
  user: { type: Object, default: null },
  animateEntry: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'open-language', 'logout', 'profile-updated'])
const { locale } = useI18n()
const copy = computed(() => socialContent(locale.value))
const accountID = props.user?.id || props.user?.userID || OIVOX_TEST_USER_ID
const store = createSocialStore({ accountID })
const snapshot = ref(store.getSnapshot())
const unsubscribe = store.subscribe((value) => { snapshot.value = value })
const screen = ref(props.entry)
const returnScreen = ref(props.entry)
const selectedUserID = ref(props.initialUserId || oivoxTestFixtures.relationships[0].userID)
const selectedRequestID = ref(null)
const requestTab = ref('incoming')
const draft = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const reportReason = ref('spam')
const confirmBlock = ref(false)
const audioState = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const audioBusyID = ref('')
const chatScroller = ref(null)
const retryAction = ref(null)
const recordingAssetID = ref('')
const entrySurface = ref(null)
const entryPhase = ref(props.animateEntry && props.entry === 'profile' && !props.initialUserId ? 'pending' : 'ready')
let profileEntryAnimation = null
let profileEntryFrame = 0
let profileEntryMotionQuery = null
let disposed = false
const publicPeople = Object.freeze(Object.fromEntries(Object.entries(discoveryPeople).map(([id, value]) => [id, toPublicSocialProfile(value)])))
const operationID = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
const person = (id) => publicPeople[id]
const selectedPerson = computed(() => person(selectedUserID.value))
const isTestAccount = computed(() => props.user?.isTestAccount === true || accountID === OIVOX_TEST_USER_ID)
const profileSummary = computed(() => ({
  ...(isTestAccount.value ? oivoxTestFixtures.profileSummary : {
    countriesHeard: 0,
    friendsCount: 0,
    voicesCount: 0,
    heardByCount: 0,
    voiceClipsCount: 0,
  }),
  coinBalance: resolveAccountCoinBalance(props.user),
}))
const ownVoiceClip = computed(() => isTestAccount.value ? oivoxTestFixtures.profileVoiceClip : null)
const ownProfile = computed(() => ({
  displayName: props.user?.profile?.displayName || 'Mia',
  avatar: resolveAccountAvatar(props.user),
  handle: props.user?.profile?.handle || '@mia_voice',
  countryCode: props.user?.profile?.countryCode || '',
  flagAsset: discoveryFlagAssets[props.user?.profile?.countryCode] || '',
  frameLabel: props.user?.profile?.avatarFrameLabel || copy.value.noFrame,
  verified: props.user?.profile?.verified === true,
  aboutMe: props.user?.profile?.aboutMe || 'Seven seconds at a time.',
  languages: props.user?.profile?.spokenLanguages || ['en', 'fr'],
}))
const isOwnProfile = computed(() => props.entry === 'profile' && !props.initialUserId && screen.value === 'profile')
const ownVoicePlaying = computed(() => audioState.value.id === ownVoiceClip.value?.id && audioState.value.status === 'playing')
const ownVoicePaused = computed(() => audioState.value.id === ownVoiceClip.value?.id && audioState.value.status === 'paused')
const relationship = (id) => snapshot.value.relationshipsByUserID[id]
const friends = computed(() => Object.values(publicPeople).filter((item) => relationship(item.id)?.friendshipStatus === 'friends' && relationship(item.id)?.blockStatus === 'none'))
const incomingRequests = computed(() => snapshot.value.friendRequests.filter((item) => item.direction === 'incoming' && item.status === 'pending'))
const outgoingRequests = computed(() => snapshot.value.friendRequests.filter((item) => item.direction === 'outgoing' && item.status === 'pending'))
const visibleRequests = computed(() => requestTab.value === 'incoming' ? incomingRequests.value : outgoingRequests.value)
const threads = computed(() => snapshot.value.threads.filter((thread) => store.canMessage(thread.peerUserID)))
const currentThread = computed(() => snapshot.value.threads.find((thread) => thread.peerUserID === selectedUserID.value))
const blockedPeople = computed(() => Object.values(publicPeople).filter((item) => relationship(item.id)?.blockStatus === 'blocked_by_viewer'))
const pendingRequest = computed(() => snapshot.value.friendRequests.find((item) => item.id === selectedRequestID.value))

function clearFeedback(resetRetry = true) { error.value = ''; notice.value = ''; if (resetRetry) retryAction.value = null }
function goBack() {
  clearFeedback()
  voicePlaybackService.stop()
  discardRecording()
  if (screen.value === props.entry) emit('close')
  else if (['chat', 'profile', 'safety', 'video', 'request-detail'].includes(screen.value) || (screen.value === 'settings' && returnScreen.value === 'profile')) screen.value = returnScreen.value
  else emit('close')
}
function openOwnSettings() { clearFeedback(); returnScreen.value = 'profile'; screen.value = 'settings' }
function handleOwnProfileAction(action) {
  clearFeedback()
  if (action === 'edit') { screen.value = 'edit-profile'; return }
  if (action === 'privacy') { openOwnSettings(); return }
  notice.value = copy.value.profileActionUnavailable
}
function closeProfileEditor() { clearFeedback(); screen.value = 'profile' }
function applyProfileUpdate(user) { emit('profile-updated', user); clearFeedback(); screen.value = 'profile' }
function openProfile(userID) { voicePlaybackService.stop(); discardRecording(); selectedUserID.value = userID; clearFeedback(); returnScreen.value = screen.value; screen.value = 'profile' }
function openSafety(userID) { voicePlaybackService.stop(); discardRecording(); selectedUserID.value = userID; clearFeedback(); confirmBlock.value = false; returnScreen.value = screen.value; screen.value = 'safety' }
function openChat(userID) {
  clearFeedback()
  if (!store.canMessage(userID)) { error.value = copy.value.friendsOnly; return }
  selectedUserID.value = userID
  returnScreen.value = screen.value
  screen.value = 'chat'
  const thread = snapshot.value.threads.find((item) => item.peerUserID === userID)
  if (thread?.unreadCount) store.markThreadRead(thread.id, operationID('read'))
  nextTick(() => { if (chatScroller.value) chatScroller.value.scrollTop = chatScroller.value.scrollHeight })
}
function openVideo(userID) {
  clearFeedback()
  if (!store.canMessage(userID)) { error.value = copy.value.friendsOnly; return }
  voicePlaybackService.stop()
  discardRecording()
  selectedUserID.value = userID
  returnScreen.value = screen.value
  screen.value = 'video'
}
function openRequest(requestID) { voicePlaybackService.stop(); selectedRequestID.value = requestID; clearFeedback(); returnScreen.value = screen.value; screen.value = 'request-detail' }

async function run(action) {
  if (busy.value) return
  busy.value = true
  clearFeedback(false)
  try { await action(); retryAction.value = null } catch (value) { error.value = value?.message || copy.value.somethingWrong; retryAction.value = action } finally { busy.value = false }
}
function retryLast() { if (retryAction.value) run(retryAction.value); else clearFeedback() }
function resolveRequest(kind) {
  run(async () => {
    const requestID = selectedRequestID.value
    if (kind === 'accept') store.acceptRequest(requestID, operationID('accept-request'))
    else store.declineRequest(requestID, operationID('decline-request'))
    notice.value = kind === 'accept' ? copy.value.requestAccepted : copy.value.requestDeclined
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    screen.value = 'requests'
  })
}
function sendText() {
  const value = draft.value
  run(async () => {
    store.sendText(selectedUserID.value, value, operationID('send-text'))
    draft.value = ''
    await nextTick()
    if (chatScroller.value) chatScroller.value.scrollTop = chatScroller.value.scrollHeight
  })
}
async function toggleRecording() {
  if (busy.value) return
  if (!recordingAssetID.value) {
    return run(async () => {
      const permission = await nativeBridge.requestPermission('microphone')
      if (!permission?.granted) throw new Error(copy.value.somethingWrong)
      const assetID = `chat_voice_${globalThis.crypto?.randomUUID?.() || Date.now()}`
      await nativeBridge.startVoiceRecording(assetID)
      recordingAssetID.value = assetID
    })
  }
  return run(async () => {
    const assetID = recordingAssetID.value
    const result = await nativeBridge.stopVoiceRecording(assetID)
    await nativeBridge.publishVoiceRecording(result?.assetID || assetID)
    const browserClip = nativeBridge.isNative ? null : oivoxTestFixtures.profileVoiceClip
    store.sendVoice(selectedUserID.value, { assetID: result?.assetID || assetID, asset: browserClip?.asset, durationMs: result?.durationMs || 7000 }, operationID('send-voice'))
    recordingAssetID.value = ''
    await nextTick()
    if (chatScroller.value) chatScroller.value.scrollTop = chatScroller.value.scrollHeight
  })
}
function discardRecording() {
  const assetID = recordingAssetID.value
  if (!assetID) return
  recordingAssetID.value = ''
  nativeBridge.discardVoiceRecording(assetID).catch(() => {})
}
function playableClip(message, fallbackClip) {
  if (message) return {
    id: message.id,
    asset: message.voiceAsset,
    nativeAssetID: message.nativeAssetID,
    durationMs: message.durationMs || 7000,
  }
  return fallbackClip
}
function voiceStatus(id) { return audioState.value.id === id ? audioState.value.status : 'idle' }
function voiceIsActive(id) { return ['playing', 'paused'].includes(voiceStatus(id)) }
function voiceIsPlaying(id) { return voiceStatus(id) === 'playing' }
function voiceIsPaused(id) { return voiceStatus(id) === 'paused' }
function voiceProgress(clip) { return voicePlaybackProgress(audioState.value, clip) }
function voiceRemaining(clip) { return formatVoiceDuration(voicePlaybackRemainingMs(audioState.value, clip)) }
async function toggleVoice(message, fallbackClip) {
  const clip = playableClip(message, fallbackClip)
  if (!clip?.id || audioBusyID.value) return
  audioBusyID.value = clip.id
  clearFeedback()
  try {
    await voicePlaybackService.play(clip, (value) => { audioState.value = value })
  } catch {
    error.value = copy.value.somethingWrong
  } finally {
    audioBusyID.value = ''
  }
}
function toggleOwnVoice() {
  if (!ownVoiceClip.value) { notice.value = copy.value.noPublishedVoice; return }
  clearFeedback()
  toggleVoice(null, ownVoiceClip.value)
}
function submitReport() {
  run(async () => {
    await nativeBridge.reportUser(selectedUserID.value, reportReason.value)
    store.reportUser(selectedUserID.value, reportReason.value, operationID('report'))
    notice.value = copy.value.reportSaved
  })
}
function blockSelected() {
  run(async () => {
    voicePlaybackService.stop()
    await nativeBridge.blockUser(selectedUserID.value)
    store.blockUser(selectedUserID.value, operationID('block'))
    confirmBlock.value = false
    notice.value = copy.value.blocked
  })
}
function unblock(userID) { run(async () => { store.unblockUser(userID, operationID('unblock')) }) }

function stopHiddenAudio() {
  if (document.visibilityState !== 'hidden') return
  voicePlaybackService.stop()
  discardRecording()
  if (entryPhase.value !== 'ready') completeProfileEntry()
}
function completeProfileEntry() {
  profileEntryAnimation?.cancel()
  profileEntryAnimation = null
  entryPhase.value = 'ready'
}
async function runProfileEntry() {
  if (entryPhase.value === 'ready') return
  await nextTick()
  if (disposed || document.hidden || profileEntryMotionQuery?.matches || !entrySurface.value) {
    completeProfileEntry()
    return
  }
  profileEntryFrame = window.requestAnimationFrame(() => {
    if (disposed || !entrySurface.value) return
    entryPhase.value = 'opening'
    profileEntryAnimation = entrySurface.value.animate([
      { clipPath: 'circle(0% at 50% 43%)', opacity: .12, transform: 'scale(.92)', filter: 'blur(8px)' },
      { clipPath: 'circle(27% at 50% 43%)', opacity: .94, transform: 'scale(.975)', filter: 'blur(1px)', offset: .5 },
      { clipPath: 'circle(150% at 50% 43%)', opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    ], { duration: 720, easing: 'cubic-bezier(.18,.76,.2,1)', fill: 'forwards' })
    profileEntryAnimation.finished.catch(() => {}).finally(() => {
      if (!disposed) completeProfileEntry()
    })
  })
}
function handleProfileEntryMotion(event) { if (event.matches && entryPhase.value !== 'ready') completeProfileEntry() }
function handleProfileEntryViewport() { if (entryPhase.value !== 'ready') completeProfileEntry() }
document.addEventListener('visibilitychange', stopHiddenAudio)
onMounted(() => {
  profileEntryMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  window.addEventListener('resize', handleProfileEntryViewport)
  window.visualViewport?.addEventListener('resize', handleProfileEntryViewport)
  if (profileEntryMotionQuery.addEventListener) profileEntryMotionQuery.addEventListener('change', handleProfileEntryMotion)
  else profileEntryMotionQuery.addListener(handleProfileEntryMotion)
  runProfileEntry()
})
onBeforeUnmount(() => {
  disposed = true
  window.cancelAnimationFrame(profileEntryFrame)
  profileEntryAnimation?.cancel()
  if (profileEntryMotionQuery?.removeEventListener) profileEntryMotionQuery.removeEventListener('change', handleProfileEntryMotion)
  else profileEntryMotionQuery?.removeListener(handleProfileEntryMotion)
  window.removeEventListener('resize', handleProfileEntryViewport)
  window.visualViewport?.removeEventListener('resize', handleProfileEntryViewport)
  document.removeEventListener('visibilitychange', stopHiddenAudio)
  discardRecording()
  unsubscribe()
  voicePlaybackService.dispose()
})
</script>

<template>
  <EditProfilePanel v-if="screen === 'edit-profile'" :user="props.user" @cancel="closeProfileEditor" @saved="applyProfileUpdate" @open-language="emit('open-language')" />
  <main v-else class="social-screen app-screen" :class="[`social-${screen}`, `is-profile-entry-${entryPhase}`]" :aria-busy="entryPhase !== 'ready' ? 'true' : undefined">
    <div ref="entrySurface" class="social-profile-entry-surface" :inert="entryPhase !== 'ready'">
    <header v-if="isOwnProfile" class="social-nav own-profile-nav">
      <button class="social-icon-button" type="button" :aria-label="copy.back" @click="goBack">
        <img :src="arrowLeftIcon" alt="">
      </button>
      <span />
      <button class="social-icon-button" type="button" :aria-label="copy.settings" @click="openOwnSettings">
        <img :src="profileSettingsIcon" alt="">
      </button>
    </header>
    <header v-else class="social-nav">
      <button class="social-icon-button" type="button" :aria-label="copy.back" @click="goBack">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7" /></svg>
      </button>
      <div v-if="screen === 'chat' && selectedPerson" class="social-chat-title">
        <img :src="selectedPerson.avatarAsset" alt=""><span><strong>{{ selectedPerson.displayName }}</strong><small>{{ copy.online }}</small></span>
      </div>
      <h1 v-else>{{ screen === 'requests' || screen === 'request-detail' ? copy.requests : screen === 'friends' ? copy.friends : screen === 'messages' ? copy.messages : screen === 'profile' ? (isOwnProfile ? copy.profile : selectedPerson?.displayName || copy.profile) : screen === 'safety' ? copy.safety : screen === 'video' ? copy.videoTitle : copy.settings }}</h1>
      <button v-if="screen === 'chat'" class="social-icon-button accent" type="button" :aria-label="copy.videoCall" @click="openVideo(selectedUserID)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h11v10H4zM15 10l5-3v10l-5-3z" /></svg>
      </button>
      <span v-else class="social-nav-spacer" />
    </header>

    <p v-if="error" class="social-banner error" role="alert">{{ error }} <button type="button" @click="retryLast">{{ copy.retry }}</button></p>
    <p v-if="notice" class="social-banner" role="status">{{ notice }}</p>

    <section v-if="screen === 'requests'" class="social-scroll requests-page">
      <div class="social-tabs" role="tablist">
        <button type="button" :class="{ active: requestTab === 'incoming' }" @click="requestTab = 'incoming'">{{ copy.incoming }} <b>{{ incomingRequests.length }}</b></button>
        <button type="button" :class="{ active: requestTab === 'outgoing' }" @click="requestTab = 'outgoing'">{{ copy.sent }} <b>{{ outgoingRequests.length }}</b></button>
      </div>
      <div v-if="visibleRequests.length" class="request-list">
        <article v-for="request in visibleRequests" :key="request.id" class="request-card" @click="openRequest(request.id)">
          <img :src="person(request.fromUserID || request.toUserID).avatarAsset" alt="">
          <div><strong>{{ person(request.fromUserID || request.toUserID).displayName }}</strong><span><img :src="person(request.fromUserID || request.toUserID).flagAsset" alt=""> {{ person(request.fromUserID || request.toUserID).countryCode }}</span><p>{{ request.note }}</p></div>
          <button type="button" class="mini-open" @click.stop="openRequest(request.id)">{{ copy.open }}</button>
        </article>
      </div>
      <div v-else class="social-empty"><span class="empty-rings" /><h2>{{ copy.noRequests }}</h2><p>{{ copy.localDemo }}</p></div>
    </section>

    <section v-else-if="screen === 'request-detail' && pendingRequest" class="social-scroll request-detail">
      <article class="request-profile-card">
        <img class="large-avatar" :src="person(pendingRequest.fromUserID || pendingRequest.toUserID).avatarAsset" alt="">
        <h2>{{ person(pendingRequest.fromUserID || pendingRequest.toUserID).displayName }}</h2>
        <p class="country-line"><img :src="person(pendingRequest.fromUserID || pendingRequest.toUserID).flagAsset" alt=""> {{ person(pendingRequest.fromUserID || pendingRequest.toUserID).countryCode }}</p>
        <button
          class="voice-pill"
          :class="{ playing: voiceIsPlaying(person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip.id), paused: voiceIsPaused(person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip.id), active: voiceIsActive(person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip.id) }"
          type="button"
          :disabled="Boolean(audioBusyID)"
          @click="toggleVoice(null, person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip)"
        ><span class="play-triangle" :class="{ pause: voiceIsPlaying(person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip.id) }" /><span class="wave-bars audio-progress-wave" :style="{ '--voice-progress': voiceProgress(person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip) }"><i /><i /><i /><i /><i /></span><b>{{ voiceRemaining(person(pendingRequest.fromUserID || pendingRequest.toUserID).voiceClip) }}</b></button>
        <blockquote>{{ pendingRequest.note }}</blockquote>
        <button class="text-link" type="button" @click="openProfile(pendingRequest.fromUserID || pendingRequest.toUserID)">{{ copy.viewProfile }}</button>
      </article>
      <div v-if="pendingRequest.direction === 'incoming'" class="request-actions">
        <button type="button" :disabled="busy" @click="resolveRequest('decline')">{{ copy.decline }}</button>
        <button class="primary" type="button" :disabled="busy" @click="resolveRequest('accept')">{{ copy.accept }}</button>
      </div>
    </section>

    <section v-else-if="screen === 'friends'" class="social-scroll friends-page">
      <div v-if="friends.length" class="friend-list">
        <article v-for="item in friends" :key="item.id" class="friend-card">
          <button class="friend-identity" type="button" @click="openProfile(item.id)"><img :src="item.avatarAsset" alt=""><span><strong>{{ item.displayName }}</strong><small><img v-if="item.flagAsset" :src="item.flagAsset" alt=""> {{ item.countryCode }}<template v-if="item.interests?.length"> · {{ item.interests[0].replaceAll('_', ' ') }}</template></small></span></button>
          <div class="friend-actions"><button type="button" @click="openChat(item.id)">{{ copy.message }}</button><button class="primary" type="button" @click="openVideo(item.id)">{{ copy.videoCall }}</button><button class="more" type="button" :aria-label="copy.safety" @click="openSafety(item.id)">•••</button></div>
        </article>
      </div>
      <div v-else class="social-empty"><span class="empty-rings" /><h2>{{ copy.noFriends }}</h2></div>
      <p class="social-safety-note">{{ copy.safetyNote }}</p>
    </section>

    <section v-else-if="screen === 'messages'" class="social-scroll messages-page">
      <p class="sticker-hi">hi!</p><p class="sticker-sub">good voices, better days</p>
      <div class="social-tabs four"><button class="active" type="button">{{ copy.chats }}</button><button type="button">{{ copy.voices }}</button><button type="button">{{ copy.groups }}</button><button type="button" @click="screen = 'requests'">{{ copy.requests }}</button></div>
      <div v-if="threads.length" class="thread-list">
        <button v-for="thread in threads" :key="thread.id" type="button" class="thread-card" @click="openChat(thread.peerUserID)">
          <img :src="person(thread.peerUserID).avatarAsset" alt=""><span><strong>{{ person(thread.peerUserID).displayName }} <img :src="person(thread.peerUserID).flagAsset" alt=""></strong><small>{{ thread.messages.at(-1)?.type === 'voice' ? `Voice · ${Math.round((thread.messages.at(-1).durationMs || 7000) / 100) / 10}s` : thread.messages.at(-1)?.text }}</small></span><b v-if="thread.unreadCount">{{ thread.unreadCount }}</b>
        </button>
      </div>
      <div v-else class="social-empty"><span class="empty-rings" /><h2>{{ copy.noMessages }}</h2></div>
      <div class="new-voices-card"><span class="wave-bars"><i /><i /><i /><i /><i /></span><strong>34 {{ copy.newVoices }}</strong></div>
      <p class="social-safety-note">{{ copy.safetyNote }}</p>
    </section>

    <section v-else-if="screen === 'chat' && selectedPerson" ref="chatScroller" class="social-scroll chat-page">
      <p class="friend-gate">{{ copy.friendsOnly }}</p>
      <div class="message-stream">
        <article v-for="messageItem in (currentThread?.messages || [])" :key="messageItem.id" class="message-bubble" :class="{ mine: messageItem.senderID === accountID, voice: messageItem.type === 'voice' }">
          <p v-if="messageItem.type === 'text'">{{ messageItem.text }}</p>
          <button v-else type="button" :class="{ playing: voiceIsPlaying(messageItem.id), paused: voiceIsPaused(messageItem.id), active: voiceIsActive(messageItem.id) }" :disabled="Boolean(audioBusyID)" @click="toggleVoice(messageItem)"><span class="play-triangle" :class="{ pause: voiceIsPlaying(messageItem.id) }" /><span class="wave-bars audio-progress-wave" :style="{ '--voice-progress': voiceProgress(playableClip(messageItem)) }"><i /><i /><i /><i /><i /></span><b>{{ voiceRemaining(playableClip(messageItem)) }}</b></button>
        </article>
      </div>
      <p class="local-demo-note">{{ copy.localDemo }}</p>
      <div class="chat-composer">
        <button class="social-icon-button" :class="{ recording: recordingAssetID }" type="button" :aria-label="copy.sendVoice" :aria-pressed="Boolean(recordingAssetID)" :disabled="busy" @click="toggleRecording"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg></button>
        <input v-model="draft" :placeholder="copy.typeMessage" maxlength="500" @keyup.enter="sendText">
        <button class="send-button" type="button" :aria-label="copy.send" :disabled="busy || !draft.trim()" @click="sendText"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 16-8-5 16-3-6z"/></svg></button>
      </div>
    </section>

    <section v-else-if="isOwnProfile" class="social-scroll own-profile-page">
      <div class="own-profile-collage" aria-hidden="true">
        <span class="own-profile-tape" />
        <div class="own-profile-polaroid">
          <img class="own-profile-photo" :src="ownProfile.avatar" alt="">
          <strong>{{ copy.mySevenSeconds }}</strong>
        </div>
        <img class="own-profile-star" :src="profileStarIcon" alt="">
        <p class="own-profile-hand-note">{{ copy.sameVibe }}<br>{{ copy.newCountry }}</p>
        <p class="own-profile-sticky"><strong>{{ profileSummary.countriesHeard }} {{ copy.countriesHeardMe }}</strong><span>♡</span></p>
      </div>

      <div class="own-profile-identity">
        <h1>{{ ownProfile.displayName }}</h1>
        <span v-if="ownProfile.verified" class="own-profile-verified"><img :src="profileVerifiedIcon" alt="">{{ copy.verified }}</span>
        <p><template v-if="ownProfile.countryCode"><img v-if="ownProfile.flagAsset" :src="ownProfile.flagAsset" alt="">{{ ownProfile.countryCode }} · </template>{{ ownProfile.handle }}</p>
        <button class="own-profile-edit" type="button" @click="handleOwnProfileAction('edit')"><img :src="profileEditIcon" alt="">{{ copy.edit }}</button>
      </div>

      <article class="own-profile-voice-card" :class="{ playing: ownVoicePlaying, paused: ownVoicePaused, active: ownVoicePlaying || ownVoicePaused }">
        <button class="own-profile-play" type="button" :aria-label="ownVoicePlaying ? copy.pause : copy.play" :disabled="!ownVoiceClip" @click="toggleOwnVoice">
          <img :src="ownVoicePlaying ? pauseIcon : playIcon" alt="">
        </button>
        <div class="own-profile-voice-copy">
          <span class="own-profile-voice-heading"><strong>{{ copy.mySevenSeconds }}</strong><small>{{ voiceRemaining(ownVoiceClip) }} · {{ copy.published }}</small></span>
          <span class="own-profile-wave audio-progress-wave" :style="{ '--voice-progress': voiceProgress(ownVoiceClip) }" aria-hidden="true"><i v-for="(height, index) in [7, 15, 22, 12, 25, 18, 9, 20, 14, 23, 11, 18, 8]" :key="index" :style="{ height: `${height}px` }" /></span>
        </div>
        <button class="own-profile-rerecord" type="button" @click="handleOwnProfileAction('record')"><img :src="profileRerecordIcon" alt="">{{ copy.reRecord }}</button>
      </article>

      <dl class="own-profile-stats">
        <div><dt>{{ profileSummary.countriesHeard }}</dt><dd>{{ copy.countries }}</dd></div>
        <div><dt>{{ profileSummary.friendsCount }}</dt><dd>{{ copy.friendsStat }}</dd></div>
        <div><dt>{{ profileSummary.voicesCount }}</dt><dd>{{ copy.voicesStat }}</dd></div>
      </dl>

      <div class="own-profile-menu">
        <button type="button" @click="handleOwnProfileAction('frames')"><span class="own-profile-menu-icon"><img :src="profileFrameIcon" alt=""></span><strong>{{ copy.avatarFrames }}</strong><b class="country-value">{{ ownProfile.frameLabel }}</b><img class="own-profile-chevron" :src="profileChevronIcon" alt=""></button>
        <button type="button" @click="handleOwnProfileAction('heard')"><span class="own-profile-menu-icon"><img :src="profileHeardIcon" alt=""></span><strong>{{ copy.whoHeardMe }}</strong><b>{{ profileSummary.heardByCount }}</b><img class="own-profile-chevron" :src="profileChevronIcon" alt=""></button>
        <button type="button" @click="handleOwnProfileAction('clips')"><span class="own-profile-menu-icon"><img :src="profileClipsIcon" alt=""></span><strong>{{ copy.myVoiceClips }}</strong><b>{{ profileSummary.voiceClipsCount }}</b><img class="own-profile-chevron" :src="profileChevronIcon" alt=""></button>
        <button type="button" @click="handleOwnProfileAction('coins')"><span class="own-profile-menu-icon"><img :src="profileCoinIcon" alt=""></span><strong>{{ copy.myCoins }}</strong><b>{{ profileSummary.coinBalance }}</b><img class="own-profile-chevron" :src="profileChevronIcon" alt=""></button>
        <button type="button" @click="handleOwnProfileAction('privacy')"><span class="own-profile-menu-icon"><img :src="profilePrivacyIcon" alt=""></span><strong>{{ copy.privacySafety }}</strong><img class="own-profile-chevron" :src="profileChevronIcon" alt=""></button>
      </div>
      <p class="own-profile-signature"><img :src="profileScribbleIcon" alt=""><span>{{ copy.worldSaysHi }}</span></p>
    </section>

    <section v-else-if="screen === 'profile' && selectedPerson" class="social-scroll profile-page">
      <article class="profile-hero"><img :src="selectedPerson.avatarAsset" alt=""><div><h2>{{ selectedPerson.displayName }}</h2><p v-if="selectedPerson.countryCode"><img :src="selectedPerson.flagAsset" alt=""> {{ selectedPerson.countryCode }}</p></div></article>
      <button v-if="selectedPerson.voiceClip" class="profile-voice" :class="{ playing: voiceIsPlaying(selectedPerson.voiceClip.id), paused: voiceIsPaused(selectedPerson.voiceClip.id), active: voiceIsActive(selectedPerson.voiceClip.id) }" type="button" :disabled="Boolean(audioBusyID)" @click="toggleVoice(null, selectedPerson.voiceClip)"><span class="play-triangle" :class="{ pause: voiceIsPlaying(selectedPerson.voiceClip.id) }" /><span class="wave-bars audio-progress-wave" :style="{ '--voice-progress': voiceProgress(selectedPerson.voiceClip) }"><i /><i /><i /><i /><i /><i /></span><b>{{ voiceRemaining(selectedPerson.voiceClip) }}</b></button>
      <article v-if="selectedPerson.aboutMe" class="profile-section"><h3>{{ copy.about }}</h3><p>{{ selectedPerson.aboutMe }}</p></article>
      <article v-if="selectedPerson.languages" class="profile-section"><h3>{{ copy.languages }}</h3><div class="tag-list"><span v-for="item in selectedPerson.languages" :key="item">{{ item.toUpperCase() }}</span></div></article>
      <article v-if="selectedPerson.interests" class="profile-section"><h3>{{ copy.interests }}</h3><div class="tag-list"><span v-for="item in selectedPerson.interests" :key="item">{{ item.replaceAll('_', ' ') }}</span></div></article>
      <p v-if="Number.isFinite(selectedPerson.likesCount)" class="profile-likes">{{ selectedPerson.likesCount }} {{ copy.likes }}</p>
      <div class="profile-actions"><button v-if="store.canMessage(selectedPerson.id)" type="button" @click="openChat(selectedPerson.id)">{{ copy.message }}</button><button type="button" @click="openSafety(selectedPerson.id)">{{ copy.reportBlock }}</button></div>
    </section>

    <section v-else-if="screen === 'safety' && selectedPerson" class="social-scroll safety-page">
      <div class="safety-person"><img :src="selectedPerson.avatarAsset" alt=""><strong>{{ selectedPerson.displayName }}</strong></div>
      <fieldset><legend>{{ copy.reportReason }}</legend><label v-for="reason in ['spam', 'harassment', 'inappropriate']" :key="reason"><input v-model="reportReason" type="radio" :value="reason"><span>{{ copy[reason] }}</span></label></fieldset>
      <button class="wide-button" type="button" :disabled="busy" @click="submitReport">{{ copy.submitReport }}</button>
      <button class="wide-button danger" type="button" :disabled="busy" @click="confirmBlock = true">{{ copy.block }}</button>
      <div v-if="confirmBlock" class="confirm-card"><p>{{ copy.blockConfirm }}</p><div><button type="button" @click="confirmBlock = false">{{ copy.cancel }}</button><button class="danger" type="button" :disabled="busy" @click="blockSelected">{{ copy.confirmBlock }}</button></div></div>
      <p class="local-demo-note">{{ copy.localDemo }}</p>
    </section>

    <section v-else-if="screen === 'settings'" class="social-scroll settings-page">
      <button class="settings-row" type="button" @click="emit('open-language')"><span><strong>{{ copy.language }}</strong><small>{{ locale.toUpperCase() }}</small></span><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg></button>
      <article class="blocked-card"><h2>{{ copy.blockedAccounts }}</h2><div v-if="blockedPeople.length"><div v-for="item in blockedPeople" :key="item.id" class="blocked-row"><img :src="item.avatarAsset" alt=""><strong>{{ item.displayName }}</strong><button type="button" :disabled="busy" @click="unblock(item.id)">{{ copy.unblock }}</button></div></div><p v-else>{{ copy.noBlocked }}</p></article>
      <button class="wide-button" type="button" @click="emit('logout')">{{ copy.logout }}</button>
      <p class="local-demo-note">{{ copy.localDemo }}</p>
    </section>

    <section v-else-if="screen === 'video' && selectedPerson" class="social-scroll video-page">
      <div class="video-preview"><img :src="selectedPerson.avatarAsset" alt=""><span class="video-orbit one"/><span class="video-orbit two"/></div>
      <h2>{{ copy.videoReady }}</h2><p>{{ selectedPerson.displayName }} · {{ copy.online }}</p>
      <p class="video-note">{{ copy.videoNote }}</p>
      <button class="wide-button primary" type="button" @click="notice = copy.videoDemo">{{ copy.continueVideo }}</button>
      <p class="local-demo-note">{{ copy.videoDemo }}</p>
    </section>
    </div>
  </main>
</template>
