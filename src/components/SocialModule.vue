<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import checkIcon from '../assets/icons/check-large.svg'
import globeIcon from '../assets/icons/globe.svg'
import moreIcon from '../assets/icons/discovery-more.svg'
import personAddIcon from '../assets/icons/discovery-person-add.svg'
import sparkleIcon from '../assets/icons/discovery-sparkle.svg'
import waitingIcon from '../assets/icons/discovery-history.svg'
import messageIcon from '../assets/icons/hub-chat.svg'
import videoCallIcon from '../assets/icons/video-call.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import profileChevronIcon from '../assets/icons/profile-chevron.svg'
import profileClipsIcon from '../assets/icons/profile-clips.svg'
import profileCoinIcon from '../assets/icons/profile-coin.svg'
import profileEditIcon from '../assets/icons/profile-edit.svg'
import profileFrameIcon from '../assets/icons/profile-frame.svg'
import profileHeardIcon from '../assets/icons/profile-heard.svg'
import profileNoteShieldIcon from '../assets/icons/profile-note-shield.svg'
import profilePrivacyIcon from '../assets/icons/profile-privacy.svg'
import profileRerecordIcon from '../assets/icons/profile-rerecord.svg'
import profileScribbleIcon from '../assets/icons/profile-scribble.svg'
import profileSettingsIcon from '../assets/icons/profile-settings.svg'
import profileStarIcon from '../assets/icons/profile-star.svg'
import profileVerifiedIcon from '../assets/icons/profile-verified.svg'
import chatVideoCallImage from '../assets/slices/chat-video-call@2x.png'
import chatMoreImage from '../assets/slices/chat-more@2x.png'
import chatTranslateImage from '../assets/slices/chat-translate@2x.png'
import chatCoinImage from '../assets/slices/chat-coin@2x.png'
import chatMicImage from '../assets/slices/chat-mic@2x.png'
import chatSendImage from '../assets/slices/chat-send@2x.png'
import callMuteImage from '../assets/slices/call-mute@2x.png'
import callEndImage from '../assets/slices/call-end@2x.png'
import callTopicsImage from '../assets/slices/call-ai-topics@2x.png'
import callTopicStripImage from '../assets/slices/call-topic-strip@2x.png'
import { discoveryFlagAssets, discoveryPeople } from '../data/discoveryFixtures'
import { avatarFrameByID, avatarFrameCatalog, avatarFrameContent, resolveAvatarFrameID } from '../data/avatarFrameCatalog'
import { discoveryCommerceContent } from '../data/discoveryCommerceContent'
import { socialContent } from '../data/socialContent'
import { videoCallContent } from '../data/videoCallContent'
import { toPublicSocialProfile } from '../data/socialProfile'
import { OIVOX_TEST_USER_ID, oivoxTestFixtures } from '../data/oivoxTestFixtures'
import { useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { resolveAccountAvatar, resolveAccountCoinBalance, resolveAccountProfileSummary } from '../services/accountPresentation'
import { updateLocalAccountProfile } from '../services/accountUserCache'
import { CoinWalletError, createCoinWalletStore } from '../services/coinWalletStore'
import { loadPublishedVoiceClip } from '../services/localBusinessStore'
import { createSocialStore } from '../services/socialStore'
import { createTranslationHistoryStore } from '../services/translationHistoryStore'
import { createVoiceActivityStore } from '../services/voiceActivityStore'
import { EMPTY_VOICE_PLAYBACK_STATE, formatVoiceDuration, voicePlaybackProgress, voicePlaybackRemainingMs, voicePlaybackService } from '../services/voicePlaybackService'
import AvatarFramePanel from './AvatarFramePanel.vue'
import CoinSpendDialog from './CoinSpendDialog.vue'
import CoinStoreScreen from './CoinStoreScreen.vue'
import EditProfilePanel from './EditProfilePanel.vue'
import LanguageScreen from './LanguageScreen.vue'
import ProfileListenersScreen from './ProfileListenersScreen.vue'
import ProfileVoiceFlow from './ProfileVoiceFlow.vue'
import PrivacyAccountPanel from './PrivacyAccountPanel.vue'
import ReportBlockScreen from './ReportBlockScreen.vue'

const props = defineProps({
  entry: { type: String, required: true },
  initialUserId: { type: String, default: '' },
  user: { type: Object, default: null },
  coinBalance: { type: Number, default: null },
  discoveryUserIds: { type: Array, default: () => [] },
  animateEntry: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'open-discovery', 'open-language', 'logout', 'profile-updated', 'coin-balance-changed', 'voice-published'])
const { locale } = useI18n()
const copy = computed(() => socialContent(locale.value))
const callCopy = computed(() => videoCallContent(locale.value))
const discoveryCopy = computed(() => discoveryCommerceContent(locale.value))
const frameCopy = computed(() => avatarFrameContent(locale.value))
const accountID = props.user?.id || props.user?.userID || OIVOX_TEST_USER_ID
let coinWallet = createCoinWalletStore({ accountID, initialBalance: Number.isSafeInteger(props.coinBalance) ? props.coinBalance : resolveAccountCoinBalance(props.user) })
const localCoinBalance = ref(coinWallet.getSnapshot().balance)
const store = createSocialStore({ accountID })
const snapshot = ref(store.getSnapshot())
const translationHistoryStore = createTranslationHistoryStore({ accountID })
const voiceActivityStore = createVoiceActivityStore({ accountID })
const heardVoiceSnapshot = ref(voiceActivityStore.getSnapshot())
const unsubscribe = store.subscribe((value) => { snapshot.value = value })
const screen = ref(props.entry)
const returnScreen = ref(props.entry)
const chatReturnScreen = ref(props.entry === 'chat' ? '' : props.entry)
const selectedUserID = ref(props.initialUserId || oivoxTestFixtures.relationships[0].userID)
const selectedRequestID = ref(null)
const messageTab = ref('chats')
const draft = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const requestComposerOpen = ref(false)
const requestDraft = ref('')
const safetySource = ref('user')
const safetyTransaction = ref(null)
const safetyReturnScreen = ref(props.entry)
let safetyVideoState = null
const audioState = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const audioBusyID = ref('')
const chatScroller = ref(null)
const chatInput = ref(null)
const retryAction = ref(null)
const recordingAssetID = ref('')
const recordingFinalizingAssetID = ref('')
const profileVoiceStart = ref('record')
const profileVoiceOverride = ref(loadPublishedVoiceClip(accountID))
const entrySurface = ref(null)
const entryPhase = ref(props.animateEntry && props.entry === 'profile' && !props.initialUserId ? 'pending' : 'ready')
const videoPageInstanceID = `social-video-${globalThis.crypto?.randomUUID?.() || Date.now()}`
const mediaPageInstanceID = `social-media-${globalThis.crypto?.randomUUID?.() || Date.now()}`
const videoCallState = ref('idle')
const videoPermissionError = ref('')
const videoPermissionBusy = ref(false)
const callMuted = ref(false)
const callTopicsExpanded = ref(false)
const callCategoryIndex = ref(1)
const callTopicIndex = ref(-1)
const chatCoinDialog = ref('')
const chatTranslationBusy = ref(false)
const chatTranslationError = ref('')
const pendingChatMessage = ref(null)
const translatedChatMessages = ref({})
translatedChatMessages.value = Object.fromEntries(
  translationHistoryStore.getSnapshot().entries
    .filter((entry) => entry.sourceType === 'chat' && entry.messageID && entry.targetLanguage === locale.value)
    .map((entry) => [entry.messageID, entry.translatedText]),
)
const coinStoreReturnScreen = ref('profile')
const pendingAvatarFrameID = ref('')
let profileEntryAnimation = null
let profileEntryFrame = 0
let profileEntryMotionQuery = null
let disposed = false
const publicPeople = Object.freeze(Object.fromEntries(Object.entries(discoveryPeople).map(([id, value]) => [id, toPublicSocialProfile(value)])))
const operationID = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
const person = (id) => publicPeople[id]
const selectedPerson = computed(() => person(selectedUserID.value))
const selectedRelationship = computed(() => snapshot.value.relationshipsByUserID[selectedUserID.value] || store.relationship(selectedUserID.value))
const publicProfileState = computed(() => {
  if (selectedRelationship.value.blockStatus !== 'none') return 'blocked'
  return selectedRelationship.value.friendshipStatus || 'none'
})
const isTestAccount = computed(() => props.user?.isTestAccount === true || accountID === OIVOX_TEST_USER_ID)
const ownVoiceClip = computed(() => profileVoiceOverride.value || props.user?.voiceClip || props.user?.profile?.voiceClip || (isTestAccount.value ? oivoxTestFixtures.profileVoiceClip : null))
const profileListenerUserIDs = computed(() => {
  const accountListenerIDs = props.user?.profile?.listenerUserIDs
  const source = Array.isArray(accountListenerIDs)
    ? accountListenerIDs
    : (isTestAccount.value ? oivoxTestFixtures.profileListenerUserIDs : [])
  return [...new Set(source)].filter((userID) => Boolean(publicPeople[userID]))
})
const profileSummary = computed(() => resolveAccountProfileSummary({
  user: props.user,
  relationshipsByUserID: snapshot.value.relationshipsByUserID,
  translationEntries: translationHistoryStore.getSnapshot().entries,
  heardVoices: heardVoiceSnapshot.value.heardVoices,
  peopleByID: discoveryPeople,
  listenerUserIDs: profileListenerUserIDs.value,
  voiceClips: ownVoiceClip.value ? [ownVoiceClip.value] : [],
  coinBalance: localCoinBalance.value,
}))
const ownProfile = computed(() => ({
  displayName: props.user?.profile?.displayName || props.user?.email?.split('@')[0] || 'OiVox',
  avatar: resolveAccountAvatar(props.user),
  handle: props.user?.profile?.handle || `@${String(accountID).replace(/[^A-Za-z0-9_]/g, '').slice(0, 16).toLowerCase() || 'oivox'}`,
  countryCode: props.user?.profile?.countryCode || '',
  flagAsset: discoveryFlagAssets[props.user?.profile?.countryCode] || '',
  frameLabel: (() => {
    const frame = avatarFrameByID(resolveAvatarFrameID(props.user?.profile))
    return frameCopy.value.names[avatarFrameCatalog.indexOf(frame)] || copy.value.noFrame
  })(),
  verified: props.user?.profile?.verified === true,
  aboutMe: props.user?.profile?.aboutMe || '',
  languages: props.user?.profile?.spokenLanguages || [locale.value],
}))
const ownCallAvatar = computed(() => {
  const profile = props.user?.profile
  const hasPreview = typeof profile?.clientAvatarPreview === 'string' && profile.clientAvatarPreview.startsWith('data:image/')
  const hasPreset = ['portrait-02', 'portrait-03', 'portrait-04', 'portrait-07', 'portrait-09'].includes(profile?.avatarKey)
  return hasPreview || hasPreset ? resolveAccountAvatar(props.user) : ''
})
const activeCallPrompt = computed(() => callTopicIndex.value >= 0
  ? callCopy.value.topics[callTopicIndex.value]
  : callCopy.value.categoryPrompts[callCategoryIndex.value])
const isOwnProfile = computed(() => props.entry === 'profile' && !props.initialUserId && screen.value === 'profile')
const ownVoicePlaying = computed(() => audioState.value.id === ownVoiceClip.value?.id && audioState.value.status === 'playing')
const ownVoicePaused = computed(() => audioState.value.id === ownVoiceClip.value?.id && audioState.value.status === 'paused')
const relationship = (id) => snapshot.value.relationshipsByUserID[id]
const friends = computed(() => Object.values(publicPeople).filter((item) => relationship(item.id)?.friendshipStatus === 'friends' && relationship(item.id)?.blockStatus === 'none'))
const incomingRequests = computed(() => snapshot.value.friendRequests.filter((item) => item.direction === 'incoming' && item.status === 'pending'))
const outgoingRequests = computed(() => snapshot.value.friendRequests.filter((item) => item.direction === 'outgoing' && item.status === 'pending'))
const threads = computed(() => snapshot.value.threads.filter((thread) => store.canMessage(thread.peerUserID)))
const visibleThreads = computed(() => {
  if (messageTab.value === 'voices') return threads.value.filter((thread) => thread.messages.some((message) => message.type === 'voice'))
  return threads.value
})
const messageUnreadCount = computed(() => threads.value.reduce((total, thread) => total + (thread.unreadCount || 0), 0))
const messageHighlightPeople = computed(() => props.discoveryUserIds.map((userID) => publicPeople[userID]).filter(Boolean))
const messageHighlight = computed(() => ({
  newVoicesCount: messageHighlightPeople.value.length,
  countryCount: new Set(messageHighlightPeople.value.map((item) => item.countryCode).filter(Boolean)).size,
}))
const currentThread = computed(() => snapshot.value.threads.find((thread) => thread.peerUserID === selectedUserID.value))
const blockedPeople = computed(() => Object.values(publicPeople)
  .filter((item) => relationship(item.id)?.blockStatus === 'blocked_by_viewer')
  .map((item) => ({ ...item, blockedAt: relationship(item.id)?.blockedAt || '' })))
const pendingRequest = computed(() => snapshot.value.friendRequests.find((item) => item.id === selectedRequestID.value))
const isOwnProfileFlow = computed(() => props.entry === 'profile' && !props.initialUserId)
const profileRouteDirection = ref('forward')
const safetyRouteTransitionName = ref('')
const profileRouteTransitionName = computed(() => safetyRouteTransitionName.value || (isOwnProfileFlow.value ? `ios-page-${profileRouteDirection.value}` : 'social-route-none'))

function profileRouteDepth(route) {
  if (route === 'profile') return 0
  if (route === 'privacy-language') return 2
  if (route === 'coin-store' && coinStoreReturnScreen.value !== 'profile') return 2
  return 1
}

watch(screen, (nextScreen, previousScreen) => {
  if (nextScreen === 'safety') safetyRouteTransitionName.value = 'ios-bottom-page-present'
  else if (previousScreen === 'safety') safetyRouteTransitionName.value = 'ios-bottom-page-dismiss'
  else safetyRouteTransitionName.value = ''
  if (isOwnProfileFlow.value) profileRouteDirection.value = profileRouteDepth(nextScreen) < profileRouteDepth(previousScreen) ? 'back' : 'forward'
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}, { flush: 'sync' })

function clearFeedback(resetRetry = true) { error.value = ''; notice.value = ''; if (resetRetry) retryAction.value = null }
function ownProfileSourceRect() {
  const rect = document.querySelector('.own-profile-photo')?.getBoundingClientRect()
  return rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null
}
function cleanupVideoCall() {
  nativeBridge.cancelPage(videoPageInstanceID)
  videoPermissionBusy.value = false
  videoCallState.value = 'idle'
  videoPermissionError.value = ''
  callMuted.value = false
  callTopicsExpanded.value = false
  callCategoryIndex.value = 1
  callTopicIndex.value = -1
}
function goBack() {
  if (screen.value === 'safety') { closeSafety(); return }
  clearFeedback()
  voicePlaybackService.stop()
  discardRecording()
  if (screen.value === 'video') cleanupVideoCall()
  if (screen.value === props.entry) emit('close', isOwnProfile.value ? { transition: 'profile-return', sourceRect: ownProfileSourceRect() } : {})
  else if (screen.value === 'chat') {
    if (chatReturnScreen.value && chatReturnScreen.value !== 'chat') screen.value = chatReturnScreen.value
    else emit('close')
  }
  else if (props.entry === 'messages' && ['friends', 'requests'].includes(screen.value)) screen.value = 'messages'
  else if (['chat', 'profile', 'safety', 'video', 'request-detail'].includes(screen.value) || (screen.value === 'settings' && returnScreen.value === 'profile')) screen.value = returnScreen.value
  else emit('close')
}
function openOwnSettings() { clearFeedback(); returnScreen.value = 'profile'; screen.value = 'settings' }
function closeOwnSettings() { clearFeedback(); screen.value = 'profile' }
function openPrivacyLanguage() { clearFeedback(); screen.value = 'privacy-language' }
function closePrivacyLanguage() { clearFeedback(); screen.value = 'settings' }
function handleOwnProfileAction(action) {
  clearFeedback()
  if (action === 'edit') { screen.value = 'edit-profile'; return }
  if (action === 'privacy') { openOwnSettings(); return }
  if (action === 'frames') { pendingAvatarFrameID.value = ''; screen.value = 'avatar-frames'; return }
  if (action === 'heard') { screen.value = 'listeners'; return }
  if (action === 'coins') { coinStoreReturnScreen.value = 'profile'; screen.value = 'coin-store'; return }
  if (action === 'record') { profileVoiceStart.value = 'record'; screen.value = 'profile-voice'; return }
  if (action === 'clips') { profileVoiceStart.value = ownVoiceClip.value ? 'preview' : 'record'; screen.value = 'profile-voice'; return }
  notice.value = copy.value.profileActionUnavailable
}
function closeProfileEditor() { clearFeedback(); screen.value = 'profile' }
function applyProfileUpdate(user) { emit('profile-updated', user); clearFeedback(); screen.value = 'profile' }
function applyProfileFrame(value) {
  const user = updateLocalAccountProfile(props.user, { avatarFrameID: value?.id, avatarFrameLabel: value?.label || '' })
  emit('profile-updated', user)
  clearFeedback()
  screen.value = 'profile'
}
function publishProfileVoice(value) {
  profileVoiceOverride.value = value
  emit('voice-published', value)
  clearFeedback()
  screen.value = 'profile'
}
function openProfile(userID) { voicePlaybackService.stop(); discardRecording(); selectedUserID.value = userID; clearFeedback(); returnScreen.value = screen.value; screen.value = 'profile' }
function openSafety(userID, source = 'user') {
  if (screen.value === 'safety') return
  const sourceScreen = screen.value
  voicePlaybackService.stop()
  discardRecording()
  safetyVideoState = sourceScreen === 'video' ? {
    state: videoCallState.value === 'requestingPermissions' ? 'connecting' : videoCallState.value,
    error: videoPermissionBusy.value ? callCopy.value.permissionRequired : videoPermissionError.value,
    muted: callMuted.value,
    category: callCategoryIndex.value,
    topic: callTopicIndex.value,
  } : null
  if (sourceScreen === 'video') cleanupVideoCall()
  selectedUserID.value = userID
  safetySource.value = source
  safetyTransaction.value = null
  clearFeedback()
  // Keep the originating route explicit so Cancel from the video call can
  // never fall through the generic returnScreen/chat history.
  safetyReturnScreen.value = sourceScreen === 'video' ? 'video' : sourceScreen
  screen.value = 'safety'
}
function closeSafety() {
  if (busy.value) return
  clearFeedback()
  restoreSafetySource()
}
function restoreSafetySource() {
  if (safetyReturnScreen.value === 'video' && safetyVideoState) {
    videoCallState.value = safetyVideoState.state
    videoPermissionError.value = safetyVideoState.error
    callMuted.value = safetyVideoState.muted
    callCategoryIndex.value = safetyVideoState.category
    callTopicIndex.value = safetyVideoState.topic
  }
  safetyVideoState = null
  screen.value = safetyReturnScreen.value
}
function openChat(userID) {
  clearFeedback()
  if (!store.canMessage(userID)) { error.value = copy.value.friendsOnly; return }
  selectedUserID.value = userID
  if (screen.value !== 'chat') chatReturnScreen.value = screen.value
  returnScreen.value = screen.value
  screen.value = 'chat'
  const thread = snapshot.value.threads.find((item) => item.peerUserID === userID)
  if (thread?.unreadCount) store.markThreadRead(thread.id, operationID('read'))
  nextTick(() => { if (chatScroller.value) chatScroller.value.scrollTop = chatScroller.value.scrollHeight })
}
async function requestVideoPermissions() {
  if (videoPermissionBusy.value || screen.value !== 'video') return
  videoPermissionBusy.value = true
  videoPermissionError.value = ''
  videoCallState.value = 'requestingPermissions'
  try {
    const microphone = await nativeBridge.requestPermission('microphone', { pageInstanceID: videoPageInstanceID })
    if (screen.value !== 'video') return
    if (!microphone?.granted) {
      videoCallState.value = 'permissionDenied'
      videoPermissionError.value = callCopy.value.permissionRequired
      return
    }
    const camera = await nativeBridge.requestPermission('camera', { pageInstanceID: videoPageInstanceID })
    if (screen.value !== 'video') return
    if (!camera?.granted) {
      videoCallState.value = 'permissionDenied'
      videoPermissionError.value = callCopy.value.permissionRequired
      return
    }
    videoCallState.value = 'connecting'
  } catch (value) {
    if (value?.code === 'PAGE_DISPOSED') return
    videoCallState.value = 'permissionDenied'
    videoPermissionError.value = callCopy.value.permissionRequired
  } finally {
    videoPermissionBusy.value = false
  }
}
function openVideo(userID) {
  clearFeedback()
  if (!store.canMessage(userID)) { error.value = copy.value.friendsOnly; return }
  voicePlaybackService.stop()
  discardRecording()
  selectedUserID.value = userID
  returnScreen.value = screen.value
  screen.value = 'video'
  callCategoryIndex.value = 1
  callTopicIndex.value = -1
  nextTick(requestVideoPermissions)
}
function endVideoCall() { goBack() }
function toggleCallMute() { callMuted.value = !callMuted.value }
function toggleCallTopics() { callTopicsExpanded.value = !callTopicsExpanded.value }
function selectCallCategory(index) {
  callCategoryIndex.value = index
  callTopicIndex.value = -1
}
function selectCallTopic(index) { callTopicIndex.value = index }
function selectQuickReply(value) {
  draft.value = value
  nextTick(() => chatInput.value?.focus())
}
function dismissChatKeyboard(event) {
  if (event.target instanceof Element && event.target.closest('input, textarea, button, [contenteditable="true"]')) return
  chatInput.value?.blur()
}
function chatTranslationSource(message) {
  if (message?.type === 'text' && String(message.text || '').trim()) {
    return { text: message.text.trim(), language: message.language || selectedPerson.value?.languages?.[0] || 'en' }
  }
  const transcript = String(message?.transcript || selectedPerson.value?.voiceClip?.transcript || '').trim()
  if (!transcript) return null
  return { text: transcript, language: message?.transcriptLanguage || selectedPerson.value?.voiceClip?.transcriptLanguage || selectedPerson.value?.languages?.[0] || 'en' }
}
function requestChatTranslation(message) {
  clearFeedback()
  if (translatedChatMessages.value[message?.id]) return
  if (!chatTranslationSource(message)) { notice.value = copy.value.translationUnavailable; return }
  pendingChatMessage.value = message
  chatTranslationError.value = ''
  chatCoinDialog.value = localCoinBalance.value < 5 ? 'insufficient' : 'confirm'
}
function updateCoinBalance(value) {
  if (!Number.isSafeInteger(value) || value < 0) return
  localCoinBalance.value = value
  coinWallet = createCoinWalletStore({ accountID, initialBalance: value })
  emit('coin-balance-changed', value)
}
async function confirmChatTranslation() {
  if (chatTranslationBusy.value || !pendingChatMessage.value) return
  if (localCoinBalance.value < 5) { chatCoinDialog.value = 'insufficient'; return }
  const message = pendingChatMessage.value
  const source = chatTranslationSource(message)
  if (!source) { chatCoinDialog.value = ''; notice.value = copy.value.translationUnavailable; return }
  chatTranslationBusy.value = true
  chatTranslationError.value = ''
  const transactionID = operationID(`chat-translation-${message.id}-${locale.value}`)
  try {
    const result = await nativeBridge.translateText(source.text, source.language, locale.value, { pageInstanceID: 'social-chat-translation', timeout: 120000 })
    if (disposed || !result?.translatedText) throw new Error('TRANSLATION_EMPTY')
    const wallet = coinWallet.spend({ amount: 5, reason: 'chat_translation', transactionID, metadata: { messageID: message.id, userID: selectedUserID.value, targetLanguage: locale.value } })
    try {
      translationHistoryStore.add({
        userID: selectedUserID.value,
        displayName: selectedPerson.value?.displayName || '',
        avatarAsset: selectedPerson.value?.avatarAsset || '',
        flagAsset: selectedPerson.value?.flagAsset || '',
        sourceLanguage: source.language,
        targetLanguage: locale.value,
        originalText: source.text,
        translatedText: result.translatedText,
        createdAt: new Date().toISOString(),
        isFixture: Boolean(result.simulated),
        sourceType: 'chat',
        messageID: message.id,
      }, transactionID)
    } catch (value) {
      const rollback = coinWallet.refund({ amount: 5, reason: 'chat_translation_persist_rollback', transactionID: `${transactionID}-rollback`, relatedTransactionID: transactionID })
      updateCoinBalance(rollback.balance)
      throw value
    }
    translatedChatMessages.value = { ...translatedChatMessages.value, [message.id]: result.translatedText }
    updateCoinBalance(wallet.balance)
    chatCoinDialog.value = ''
    pendingChatMessage.value = null
  } catch (value) {
    if (value instanceof CoinWalletError && value.code === 'INSUFFICIENT_BALANCE') chatCoinDialog.value = 'insufficient'
    else chatTranslationError.value = copy.value.translationFailed
  } finally {
    chatTranslationBusy.value = false
  }
}
function openCoinStore(origin = 'profile', frameID = '') {
  coinStoreReturnScreen.value = origin
  if (frameID) pendingAvatarFrameID.value = frameID
  chatCoinDialog.value = ''
  screen.value = 'coin-store'
}
function closeCoinStore() {
  screen.value = coinStoreReturnScreen.value
  if (coinStoreReturnScreen.value === 'chat' && pendingChatMessage.value) chatCoinDialog.value = localCoinBalance.value >= 5 ? 'confirm' : 'insufficient'
}
function openRequest(requestID) { voicePlaybackService.stop(); selectedRequestID.value = requestID; clearFeedback(); returnScreen.value = screen.value; screen.value = 'request-detail' }

function formatCopy(template, values) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), template)
}
function localizedLanguage(code) {
  try { return new Intl.DisplayNames([locale.value], { type: 'language' }).of(code) || code.toUpperCase() } catch { return code.toUpperCase() }
}
function localizedCountry(code, fallback) {
  try { return new Intl.DisplayNames([locale.value], { type: 'region' }).of(code) || fallback || code } catch { return fallback || code }
}
function readableInterest(value) { return String(value || '').replaceAll('_', ' ') }
function lastThreadMessage(thread) { return thread.messages.at(-1) || null }
function threadPreview(thread) {
  const message = lastThreadMessage(thread)
  if (!message) return copy.value.noMessages
  if (message.type === 'voice') return `${copy.value.voiceMessage} · ${formatVoiceDuration(message.durationMs || 7000)}`
  return message.senderID === accountID ? `${copy.value.youPrefix}: ${message.text}` : message.text
}
function threadTime(thread) {
  const value = lastThreadMessage(thread)?.sentAt
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((dayStart.getTime() - messageDay.getTime()) / 86400000)
  if (days === 0) return new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(date)
  if (days === 1) return copy.value.yesterday
  return new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date)
}
function sharedInterests(item) { return (item.interests || []).slice(0, 2).map(readableInterest).join(', ') }
function requestUser(request) { return person(request?.fromUserID || request?.toUserID) }
function requestTime(request, includeTime = false) {
  const date = new Date(request?.createdAt || '')
  if (Number.isNaN(date.getTime())) return ''
  if (includeTime) return new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(date)
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const requestDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((dayStart.getTime() - requestDay.getTime()) / 86400000)
  if (days === 0) return new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(date)
  if (days === 1) return copy.value.yesterday
  return new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date)
}
function openDiscovery() {
  voicePlaybackService.stop()
  discardRecording()
  emit('open-discovery')
}
function openRequestComposer() {
  if (busy.value || publicProfileState.value !== 'none') return
  clearFeedback()
  requestDraft.value = discoveryCopy.value.requestTemplates[0] || ''
  requestComposerOpen.value = true
}
function closeRequestComposer() {
  if (busy.value) return
  requestComposerOpen.value = false
}
function sendProfileRequest() {
  const note = requestDraft.value.trim()
  if (!note || busy.value || publicProfileState.value !== 'none') return
  run(async () => {
    store.sendFriendRequest(selectedUserID.value, note, operationID('profile-request'))
    requestComposerOpen.value = false
    notice.value = copy.value.requestSent
  })
}
function cancelProfileRequest() {
  if (busy.value || publicProfileState.value !== 'pending_out') return
  run(async () => {
    store.cancelOutgoingRequest(selectedUserID.value, operationID('cancel-profile-request'))
    notice.value = copy.value.requestCancelled
  })
}

async function run(action) {
  if (busy.value) return
  busy.value = true
  clearFeedback(false)
  try { await action(); retryAction.value = null } catch (value) { error.value = value?.message || copy.value.somethingWrong; retryAction.value = action } finally { busy.value = false }
}
function retryLast() { if (retryAction.value) run(retryAction.value); else clearFeedback() }
function resolveRequest(kind, requestID = selectedRequestID.value) {
  if (!requestID || busy.value) return
  selectedRequestID.value = requestID
  run(async () => {
    if (kind === 'accept') store.acceptRequest(requestID, operationID('accept-request'))
    else store.declineRequest(requestID, operationID('decline-request'))
    notice.value = kind === 'accept' ? copy.value.requestAccepted : copy.value.requestDeclined
    if (screen.value === 'request-detail') screen.value = 'requests'
  })
}
function cancelRequest(request) {
  if (!request?.toUserID || busy.value) return
  run(async () => {
    store.cancelOutgoingRequest(request.toUserID, operationID('cancel-request'))
    notice.value = copy.value.requestCancelled
    if (screen.value === 'request-detail') screen.value = 'requests'
  })
}
function sendText() {
  const value = draft.value.trim()
  if (!value || busy.value) return
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
      const permission = await nativeBridge.requestPermission('microphone', { pageInstanceID: mediaPageInstanceID })
      if (!permission?.granted) throw new Error(callCopy.value.voicePermissionRequired)
      const assetID = `chat_voice_${globalThis.crypto?.randomUUID?.() || Date.now()}`
      try {
        await nativeBridge.startVoiceRecording(assetID, { pageInstanceID: mediaPageInstanceID })
      } catch (value) {
        throw new Error(value?.code === 'DEVICE_UNSUPPORTED' ? callCopy.value.voiceRecordingUnavailable : callCopy.value.voiceRecordingFailed)
      }
      recordingAssetID.value = assetID
    })
  }
  return run(async () => {
    const assetID = recordingAssetID.value
    recordingFinalizingAssetID.value = assetID
    try {
      const result = await nativeBridge.stopVoiceRecording(assetID, { pageInstanceID: mediaPageInstanceID })
      await publishChatRecording(assetID, result)
      recordingAssetID.value = ''
    } catch (value) {
      throw new Error(value?.code === 'DEVICE_UNSUPPORTED' ? callCopy.value.voiceRecordingUnavailable : callCopy.value.voiceRecordingFailed)
    } finally {
      recordingFinalizingAssetID.value = ''
    }
  })
}
async function publishChatRecording(assetID, result = {}) {
  const publishedAssetID = result?.assetID || assetID
  await nativeBridge.publishVoiceRecording(publishedAssetID, { pageInstanceID: mediaPageInstanceID })
  const browserClip = nativeBridge.isNative ? null : oivoxTestFixtures.profileVoiceClip
  store.sendVoice(selectedUserID.value, { assetID: publishedAssetID, asset: browserClip?.asset, durationMs: result?.durationMs || 7000 }, operationID('send-voice'))
  await nextTick()
  if (chatScroller.value) chatScroller.value.scrollTop = chatScroller.value.scrollHeight
}
async function handleNativeMediaEvent(event) {
  if (event?.type === 'voice.recordingFinished') {
    const assetID = recordingAssetID.value
    if (!assetID || event.assetID !== assetID || recordingFinalizingAssetID.value) return
    recordingFinalizingAssetID.value = assetID
    busy.value = true
    clearFeedback(false)
    try {
      await publishChatRecording(assetID, event)
      recordingAssetID.value = ''
    } catch {
      recordingAssetID.value = ''
      error.value = callCopy.value.voiceRecordingFailed
      await nativeBridge.discardVoiceRecording(assetID, { pageInstanceID: mediaPageInstanceID }).catch(() => {})
    } finally {
      recordingFinalizingAssetID.value = ''
      busy.value = false
    }
    return
  }
  if (event?.type === 'media.interrupted' && recordingAssetID.value) {
    const assetID = recordingAssetID.value
    recordingAssetID.value = ''
    recordingFinalizingAssetID.value = ''
    error.value = callCopy.value.voiceRecordingInterrupted
    await nativeBridge.discardVoiceRecording(assetID, { pageInstanceID: mediaPageInstanceID }).catch(() => {})
  }
}
function discardRecording() {
  const assetID = recordingAssetID.value
  if (!assetID) return
  recordingAssetID.value = ''
  nativeBridge.discardVoiceRecording(assetID, { pageInstanceID: mediaPageInstanceID }).catch(() => {})
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
async function toggleVoice(message, fallbackClip, heardUserID = '') {
  const clip = playableClip(message, fallbackClip)
  if (!clip?.id || audioBusyID.value) return
  audioBusyID.value = clip.id
  clearFeedback()
  try {
    await voicePlaybackService.play(clip, (value) => { audioState.value = value })
    if (heardUserID && heardUserID !== accountID) {
      const heardPerson = person(heardUserID)
      heardVoiceSnapshot.value = voiceActivityStore.markHeard({ voiceID: clip.id, userID: heardUserID, countryCode: heardPerson?.countryCode || '' })
    }
  } catch {
    error.value = copy.value.somethingWrong
  } finally {
    audioBusyID.value = ''
  }
}
function toggleOwnVoice() {
  if (!ownVoiceClip.value) { notice.value = copy.value.noPublishedVoice; return }
  clearFeedback()
  toggleVoice(null, ownVoiceClip.value, '')
}
async function submitSafetyAction(payload) {
  if (busy.value || !selectedPerson.value) return
  const targetUserID = selectedPerson.value.id
  const transaction = safetyTransaction.value || {
    reportID: operationID('report'),
    blockID: operationID('block'),
  }
  safetyTransaction.value = transaction
  busy.value = true
  clearFeedback(false)
  try {
    const context = {
      details: payload.details,
      targetType: payload.targetType,
      voiceID: payload.voiceID,
      operationID: transaction.reportID,
    }
    await nativeBridge.reportUser(targetUserID, payload.reason, context, { pageInstanceID: 'social-safety' })
    store.reportUser(targetUserID, payload.reason, transaction.reportID, context)
    if (payload.alsoBlock) {
      voicePlaybackService.stop()
      discardRecording()
      await nativeBridge.blockUser(targetUserID, transaction.blockID, { pageInstanceID: 'social-safety' })
      try {
        store.blockUser(targetUserID, transaction.blockID)
      } catch (storeError) {
        await nativeBridge.unblockUser(targetUserID, `${transaction.blockID}-rollback`, { pageInstanceID: 'social-safety' }).catch(() => {})
        throw storeError
      }
      emit('close')
      return
    }
    notice.value = copy.value.reportSaved
    safetyTransaction.value = null
    restoreSafetySource()
  } catch (value) {
    error.value = value?.message || copy.value.somethingWrong
  } finally {
    busy.value = false
  }
}
function unblock(userID) {
  const transactionID = operationID('unblock')
  run(async () => {
    await nativeBridge.unblockUser(userID, transactionID, { pageInstanceID: 'social-safety' })
    store.unblockUser(userID, transactionID)
  })
}

function stopHiddenAudio() {
  if (document.visibilityState === 'hidden') {
    voicePlaybackService.stop()
    discardRecording()
    if (screen.value === 'video') {
      nativeBridge.cancelPage(videoPageInstanceID)
      videoPermissionBusy.value = false
      videoCallState.value = 'paused'
      callTopicsExpanded.value = false
    }
    if (entryPhase.value !== 'ready') completeProfileEntry()
    return
  }
  if (screen.value === 'video' && videoCallState.value === 'paused') nextTick(requestVideoPermissions)
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
    ], { duration: 260, easing: 'cubic-bezier(.18,.76,.2,1)', fill: 'forwards' })
    profileEntryAnimation.finished.catch(() => {}).finally(() => {
      if (!disposed) completeProfileEntry()
    })
  })
}
function handleProfileEntryMotion(event) { if (event.matches && entryPhase.value !== 'ready') completeProfileEntry() }
function handleProfileEntryViewport() { if (entryPhase.value !== 'ready') completeProfileEntry() }
document.addEventListener('visibilitychange', stopHiddenAudio)
const removeNativeMediaListener = nativeBridge.onEvent(handleNativeMediaEvent)
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
  removeNativeMediaListener()
  discardRecording()
  nativeBridge.cancelPage('social-safety')
  nativeBridge.cancelPage('social-chat-translation')
  nativeBridge.cancelPage(mediaPageInstanceID)
  cleanupVideoCall()
  unsubscribe()
  voicePlaybackService.dispose()
})
</script>

<template>
  <Transition :name="profileRouteTransitionName">
  <EditProfilePanel v-if="screen === 'edit-profile'" :user="props.user" :coin-balance="profileSummary.coinBalance" @cancel="closeProfileEditor" @saved="applyProfileUpdate" @open-language="emit('open-language')" @coin-balance-changed="updateCoinBalance" />
  <AvatarFramePanel
    v-else-if="screen === 'avatar-frames'"
    :account-id="accountID"
    :avatar="ownProfile.avatar"
    :initial-balance="profileSummary.coinBalance"
    :initial-frame-id="resolveAvatarFrameID(props.user?.profile)"
    :initial-selection-id="pendingAvatarFrameID"
    @back="screen = 'profile'"
    @selected="applyProfileFrame"
    @open-store="openCoinStore('avatar-frames', $event?.selectedFrameID)"
    @balance-changed="updateCoinBalance"
  />
  <CoinStoreScreen
    v-else-if="screen === 'coin-store'"
    :account-id="accountID"
    :initial-balance="profileSummary.coinBalance"
    @back="closeCoinStore"
    @balance-changed="updateCoinBalance"
  />
  <ProfileListenersScreen v-else-if="screen === 'listeners'" :count="profileSummary.heardByCount" :user-ids="profileListenerUserIDs" @back="screen = 'profile'" />
  <ProfileVoiceFlow
    v-else-if="screen === 'profile-voice'"
    :key="profileVoiceStart"
    :user="props.user"
    :account-id="accountID"
    :avatar="ownProfile.avatar"
    :initial-clip="ownVoiceClip"
    :start-at="profileVoiceStart"
    @back="screen = 'profile'"
    @published="publishProfileVoice"
  />
  <PrivacyAccountPanel
    v-else-if="screen === 'settings'"
    :account-id="accountID"
    :blocked-people="blockedPeople"
    :verified="ownProfile.verified"
    @close="closeOwnSettings"
    @open-language="openPrivacyLanguage"
    @open-store="openCoinStore('settings')"
    @logout="emit('logout')"
    @unblock="unblock"
  />
  <LanguageScreen v-else-if="screen === 'privacy-language'" @back="closePrivacyLanguage" />
  <ReportBlockScreen
    v-else-if="screen === 'safety' && selectedPerson"
    :key="`report-block-${selectedPerson.id}`"
    :person="selectedPerson"
    :busy="busy"
    :error="error"
    :source="safetySource"
    @close="closeSafety"
    @submit="submitSafetyAction"
  />
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
    <header v-else-if="screen === 'profile' && selectedPerson" class="social-nav public-profile-nav">
      <button class="social-icon-button" type="button" :aria-label="copy.back" @click="goBack"><img :src="arrowLeftIcon" alt=""></button>
      <span />
      <button class="social-icon-button" type="button" :aria-label="copy.safety" @click="openSafety(selectedPerson.id)"><img :src="moreIcon" alt=""></button>
    </header>
    <header v-else-if="screen === 'messages'" class="messages-hero">
      <button class="messages-back" type="button" :aria-label="copy.back" @click="goBack"><img :src="arrowLeftIcon" alt=""></button>
      <div class="messages-hero-row">
        <div class="messages-heading-block">
          <div class="messages-title-line"><h1>{{ copy.messages }}</h1><span aria-hidden="true">hi!</span></div>
          <p>{{ copy.stickerSlogan }} <img :src="profileStarIcon" alt=""></p>
        </div>
        <div class="messages-hero-actions">
          <button class="accent" type="button" :aria-label="copy.discoverVoices" @click="openDiscovery"><img :src="globeIcon" alt=""></button>
        </div>
      </div>
    </header>
    <header v-else-if="screen !== 'video'" class="social-nav" :class="{ 'social-chat-nav': screen === 'chat' }">
      <button class="social-icon-button" type="button" :aria-label="copy.back" @click="goBack">
        <img :src="arrowLeftIcon" alt="">
      </button>
      <div v-if="screen === 'chat' && selectedPerson" class="social-chat-title">
        <span class="social-chat-avatar"><img :src="selectedPerson.avatarAsset" alt=""><img v-if="selectedPerson.flagAsset" :src="selectedPerson.flagAsset" alt=""></span>
        <span><strong>{{ selectedPerson.displayName }}</strong><small>{{ localizedCountry(selectedPerson.countryCode, selectedPerson.countryLabel) }} · {{ copy.online }}</small></span>
      </div>
      <h1 v-else>{{ screen === 'requests' ? copy.requests : screen === 'request-detail' ? copy.requestTitle : screen === 'friends' ? copy.friends : screen === 'profile' ? (isOwnProfile ? copy.profile : selectedPerson?.displayName || copy.profile) : screen === 'safety' ? copy.safety : screen === 'video' ? copy.videoTitle : copy.settings }}</h1>
      <div v-if="screen === 'chat'" class="social-nav-actions">
        <button class="social-icon-button chat-nav-slice" type="button" :aria-label="copy.videoCall" @click="openVideo(selectedUserID)"><img :src="chatVideoCallImage" alt=""></button>
        <button class="social-icon-button chat-nav-slice" type="button" :aria-label="copy.safety" @click="openSafety(selectedUserID)"><img :src="chatMoreImage" alt=""></button>
      </div>
      <button v-else-if="screen === 'request-detail' && pendingRequest" class="request-report-button" type="button" @click="openSafety(requestUser(pendingRequest).id)">{{ copy.report }}</button>
      <span v-else class="social-nav-spacer" />
    </header>

    <p v-if="error && screen !== 'video'" class="social-banner error" role="alert">{{ error }} <button type="button" @click="retryLast">{{ copy.retry }}</button></p>
    <p v-if="notice && screen !== 'video'" class="social-banner" role="status">{{ notice }}</p>

    <section v-if="screen === 'requests'" class="social-scroll requests-page">
      <div class="request-section-heading">
        <h2>{{ copy.waitingForYou }}</h2><span>{{ incomingRequests.length }}</span>
      </div>
      <div v-if="incomingRequests.length" class="request-list incoming-request-list">
        <article v-for="request in incomingRequests" :key="request.id" class="request-card">
          <button class="request-card-open" type="button" :aria-label="`${copy.open} ${requestUser(request).displayName}`" @click="openRequest(request.id)">
            <span class="request-avatar"><img :src="requestUser(request).avatarAsset" alt=""><img v-if="requestUser(request).flagAsset" class="request-flag" :src="requestUser(request).flagAsset" alt=""></span>
            <span class="request-card-copy">
              <span class="request-card-heading"><strong>{{ requestUser(request).displayName }}</strong><time>{{ requestTime(request) }}</time></span>
              <span class="request-note" dir="auto">{{ request.note }}</span>
              <span v-if="sharedInterests(requestUser(request))" class="request-shared">{{ sharedInterests(requestUser(request)) }}</span>
            </span>
          </button>
          <div class="request-card-actions">
            <button type="button" :disabled="busy" @click.stop="resolveRequest('decline', request.id)">{{ copy.decline }}</button>
            <button class="primary" type="button" :disabled="busy" @click.stop="resolveRequest('accept', request.id)"><img :src="checkIcon" alt="">{{ copy.accept }}</button>
          </div>
        </article>
      </div>
      <div v-else class="request-empty"><p>{{ copy.noRequests }}</p></div>

      <h2 v-if="outgoingRequests.length" class="request-sent-heading">{{ copy.sentByYou }}</h2>
      <div v-if="outgoingRequests.length" class="sent-request-list">
        <article v-for="request in outgoingRequests" :key="request.id" class="sent-request-card">
          <button class="sent-request-open" type="button" :aria-label="`${copy.open} ${requestUser(request).displayName}`" @click="openRequest(request.id)">
            <span class="request-avatar compact"><img :src="requestUser(request).avatarAsset" alt=""><img v-if="requestUser(request).flagAsset" class="request-flag" :src="requestUser(request).flagAsset" alt=""></span>
            <span><strong>{{ requestUser(request).displayName }}</strong><small>{{ formatCopy(copy.waitingSince, { time: requestTime(request, true) }) }}</small></span>
          </button>
          <span class="request-pending">{{ copy.pending }}</span>
          <button class="request-cancel" type="button" :disabled="busy" @click.stop="cancelRequest(request)">{{ copy.cancel }}</button>
        </article>
      </div>
      <p class="request-safety-note"><img :src="profileNoteShieldIcon" alt="">{{ copy.requestsExpire }}</p>
    </section>

    <section v-else-if="screen === 'request-detail' && pendingRequest" class="social-scroll request-detail">
      <article class="request-profile-card">
        <button class="request-profile-identity" type="button" @click="openProfile(requestUser(pendingRequest).id)">
          <span class="request-profile-avatar"><img :src="requestUser(pendingRequest).avatarAsset" alt=""><img v-if="requestUser(pendingRequest).flagAsset" :src="requestUser(pendingRequest).flagAsset" alt=""></span>
          <strong>{{ requestUser(pendingRequest).displayName }}</strong>
          <small>{{ localizedCountry(requestUser(pendingRequest).countryCode, requestUser(pendingRequest).countryLabel) }} · {{ requestUser(pendingRequest).timezone }}</small>
        </button>
        <button
          class="request-voice-row"
          :class="{ playing: voiceIsPlaying(requestUser(pendingRequest).voiceClip.id), paused: voiceIsPaused(requestUser(pendingRequest).voiceClip.id), active: voiceIsActive(requestUser(pendingRequest).voiceClip.id) }"
          type="button"
          :disabled="Boolean(audioBusyID)"
          :aria-label="voiceIsPlaying(requestUser(pendingRequest).voiceClip.id) ? copy.pause : copy.play"
          @click="toggleVoice(null, requestUser(pendingRequest).voiceClip, requestUser(pendingRequest).id)"
        ><span class="request-play"><img :src="voiceIsPlaying(requestUser(pendingRequest).voiceClip.id) ? pauseIcon : playIcon" alt=""></span><span class="request-wave audio-progress-wave" :style="{ '--voice-progress': voiceProgress(requestUser(pendingRequest).voiceClip) }"><i v-for="height in [9,16,23,13,29,18,11,25,15,31,19,12,26,17,22,10]" :key="height" :style="{ height: `${height}px` }" /></span><b>{{ voiceRemaining(requestUser(pendingRequest).voiceClip) }}</b></button>
        <section class="request-introduction"><h2>{{ copy.theirIntroduction }}</h2><p dir="auto">“{{ pendingRequest.note }}”</p></section>
        <div class="request-detail-tags"><span v-if="sharedInterests(requestUser(pendingRequest))">{{ formatCopy(copy.sharedInterestsCount, { count: requestUser(pendingRequest).interests?.length || 0 }) }}</span><span>{{ copy.verifiedVoice }}</span></div>
      </article>
      <div v-if="pendingRequest.direction === 'incoming'" class="request-actions">
        <button type="button" :disabled="busy" @click="resolveRequest('decline')">{{ copy.decline }}</button>
        <button class="primary" type="button" :disabled="busy" @click="resolveRequest('accept')"><img :src="checkIcon" alt="">{{ copy.accept }}</button>
        <p>{{ copy.acceptingUnlocks }}</p>
      </div>
      <div v-else class="request-actions request-actions-outgoing">
        <p>{{ copy.pending }}</p>
        <button type="button" :disabled="busy" @click="cancelRequest(pendingRequest)">{{ copy.cancel }}</button>
      </div>
    </section>

    <section v-else-if="screen === 'friends'" class="social-scroll friends-page">
      <div v-if="friends.length" class="friend-list">
        <article v-for="item in friends" :key="item.id" class="friend-card">
          <div class="friend-card-main">
            <button class="friend-identity" type="button" @click="openProfile(item.id)">
              <span class="friend-avatar"><img :src="item.avatarAsset" alt=""><img v-if="item.flagAsset" class="friend-flag" :src="item.flagAsset" alt=""></span>
              <span><strong>{{ item.displayName }}</strong><small>{{ localizedCountry(item.countryCode, item.countryLabel) }} · {{ item.timezone }}</small><em v-if="sharedInterests(item)">{{ copy.sharedInterests }}: {{ sharedInterests(item) }}</em></span>
            </button>
            <button class="friend-more" type="button" :aria-label="copy.safety" @click="openSafety(item.id)"><img :src="moreIcon" alt=""></button>
          </div>
          <div class="friend-actions"><button type="button" @click="openChat(item.id)"><img :src="messageIcon" alt="">{{ copy.message }}</button><button class="primary" type="button" @click="openVideo(item.id)"><img :src="videoCallIcon" alt="">{{ copy.videoCall }}</button></div>
        </article>
      </div>
      <div v-else class="social-empty"><span class="empty-rings" /><h2>{{ copy.noFriends }}</h2></div>
      <p class="social-safety-note"><img :src="profileNoteShieldIcon" alt="">{{ copy.keepInsideApp }}</p>
    </section>

    <section v-else-if="screen === 'messages'" class="social-scroll messages-page">
      <div class="message-controls">
        <div class="message-tabs" role="tablist" :aria-label="copy.messages">
          <button :class="{ active: messageTab === 'chats' }" type="button" role="tab" :aria-selected="messageTab === 'chats'" @click="messageTab = 'chats'">{{ copy.chats }} <b v-if="messageUnreadCount">{{ messageUnreadCount }}</b></button>
          <button :class="{ active: messageTab === 'voices' }" type="button" role="tab" :aria-selected="messageTab === 'voices'" @click="messageTab = 'voices'">{{ copy.voices }}</button>
          <button type="button" role="tab" aria-selected="false" @click="screen = 'friends'">{{ copy.friends }}</button>
        </div>
        <button class="message-requests" type="button" @click="screen = 'requests'">{{ copy.requests }}</button>
      </div>
      <div v-if="visibleThreads.length" class="thread-list">
        <button v-for="thread in visibleThreads" :key="thread.id" type="button" class="thread-card" :class="{ unread: thread.unreadCount }" @click="openChat(thread.peerUserID)">
          <span class="thread-avatar"><img :src="person(thread.peerUserID).avatarAsset" alt=""><img v-if="person(thread.peerUserID).flagAsset" class="thread-flag" :src="person(thread.peerUserID).flagAsset" alt=""></span>
          <span class="thread-copy"><span class="thread-heading"><strong>{{ person(thread.peerUserID).displayName }}</strong><time>{{ threadTime(thread) }}</time></span><small :class="{ voice: lastThreadMessage(thread)?.type === 'voice' }"><span v-if="lastThreadMessage(thread)?.type === 'voice'" class="thread-wave" aria-hidden="true"><i v-for="height in [5,9,14,7,17,11,6,15,8,12,5,10]" :key="height" :style="{ height: `${height}px` }" /></span>{{ threadPreview(thread) }}</small></span><b v-if="thread.unreadCount">{{ thread.unreadCount }}</b>
        </button>
      </div>
      <div v-else class="social-empty"><span class="empty-rings" /><h2>{{ copy.noMessages }}</h2></div>
      <button class="new-voices-card" type="button" @click="openDiscovery"><span><strong>{{ messageHighlight.newVoicesCount }} {{ copy.newVoices }}</strong><small>{{ formatCopy(copy.newVoicesDetail, { count: messageHighlight.countryCount }) }}</small></span><img :src="playIcon" alt=""></button>
      <p class="social-safety-note"><img :src="profileNoteShieldIcon" alt="">{{ copy.mutualFriendsOnly }}</p>
    </section>

    <section v-else-if="screen === 'chat' && selectedPerson" ref="chatScroller" class="social-scroll chat-page" @pointerdown="dismissChatKeyboard">
      <p class="friend-gate"><img v-if="selectedPerson.flagAsset" :src="selectedPerson.flagAsset" alt=""><span>{{ copy.likedVoice }}</span></p>
      <div class="message-stream">
        <div v-for="messageItem in (currentThread?.messages || [])" :key="messageItem.id" class="message-row" :class="{ mine: messageItem.senderID === accountID }">
          <article class="message-bubble" :class="{ mine: messageItem.senderID === accountID, voice: messageItem.type === 'voice' }">
            <p v-if="messageItem.type === 'text'">{{ messageItem.text }}</p>
            <button v-else type="button" :class="{ playing: voiceIsPlaying(messageItem.id), paused: voiceIsPaused(messageItem.id), active: voiceIsActive(messageItem.id) }" :disabled="Boolean(audioBusyID)" @click="toggleVoice(messageItem, null, messageItem.senderID === accountID ? '' : selectedUserID)"><span class="play-triangle" :class="{ pause: voiceIsPlaying(messageItem.id) }" /><span class="wave-bars audio-progress-wave" :style="{ '--voice-progress': voiceProgress(playableClip(messageItem)) }"><i v-for="height in [4,9,14,11,16,13,8,15,10,6,13]" :key="height" :style="{ height: `${height}px` }" /></span><b>{{ voiceRemaining(playableClip(messageItem)) }}</b></button>
          </article>
          <p v-if="translatedChatMessages[messageItem.id]" class="chat-translated-text"><strong>{{ copy.translated }}</strong><span>{{ translatedChatMessages[messageItem.id] }}</span></p>
          <button v-if="messageItem.senderID !== accountID && !translatedChatMessages[messageItem.id]" class="chat-translate" type="button" :disabled="chatTranslationBusy" @click="requestChatTranslation(messageItem)"><img :src="chatTranslateImage" alt=""><strong>{{ copy.translate }}</strong><img :src="chatCoinImage" alt=""><b>{{ copy.translationCost }}</b></button>
        </div>
      </div>
      <div class="chat-quick-replies" role="list" :aria-label="copy.typeMessage">
        <button v-for="item in copy.chatQuickReplies" :key="item" type="button" role="listitem" @click="selectQuickReply(item)">{{ item }}</button>
      </div>
      <div class="chat-composer">
        <input ref="chatInput" v-model="draft" :placeholder="copy.typeMessage" maxlength="500" @keyup.enter.prevent="sendText">
        <button class="chat-composer-slice" :class="{ recording: recordingAssetID }" type="button" :aria-label="copy.sendVoice" :aria-pressed="Boolean(recordingAssetID)" :disabled="busy" @click="toggleRecording"><img :src="chatMicImage" alt=""></button>
        <button class="chat-composer-slice" type="button" :aria-label="copy.send" :disabled="busy || !draft.trim()" @click="sendText"><img :src="chatSendImage" alt=""></button>
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
        <p class="own-profile-sticky"><strong>{{ profileSummary.translatedCountryCount }} {{ copy.countriesTranslated }}</strong><span>♡</span></p>
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
        <div><dt>{{ profileSummary.translatedCountryCount }}</dt><dd>{{ copy.countries }}</dd></div>
        <div><dt>{{ profileSummary.friendsCount }}</dt><dd>{{ copy.friendsStat }}</dd></div>
        <div><dt>{{ profileSummary.voicesHeardCount }}</dt><dd>{{ copy.voicesStat }}</dd></div>
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

    <section v-else-if="screen === 'profile' && selectedPerson" class="social-scroll profile-page public-profile-page">
      <div class="public-profile-collage" aria-hidden="true">
        <span class="public-profile-tape" />
        <div class="public-profile-polaroid"><img :src="selectedPerson.avatarAsset" alt=""></div>
        <p class="public-profile-sticky">{{ formatCopy(copy.peopleHeard, { count: selectedPerson.heardCount }) }}</p>
        <img class="public-profile-star" :src="profileStarIcon" alt="">
      </div>

      <div class="public-profile-identity">
        <h1>{{ selectedPerson.displayName }}</h1>
        <span v-if="selectedPerson.verified" class="public-profile-verified"><img :src="profileVerifiedIcon" alt="">{{ copy.verified }}</span>
        <span v-if="publicProfileState === 'friends'" class="public-profile-friend">{{ copy.friendBadge }}</span>
        <p><img v-if="selectedPerson.flagAsset" :src="selectedPerson.flagAsset" alt="">{{ localizedCountry(selectedPerson.countryCode, selectedPerson.countryLabel) }} · {{ selectedPerson.timezone }}</p>
      </div>

      <article v-if="selectedPerson.voiceClip" class="public-profile-voice" :class="{ playing: voiceIsPlaying(selectedPerson.voiceClip.id), paused: voiceIsPaused(selectedPerson.voiceClip.id), active: voiceIsActive(selectedPerson.voiceClip.id) }">
        <button type="button" :aria-label="voiceIsPlaying(selectedPerson.voiceClip.id) ? copy.pause : copy.play" :disabled="Boolean(audioBusyID)" @click="toggleVoice(null, selectedPerson.voiceClip, selectedPerson.id)"><img :src="voiceIsPlaying(selectedPerson.voiceClip.id) ? pauseIcon : playIcon" alt=""></button>
        <div><strong>{{ copy.theirSevenSeconds }}</strong><span class="public-profile-wave audio-progress-wave" :style="{ '--voice-progress': voiceProgress(selectedPerson.voiceClip) }" aria-hidden="true"><i v-for="(height, index) in [7, 15, 22, 12, 25, 18, 9, 20, 14, 23, 11, 18, 8, 16, 21, 10, 18, 13]" :key="index" :style="{ height: `${height}px` }" /></span></div>
        <span class="public-profile-voice-cost"><img :src="sparkleIcon" alt="">5</span>
      </article>

      <article v-if="selectedPerson.aboutMe" class="public-profile-card public-profile-about"><h2>{{ copy.about }}</h2><p>{{ selectedPerson.aboutMe }}</p></article>
      <article class="public-profile-card public-profile-details">
        <section v-if="selectedPerson.languages?.length"><h2>{{ copy.languages }}</h2><p>{{ selectedPerson.languages.map(localizedLanguage).join(' · ') }}</p></section>
        <section v-if="selectedPerson.interests?.length"><h2>{{ copy.interests }}</h2><div class="public-profile-tags"><span v-for="item in selectedPerson.interests" :key="item">{{ readableInterest(item) }}</span></div></section>
      </article>
      <p class="public-profile-privacy"><img :src="profileNoteShieldIcon" alt=""><span>{{ copy.publicPrivacy }}</span></p>

      <div class="public-profile-actions" :class="`state-${publicProfileState}`">
        <button v-if="publicProfileState === 'none'" class="public-profile-primary" type="button" :disabled="busy" @click="openRequestComposer"><img :src="personAddIcon" alt="">{{ copy.sendRequest }}</button>
        <template v-else-if="publicProfileState === 'pending_out'">
          <button class="public-profile-waiting" type="button" disabled><img :src="waitingIcon" alt="">{{ copy.waitingApproval }}</button>
          <button class="public-profile-cancel" type="button" :disabled="busy" @click="cancelProfileRequest">{{ copy.cancel }}</button>
        </template>
        <template v-else-if="publicProfileState === 'friends'">
          <button class="public-profile-primary" type="button" :disabled="busy" @click="openChat(selectedPerson.id)"><img :src="messageIcon" alt="">{{ copy.message }}</button>
          <button class="public-profile-video" type="button" :disabled="busy" :aria-label="copy.videoCall" @click="openVideo(selectedPerson.id)"><img :src="videoCallIcon" alt=""></button>
        </template>
      </div>
    </section>

    <section v-else-if="screen === 'video' && selectedPerson" class="video-call-page" :aria-busy="videoPermissionBusy">
      <img class="video-call-background" :src="selectedPerson.avatarAsset" alt="">
      <span class="video-call-shade" aria-hidden="true" />

      <header class="video-call-header">
        <div class="video-call-person">
          <span><img :src="selectedPerson.avatarAsset" alt=""><img v-if="selectedPerson.flagAsset" :src="selectedPerson.flagAsset" alt=""></span>
          <strong>{{ selectedPerson.displayName }}</strong>
        </div>
        <div class="video-call-safety">
          <button type="button" @click="openSafety(selectedPerson.id, 'video-call')">{{ callCopy.report }}</button>
          <button type="button" @click="openSafety(selectedPerson.id, 'video-call')">{{ callCopy.block }}</button>
        </div>
      </header>

      <nav class="video-call-categories" :aria-label="callCopy.topicIdeas">
        <button v-for="(item, index) in callCopy.categories" :key="item" type="button" :class="{ active: callCategoryIndex === index }" :aria-pressed="callCategoryIndex === index" @click="selectCallCategory(index)">{{ item }}</button>
      </nav>

      <div class="video-call-connecting" role="status">{{ callCopy.connecting }}</div>

      <div class="video-call-self" :class="{ empty: !ownCallAvatar }">
        <img v-if="ownCallAvatar" :src="ownCallAvatar" alt="">
        <small>{{ ownProfile.displayName }}</small>
      </div>

      <div v-if="videoPermissionError" class="video-call-permission" role="alert">
        <span>{{ videoPermissionError }}</span>
        <button type="button" :disabled="videoPermissionBusy" @click="requestVideoPermissions">{{ callCopy.permissionRetry }}</button>
      </div>

      <button class="video-call-prompt" type="button" :aria-expanded="callTopicsExpanded" @click="toggleCallTopics">
        <small>{{ callCopy.aiPrompt }}</small>
        <strong>{{ activeCallPrompt }}</strong>
      </button>

      <div class="video-call-controls">
        <button type="button" :class="{ active: callMuted }" :aria-pressed="callMuted" @click="toggleCallMute"><img :src="callMuteImage" alt=""><span>{{ callMuted ? callCopy.unmute : callCopy.mute }}</span></button>
        <button type="button" @click="endVideoCall"><img class="end" :src="callEndImage" alt=""><span>{{ callCopy.end }}</span></button>
        <button type="button" :aria-expanded="callTopicsExpanded" @click="toggleCallTopics"><img :src="callTopicsImage" alt=""><span>{{ callCopy.aiTopics }}</span></button>
      </div>
      <p class="video-call-footer">{{ callCopy.mutualOnly }}</p>

      <Transition name="ios-sheet">
        <div v-if="callTopicsExpanded" class="video-topic-backdrop" role="presentation" @pointerdown.self="toggleCallTopics">
          <section class="video-topic-sheet" role="dialog" aria-modal="true" :aria-label="callCopy.topicIdeas">
            <span class="video-topic-handle" aria-hidden="true" />
            <img v-if="locale === 'en'" class="video-topic-strip" :src="callTopicStripImage" alt="Topic ideas · Free in calls">
            <header v-else><h2>{{ callCopy.topicIdeas }}</h2><b>{{ callCopy.freeInCalls }}</b></header>
            <p>{{ callCopy.topicHint }}</p>
            <div class="video-topic-list">
              <button v-for="(item, index) in callCopy.topics" :key="item" type="button" :class="{ active: callTopicIndex === index }" :aria-pressed="callTopicIndex === index" @click="selectCallTopic(index)"><span>{{ item }}</span><img v-if="callTopicIndex === index" :src="checkIcon" alt=""></button>
            </div>
            <button class="video-topic-done" type="button" @click="toggleCallTopics">{{ callCopy.done }}</button>
          </section>
        </div>
      </Transition>
    </section>

    <CoinSpendDialog
      v-if="chatCoinDialog"
      :mode="chatCoinDialog"
      :title="chatCoinDialog === 'confirm' ? copy.translationConfirmTitle : copy.translationInsufficientTitle"
      :body="chatCoinDialog === 'confirm' ? copy.translationConfirmBody : copy.translationInsufficientBody.replace('{amount}', Math.max(0, 5 - localCoinBalance))"
      :cost="5"
      :balance="localCoinBalance"
      :cost-label="copy.cost"
      :balance-label="copy.balance"
      :after-label="copy.after"
      :short-by-label="copy.shortBy"
      :cancel-label="copy.cancel"
      :confirm-label="copy.confirmTranslation"
      :get-coins-label="copy.getCoins"
      :busy-label="copy.translating"
      :note="copy.translationNote"
      :error="chatTranslationError"
      :busy="chatTranslationBusy"
      @close="chatCoinDialog = ''"
      @confirm="confirmChatTranslation"
      @get-coins="openCoinStore('chat')"
    />

    <Transition name="ios-sheet">
    <div v-if="requestComposerOpen && selectedPerson" class="public-request-backdrop" role="presentation" @pointerdown.self="closeRequestComposer">
      <section class="public-request-sheet" role="dialog" aria-modal="true" :aria-label="discoveryCopy.requestTitle">
        <span class="public-request-handle" aria-hidden="true" />
        <header><img :src="selectedPerson.avatarAsset" alt=""><div><h2>{{ selectedPerson.displayName }}</h2><p><img v-if="selectedPerson.flagAsset" :src="selectedPerson.flagAsset" alt="">{{ localizedCountry(selectedPerson.countryCode, selectedPerson.countryLabel) }} · {{ selectedPerson.languages.map(localizedLanguage).join(' · ') }}</p></div></header>
        <label for="public-request-note">{{ discoveryCopy.requestTitle }}</label>
        <div class="public-request-input"><textarea id="public-request-note" v-model="requestDraft" maxlength="200" :placeholder="discoveryCopy.requestPlaceholder"></textarea><small>{{ requestDraft.length }} / 200</small></div>
        <div class="public-request-templates"><button v-for="template in discoveryCopy.requestTemplates" :key="template" type="button" :class="{ active: requestDraft === template }" @click="requestDraft = template">{{ template }}</button></div>
        <button class="public-request-send" type="button" :disabled="busy || !requestDraft.trim()" @click="sendProfileRequest"><img :src="personAddIcon" alt="">{{ copy.sendRequest }}</button>
        <button class="public-request-cancel" type="button" :disabled="busy" @click="closeRequestComposer">{{ copy.cancel }}</button>
        <p>{{ discoveryCopy.requestHint }}</p>
      </section>
    </div>
    </Transition>
    </div>
  </main>
  </Transition>
</template>
