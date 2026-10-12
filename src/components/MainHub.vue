<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import coinIcon from '../assets/coin.png'
import chevronRightIcon from '../assets/icons/hub-chevron-right.svg'
import chatIcon from '../assets/icons/hub-chat.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import { discoveryPeople } from '../data/discoveryFixtures'
import { discoveryCardPackContent } from '../data/discoveryCommerceContent'
import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { registrationContent } from '../data/registrationContent'
import { socialContent } from '../data/socialContent'
import { useI18n } from '../i18n'
import { resolveAccountAvatar, resolveAccountCoinBalance } from '../services/accountPresentation'
import { createCoinWalletStore } from '../services/coinWalletStore'
import { createDiscoveryStore } from '../services/discoveryStore'
import { createSocialStore } from '../services/socialStore'
import { createVoiceActivityStore } from '../services/voiceActivityStore'
import { isVoiceEarthUnlocked } from '../services/voiceEarthAccess'
import { EMPTY_VOICE_PLAYBACK_STATE, formatVoiceDuration, voicePlaybackProgress, voicePlaybackRemainingMs, voicePlaybackService } from '../services/voicePlaybackService'
import SocialModule from './SocialModule.vue'
import CoinStoreScreen from './CoinStoreScreen.vue'
import MainHubIntro from './MainHubIntro.vue'
import VoiceDiscoveryEntryTransition from './VoiceDiscoveryEntryTransition.vue'
import VoiceDiscoveryReturnTransition from './VoiceDiscoveryReturnTransition.vue'
import VoiceEarthScreen from './VoiceEarthScreen.vue'
import VoiceEarthLockedScreen from './VoiceEarthLockedScreen.vue'
import VoiceDiscoveryScreen from './VoiceDiscoveryScreen.vue'
import UserProfileEntryTransition from './UserProfileEntryTransition.vue'
import UserProfileReturnTransition from './UserProfileReturnTransition.vue'

const props = defineProps({
  user: { type: Object, default: null },
  playIntro: { type: Boolean, default: false },
})
const emit = defineEmits(['open-language', 'logout', 'profile-updated', 'intro-complete'])
const { locale } = useI18n()
const copy = computed(() => postRegistrationContent(locale.value))
const lockedCopy = computed(() => registrationContent(locale.value))
const socialCopy = computed(() => socialContent(locale.value))
const cardPackCopy = computed(() => discoveryCardPackContent(locale.value))

const activeSocial = ref('')
const selectedUserID = ref('')
const discoveryUserID = ref('')
const discoveryTransitionUserID = ref('')
const discoveryReturnState = ref(null)
const discoveryEntryAnimated = ref(false)
const profileTransitionActive = ref(false)
const profileReturnState = ref(null)
const profileEntryAnimated = ref(false)
const utilityRouteKind = ref('')
const utilityRouteDirection = ref('forward')
const utilityRouteBusy = ref(false)
const coinButton = ref(null)
const messagesButton = ref(null)
const seeAllButton = ref(null)
const voiceEarthActive = ref(false)
const voiceEarthLockedActive = ref(false)
const audioState = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const audioError = ref(false)
const audioBusy = ref(false)
const NEW_VOICE_TAP_DISTANCE = 10
const NEW_VOICE_SYNTHETIC_CLICK_WINDOW = 700
let newVoicePointer = null
let lastNewVoiceTouchEnd = 0

const discoveryTransitionVoice = computed(() => discoveryPeople[discoveryTransitionUserID.value] || null)
const discoveryReturnVoice = computed(() => discoveryPeople[discoveryReturnState.value?.userID] || null)
const accountID = props.user?.id || props.user?.userID || OIVOX_TEST_USER_ID
const SEE_ALL_GUIDE_KEY = 'oivox.mainHubSeeAllGuide.v1'
const guideCopyByLocale = Object.freeze({
  en: { skip: 'Skip tour', message: 'Tap “See all” to open the voice globe', gotIt: 'Got it' },
  ar: { skip: 'تخطي الجولة', message: 'اضغط على «عرض الكل» لفتح عالم الأصوات', gotIt: 'فهمت' },
  he: { skip: 'דלג על הסיור', message: 'הקישו על „הצגת הכול” כדי לפתוח את עולם הקולות', gotIt: 'הבנתי' },
  tr: { skip: 'Turu atla', message: 'Ses küresini açmak için “Tümünü gör”e dokun', gotIt: 'Anladım' },
  fr: { skip: 'Passer la visite', message: 'Touchez « Tout voir » pour ouvrir le globe vocal', gotIt: 'Compris' },
  de: { skip: 'Tour überspringen', message: 'Tippe auf „Alle ansehen“, um die Stimmenkugel zu öffnen', gotIt: 'Verstanden' },
  ja: { skip: 'ツアーをスキップ', message: '「すべて見る」をタップしてボイスグローブを開く', gotIt: 'わかりました' },
  ko: { skip: '둘러보기 건너뛰기', message: '보이스 글로브를 열려면 “모두 보기”를 탭하세요', gotIt: '알겠어요' },
})
const introPreviewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'hub-intro'
const titleWords = computed(() => copy.value.mainTitle.trim().split(/\s+/).filter(Boolean))
const introActive = ref(props.playIntro || introPreviewMode)
const introReady = ref(!introActive.value)
const seeAllGuideActive = ref(false)
const seeAllGuideTarget = ref({ top: 0, left: 0, width: 0, height: 0 })
const seeAllGuideCopy = computed(() => guideCopyByLocale[locale.value] || guideCopyByLocale.en)
const seeAllGuideStorageKey = `${SEE_ALL_GUIDE_KEY}:${accountID}`
const seeAllGuideStyle = computed(() => ({
  '--guide-target-top': `${seeAllGuideTarget.value.top}px`,
  '--guide-target-left': `${seeAllGuideTarget.value.left}px`,
  '--guide-target-width': `${seeAllGuideTarget.value.width}px`,
  '--guide-target-height': `${seeAllGuideTarget.value.height}px`,
  '--guide-target-center': `${seeAllGuideTarget.value.left + seeAllGuideTarget.value.width / 2}px`,
}))

function hasSeenSeeAllGuide() {
  try { return localStorage.getItem(seeAllGuideStorageKey) === 'seen' } catch { return false }
}

function markSeeAllGuideSeen() {
  seeAllGuideActive.value = false
  try { localStorage.setItem(seeAllGuideStorageKey, 'seen') } catch { /* storage may be unavailable in private WebViews */ }
}

function showSeeAllGuideIfNeeded() {
  if (hasSeenSeeAllGuide()) return
  nextTick(() => {
    seeAllButton.value?.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'auto' })
    requestAnimationFrame(() => {
      updateSeeAllGuideTarget()
      seeAllGuideActive.value = true
    })
  })
}

function updateSeeAllGuideTarget() {
  const rect = seeAllButton.value?.getBoundingClientRect?.()
  if (!rect) return
  seeAllGuideTarget.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
}
const socialStore = createSocialStore({ accountID })
const socialSnapshot = ref(socialStore.getSnapshot())
const unreadMessageCount = computed(() => socialSnapshot.value.threads.reduce((total, thread) => total + thread.unreadCount, 0))
let coinWallet = createCoinWalletStore({ accountID, initialBalance: resolveAccountCoinBalance(props.user) })
const coinBalance = ref(coinWallet.getSnapshot().balance)
const discoveryStore = createDiscoveryStore({ accountID, relationshipsByUserID: socialSnapshot.value.relationshipsByUserID })
const discoverySnapshot = ref(discoveryStore.getSnapshot(coinWallet.getSnapshot(), socialSnapshot.value.relationshipsByUserID))
const availableDiscoveryUserIDs = computed(() => discoverySnapshot.value.remainingUserIDs.filter((id) => Boolean(discoveryPeople[id])))
const dailyVoiceIDs = computed(() => discoverySnapshot.value.allocatedUserIDs.filter((id) => Boolean(discoveryPeople[id])).slice(0, 7))
const dailyVoices = computed(() => dailyVoiceIDs.value.map((id) => discoveryPeople[id]).filter(Boolean))
const earthVoices = computed(() => discoverySnapshot.value.earthUserIDs.map((id) => discoveryPeople[id]).filter(Boolean))
const voiceEarthUnlocked = ref(isVoiceEarthUnlocked({ accountID, user: props.user }))
const heroPrimaryVoice = computed(() => dailyVoices.value[0])
const heroSecondaryVoice = computed(() => dailyVoices.value[1])
const featuredVoice = computed(() => dailyVoices.value[2])
const newVoices = computed(() => dailyVoices.value.slice(3))
const selectedDailyVoiceID = ref(newVoices.value[0]?.id || dailyVoices.value[0]?.id || '')
const voiceActivityStore = createVoiceActivityStore({ accountID })
const ownAvatar = computed(() => resolveAccountAvatar(props.user))
const isPlaying = computed(() => audioState.value.id === featuredVoice.value?.voiceClip?.id && audioState.value.status === 'playing')
const isPaused = computed(() => audioState.value.id === featuredVoice.value?.voiceClip?.id && audioState.value.status === 'paused')
const playerProgress = computed(() => voicePlaybackProgress(audioState.value, featuredVoice.value?.voiceClip))
const playerRemaining = computed(() => voicePlaybackRemainingMs(audioState.value, featuredVoice.value?.voiceClip))
const hubRouteTransitionName = computed(() => utilityRouteKind.value ? `hub-utility-${utilityRouteDirection.value}` : 'hub-route-none')

function prepareUtilityRoute(screen) {
  const source = screen === 'coin-store' ? coinButton.value : messagesButton.value
  const rect = source?.getBoundingClientRect?.()
  const viewportTop = window.visualViewport?.offsetTop || 0
  const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const originY = rect ? rect.top + rect.height / 2 - viewportTop : 44
  document.documentElement.style.setProperty('--hub-utility-origin-x', `${Math.round(originX)}px`)
  document.documentElement.style.setProperty('--hub-utility-origin-y', `${Math.round(originY)}px`)
  document.documentElement.style.setProperty('--hub-utility-origin-radius', screen === 'coin-store' ? '40px' : '24px')
  utilityRouteKind.value = screen
}

function refreshAccountScopedBusinessState() {
  socialSnapshot.value = socialStore.reload()
  coinWallet = createCoinWalletStore({ accountID, initialBalance: coinBalance.value })
  coinBalance.value = coinWallet.getSnapshot().balance
  discoverySnapshot.value = discoveryStore.reload(coinWallet.getSnapshot(), socialSnapshot.value.relationshipsByUserID)
  voiceEarthUnlocked.value = isVoiceEarthUnlocked({ accountID, user: props.user })
  if (!dailyVoices.value.some((voice) => voice.id === selectedDailyVoiceID.value)) {
    selectedDailyVoiceID.value = newVoices.value[0]?.id || dailyVoices.value[0]?.id || ''
  }
}

function completeIntro() {
  introActive.value = false
  introReady.value = true
  emit('intro-complete')
  showSeeAllGuideIfNeeded()
}

function markIntroReady() {
  introReady.value = true
}

function openSocial(screen, userID = '') {
  if (profileTransitionActive.value || profileReturnState.value || utilityRouteBusy.value) return
  voicePlaybackService.stop()
  profileEntryAnimated.value = false
  selectedUserID.value = userID
  if (screen === 'coin-store' || screen === 'messages') {
    prepareUtilityRoute(screen)
    utilityRouteDirection.value = 'forward'
    utilityRouteBusy.value = true
  }
  activeSocial.value = screen
}

function closeSocial(payload = {}) {
  if (profileReturnState.value) return
  if (utilityRouteBusy.value) return
  const isUtilityRoute = activeSocial.value === 'coin-store' || activeSocial.value === 'messages'
  if (isUtilityRoute) {
    utilityRouteDirection.value = 'back'
    utilityRouteBusy.value = true
  }
  const shouldReturnAvatar = activeSocial.value === 'profile'
    && !selectedUserID.value
    && payload?.transition === 'profile-return'
  selectedUserID.value = ''
  activeSocial.value = ''
  profileEntryAnimated.value = false
  refreshAccountScopedBusinessState()
  profileReturnState.value = shouldReturnAvatar ? { sourceRect: payload.sourceRect || null } : null
}

function completeHubRouteEnter() {
  if (utilityRouteDirection.value === 'forward') utilityRouteBusy.value = false
}

function completeHubRouteLeave() {
  if (utilityRouteDirection.value !== 'back') return
  utilityRouteBusy.value = false
  utilityRouteKind.value = ''
}

function completeProfileReturn() {
  profileReturnState.value = null
}

function openDiscoveryFromSocial() {
  utilityRouteKind.value = ''
  utilityRouteBusy.value = false
  activeSocial.value = ''
  selectedUserID.value = ''
  refreshAccountScopedBusinessState()
  const selectedIsAllocated = discoverySnapshot.value.allocatedUserIDs.includes(selectedDailyVoiceID.value)
  openDiscovery(selectedIsAllocated ? selectedDailyVoiceID.value : (availableDiscoveryUserIDs.value[0] || dailyVoices.value[0]?.id))
}

function openProfileCenter() {
  if (introActive.value || voiceEarthActive.value || voiceEarthLockedActive.value || discoveryUserID.value || discoveryTransitionUserID.value || discoveryReturnState.value || activeSocial.value || profileTransitionActive.value || profileReturnState.value || utilityRouteBusy.value) return
  voicePlaybackService.stop()
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  profileTransitionActive.value = true
}

function completeProfileTransition() {
  if (!profileTransitionActive.value) return
  profileTransitionActive.value = false
  profileEntryAnimated.value = true
  selectedUserID.value = ''
  activeSocial.value = 'profile'
}

function openDiscovery(userID) {
  if (!userID || discoveryUserID.value || discoveryTransitionUserID.value || discoveryReturnState.value) return
  voicePlaybackService.stop()
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  discoveryEntryAnimated.value = true
  discoveryTransitionUserID.value = userID
}

function completeDiscoveryTransition(userID) {
  if (!userID || userID !== discoveryTransitionUserID.value) return
  discoveryTransitionUserID.value = ''
  discoveryUserID.value = userID
}

function openDiscoveryFromEarth(userID) {
  if (!userID || discoveryUserID.value || discoveryTransitionUserID.value || discoveryReturnState.value) return
  voicePlaybackService.stop()
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  voiceEarthActive.value = false
  discoveryEntryAnimated.value = true
  discoveryUserID.value = userID
}

function closeDiscovery(payload = {}) {
  const userID = payload.userID || discoveryUserID.value
  discoveryUserID.value = ''
  discoveryEntryAnimated.value = false
  refreshAccountScopedBusinessState()
  if (!userID || !discoveryPeople[userID]) return
  if (newVoices.value.some((voice) => voice.id === userID)) selectedDailyVoiceID.value = userID
  discoveryReturnState.value = { userID, sourceRect: payload.sourceRect || null }
}

function openDiscoveryProfile(userID) {
  if (!userID) return
  discoveryUserID.value = ''
  discoveryEntryAnimated.value = false
  selectedDailyVoiceID.value = userID
  selectedUserID.value = userID
  activeSocial.value = 'profile'
}

function updateCoinBalance(value) {
  if (!Number.isSafeInteger(value) || value < 0) return
  coinBalance.value = value
  refreshAccountScopedBusinessState()
}

function completeDiscoveryReturn(userID) {
  if (discoveryReturnState.value?.userID !== userID) return
  discoveryReturnState.value = null
}

function openDailyVoice(userID) {
  selectedDailyVoiceID.value = userID
  openDiscovery(userID)
}

function beginNewVoicePointer(event, userID) {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
  if (event.isPrimary === false) return
  newVoicePointer = {
    pointerID: event.pointerId,
    userID,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  }
}

function moveNewVoicePointer(event) {
  if (!newVoicePointer || event.pointerId !== newVoicePointer.pointerID) return
  const movedX = event.clientX - newVoicePointer.startX
  const movedY = event.clientY - newVoicePointer.startY
  if (Math.hypot(movedX, movedY) > NEW_VOICE_TAP_DISTANCE) newVoicePointer.moved = true
}

function finishNewVoicePointer(event, userID) {
  if (!newVoicePointer || event.pointerId !== newVoicePointer.pointerID || userID !== newVoicePointer.userID) return
  moveNewVoicePointer(event)
  const shouldOpen = !newVoicePointer.moved
  newVoicePointer = null
  lastNewVoiceTouchEnd = Date.now()
  if (shouldOpen) openDailyVoice(userID)
}

function cancelNewVoicePointer(event) {
  if (!newVoicePointer || event.pointerId !== newVoicePointer.pointerID) return
  newVoicePointer = null
  lastNewVoiceTouchEnd = Date.now()
}

function handleNewVoiceClick(event, userID) {
  const isKeyboardClick = event.detail === 0
  if (!isKeyboardClick && Date.now() - lastNewVoiceTouchEnd < NEW_VOICE_SYNTHETIC_CLICK_WINDOW) return
  openDailyVoice(userID)
}

function openVoiceEarth() {
  if (introActive.value || voiceEarthActive.value || voiceEarthLockedActive.value || discoveryUserID.value || discoveryReturnState.value || activeSocial.value) return
  markSeeAllGuideSeen()
  voicePlaybackService.stop()
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  if (!voiceEarthUnlocked.value) {
    voiceEarthLockedActive.value = true
    return
  }
  voiceEarthActive.value = true
}

function dismissSeeAllGuide() {
  markSeeAllGuideSeen()
}

function closeVoiceEarth() {
  voiceEarthActive.value = false
}

function closeLockedVoiceEarth() {
  voiceEarthLockedActive.value = false
}

function recordToUnlockVoiceEarth() {
  voiceEarthLockedActive.value = false
  openSocial('profile-voice')
}

function handleVoicePublished() {
  voiceEarthUnlocked.value = true
}

function openMoreFromEarth() {
  voiceEarthActive.value = false
  // When every visible card was handled or suppressed (for example, all seven
  // were blocked), keep the purchase path reachable without rendering a
  // blocked profile. VoiceDiscoveryScreen will use this allocated ID only to
  // mount its exhausted state; its own eligibility filter still hides it.
  openDiscovery(dailyVoices.value[0]?.id || discoverySnapshot.value.freeUserIDs[0])
}

async function toggleFeaturedVoice() {
  const voice = featuredVoice.value
  if (!voice?.voiceClip || audioBusy.value) return
  audioBusy.value = true
  audioError.value = false
  try {
    await voicePlaybackService.play(voice.voiceClip, (state) => {
      audioState.value = { ...audioState.value, ...state, durationMs: state.durationMs || voice.voiceClip.durationMs }
    })
    voiceActivityStore.markHeard({ voiceID: voice.voiceClip.id, userID: voice.id, countryCode: voice.countryCode })
  } catch {
    audioError.value = true
  } finally {
    audioBusy.value = false
  }
}

function stopHiddenAudio() {
  if (document.visibilityState !== 'hidden') return
  newVoicePointer = null
  voicePlaybackService.stop()
}

document.addEventListener('visibilitychange', stopHiddenAudio)
onBeforeUnmount(() => {
  newVoicePointer = null
  document.documentElement.style.removeProperty('--hub-utility-origin-x')
  document.documentElement.style.removeProperty('--hub-utility-origin-y')
  document.documentElement.style.removeProperty('--hub-utility-origin-radius')
  document.removeEventListener('visibilitychange', stopHiddenAudio)
  window.removeEventListener('resize', updateSeeAllGuideTarget)
  voicePlaybackService.dispose()
})

onMounted(() => {
  window.addEventListener('resize', updateSeeAllGuideTarget, { passive: true })
  if (!introActive.value) showSeeAllGuideIfNeeded()
})
</script>

<template>
  <Transition :name="hubRouteTransitionName" @after-enter="completeHubRouteEnter" @after-leave="completeHubRouteLeave">
  <VoiceDiscoveryScreen
    v-if="discoveryUserID"
    :initial-user-id="discoveryUserID"
    :animate-entry="discoveryEntryAnimated"
    :account-id="accountID"
    :coin-balance="coinBalance"
    @close="closeDiscovery"
    @open-profile="openDiscoveryProfile"
    @coin-balance-changed="updateCoinBalance"
  />

  <CoinStoreScreen
    v-else-if="activeSocial === 'coin-store'"
    :account-id="accountID"
    :initial-balance="coinBalance"
    @back="closeSocial"
    @balance-changed="updateCoinBalance"
  />

  <SocialModule
    v-else-if="activeSocial"
    :entry="activeSocial"
    :initial-user-id="selectedUserID"
    :user="props.user"
    :coin-balance="coinBalance"
    :discovery-user-ids="availableDiscoveryUserIDs"
    :animate-entry="profileEntryAnimated && activeSocial === 'profile'"
    @close="closeSocial"
    @open-discovery="openDiscoveryFromSocial"
    @open-language="emit('open-language')"
    @logout="emit('logout')"
    @profile-updated="emit('profile-updated', $event)"
    @coin-balance-changed="updateCoinBalance"
    @voice-published="handleVoicePublished"
  />

  <main v-else class="main-hub app-screen" :class="{ 'hub-intro-active': introActive, 'hub-intro-pending': introActive && !introReady, 'hub-see-all-guide-active': seeAllGuideActive, 'hub-voice-earth-active': voiceEarthActive || voiceEarthLockedActive, 'hub-discovery-transition-active': discoveryTransitionUserID, 'hub-discovery-return-active': discoveryReturnState, 'hub-profile-transition-active': profileTransitionActive, 'hub-profile-return-active': profileReturnState }" :aria-busy="introActive || discoveryTransitionUserID || discoveryReturnState || profileTransitionActive || profileReturnState ? 'true' : undefined">
    <div class="hub-atmosphere hub-atmosphere-blue" aria-hidden="true" />
    <div class="hub-atmosphere hub-atmosphere-peach" aria-hidden="true" />
    <div class="hub-atmosphere hub-atmosphere-lavender" aria-hidden="true" />

    <div class="hub-scroll" :inert="introActive || voiceEarthActive || voiceEarthLockedActive || Boolean(discoveryTransitionUserID) || Boolean(discoveryReturnState) || profileTransitionActive || Boolean(profileReturnState)" :aria-hidden="introActive || voiceEarthActive || voiceEarthLockedActive || discoveryTransitionUserID || discoveryReturnState || profileTransitionActive || profileReturnState ? 'true' : undefined">
      <header class="hub-header">
        <div class="hub-brand" aria-label="OiVox — Speak Around the World">
          <strong>OiVox</strong>
          <small>{{ copy.mainTagline }}</small>
        </div>

        <nav class="hub-actions" :aria-label="copy.mainTitle">
          <button ref="coinButton" class="hub-coin" type="button" :aria-label="`${socialCopy.myCoins}, ${coinBalance}`" :disabled="utilityRouteBusy" @click="openSocial('coin-store')">
            <span class="hub-coin-visual" aria-hidden="true">
              <img :src="coinIcon" alt="">
              <b>{{ coinBalance }}</b>
            </span>
          </button>
          <button ref="messagesButton" class="hub-round-action hub-conversation-action" type="button" :aria-label="socialCopy.messages" :disabled="utilityRouteBusy" @click="openSocial('messages')">
            <img :src="chatIcon" alt="">
            <b v-if="unreadMessageCount" class="hub-badge">{{ unreadMessageCount }}</b>
          </button>
          <button class="hub-avatar-button" type="button" :aria-label="socialCopy.profile" :disabled="profileTransitionActive || Boolean(profileReturnState)" @click="openProfileCenter">
            <img :src="ownAvatar" data-profile-center-source alt="">
          </button>
        </nav>
      </header>

      <section class="hub-collage" :aria-label="copy.newVoices">
        <div class="hub-intro">
          <h1 id="hub-title" :aria-label="copy.mainTitle">
            <span v-for="(word, index) in titleWords" :key="`${word}-${index}`" :data-hub-title-word="index">{{ word }}</span>
          </h1>
          <p>{{ copy.mainSubtitle }}</p>
        </div>
        <button v-if="heroPrimaryVoice" class="hub-photo-card hub-photo-card-large" type="button" :data-intro-user="heroPrimaryVoice.id" :data-discovery-item="heroPrimaryVoice.id" :aria-label="`${heroPrimaryVoice.displayName}, ${copy.openProfile}`" @click="openDiscovery(heroPrimaryVoice.id)">
          <img :src="heroPrimaryVoice.avatarAsset" :data-earth-source="heroPrimaryVoice.id" :data-discovery-source="heroPrimaryVoice.id" alt="">
          <span class="hub-hand-note hub-hand-note-large" aria-hidden="true">Hear<br>Real<br>People</span>
        </button>
        <button v-if="heroSecondaryVoice" class="hub-photo-card hub-photo-card-small" type="button" :data-intro-user="heroSecondaryVoice.id" :data-discovery-item="heroSecondaryVoice.id" :aria-label="`${heroSecondaryVoice.displayName}, ${copy.openProfile}`" @click="openDiscovery(heroSecondaryVoice.id)">
          <img :src="heroSecondaryVoice.avatarAsset" :data-earth-source="heroSecondaryVoice.id" :data-discovery-source="heroSecondaryVoice.id" alt="">
          <span class="hub-hand-note hub-hand-note-small" aria-hidden="true">Just<br>a voice</span>
        </button>
      </section>

      <article v-if="featuredVoice" class="hub-now-playing" :class="{ playing: isPlaying, paused: isPaused, active: isPlaying || isPaused }" :data-intro-user="featuredVoice.id" :data-discovery-item="featuredVoice.id">
          <button class="hub-player-profile" type="button" :aria-label="`${featuredVoice.displayName}, ${copy.openProfile}`" @click="openDiscovery(featuredVoice.id)">
            <img class="hub-player-avatar" :src="featuredVoice.avatarAsset" :data-earth-source="featuredVoice.id" :data-discovery-source="featuredVoice.id" alt="">
            <span class="hub-player-copy">
              <small>{{ copy.nowPlaying }}</small>
              <strong>{{ featuredVoice.displayName }}</strong>
            </span>
          </button>
          <button class="hub-player-audio" type="button" :aria-label="isPlaying ? copy.pause : copy.play" :aria-busy="audioBusy" :disabled="audioBusy" @click="toggleFeaturedVoice">
            <span class="hub-wave" :style="{ '--voice-progress': playerProgress }" aria-hidden="true">
              <i v-for="(height, index) in [8, 15, 22, 11, 27, 18, 10, 24, 16, 8, 20, 13, 26, 16, 9]" :key="index" :style="{ height: `${height}px` }" />
            </span>
            <time>{{ formatVoiceDuration(playerRemaining) }}</time>
          </button>
          <button class="hub-player-toggle" type="button" :aria-label="isPlaying ? copy.pause : copy.play" :aria-busy="audioBusy" :disabled="audioBusy" @click="toggleFeaturedVoice">
            <img :src="isPlaying ? pauseIcon : playIcon" alt="">
          </button>
      </article>
      <p v-if="audioError" class="hub-audio-error" role="alert">{{ copy.voiceUnavailable }}</p>

      <section class="hub-new-voices" aria-labelledby="new-voices-title">
        <div class="hub-section-heading">
          <h2 id="new-voices-title">{{ copy.newVoices }}</h2>
          <button ref="seeAllButton" class="hub-see-all-button" type="button" :disabled="voiceEarthActive" @click="openVoiceEarth">
            {{ copy.seeAll }}
            <img :src="chevronRightIcon" alt="">
          </button>
        </div>

        <div class="hub-voice-strip">
          <button
            v-for="voice in newVoices"
            :key="voice.id"
            class="hub-voice-card"
            :class="{ selected: voice.id === selectedDailyVoiceID }"
            type="button"
            :data-intro-user="voice.id"
            :data-discovery-item="voice.id"
            :aria-label="`${voice.displayName}, ${copy.openProfile}`"
            :aria-current="voice.id === selectedDailyVoiceID ? 'true' : undefined"
            @pointerdown="beginNewVoicePointer($event, voice.id)"
            @pointermove="moveNewVoicePointer"
            @pointerup="finishNewVoicePointer($event, voice.id)"
            @pointercancel="cancelNewVoicePointer"
            @lostpointercapture="cancelNewVoicePointer"
            @click="handleNewVoiceClick($event, voice.id)"
          >
            <img class="hub-voice-photo" :src="voice.avatarAsset" :data-earth-source="voice.id" :data-discovery-source="voice.id" alt="">
            <span class="hub-voice-flag"><img :src="voice.flagAsset" alt=""></span>
            <strong>{{ voice.displayName }}</strong>
          </button>
        </div>
      </section>
    </div>

    <div v-if="seeAllGuideActive" class="hub-see-all-guide" role="dialog" :aria-label="seeAllGuideCopy.message" :style="seeAllGuideStyle">
      <button class="hub-see-all-guide-scrim" type="button" :aria-label="seeAllGuideCopy.skip" @click="dismissSeeAllGuide" />
      <button class="hub-see-all-guide-skip" type="button" @click="dismissSeeAllGuide">{{ seeAllGuideCopy.skip }}</button>
      <button class="hub-see-all-guide-focus" type="button" @click="openVoiceEarth">
        {{ copy.seeAll }}
        <img :src="chevronRightIcon" alt="">
      </button>
      <div class="hub-see-all-guide-card">
        <p>{{ seeAllGuideCopy.message }}</p>
        <button type="button" @click="dismissSeeAllGuide">{{ seeAllGuideCopy.gotIt }}</button>
        <span class="hub-see-all-guide-arrow" aria-hidden="true" />
      </div>
    </div>

    <MainHubIntro v-if="introActive" :voices="dailyVoices" :title-words="titleWords" :preview-mode="introPreviewMode" @ready="markIntroReady" @complete="completeIntro" />
    <VoiceEarthScreen v-if="voiceEarthActive" :voices="earthVoices" :copy="copy" :empty-title="cardPackCopy.exhaustedTitle" :empty-subtitle="cardPackCopy.exhaustedSubtitle" :get-more-label="cardPackCopy.confirmTitle" @close="closeVoiceEarth" @open-profile="openDiscoveryFromEarth" @get-more="openMoreFromEarth" />
    <VoiceEarthLockedScreen v-if="voiceEarthLockedActive" :voices="dailyVoices" :copy="lockedCopy" @close="closeLockedVoiceEarth" @record="recordToUnlockVoiceEarth" />
    <VoiceDiscoveryEntryTransition
      v-if="discoveryTransitionVoice"
      :voice="discoveryTransitionVoice"
      @complete="completeDiscoveryTransition"
    />
    <VoiceDiscoveryReturnTransition
      v-if="discoveryReturnVoice"
      :voice="discoveryReturnVoice"
      :source-rect="discoveryReturnState.sourceRect"
      @complete="completeDiscoveryReturn"
    />
    <UserProfileEntryTransition
      v-if="profileTransitionActive"
      :avatar="ownAvatar"
      @complete="completeProfileTransition"
    />
    <UserProfileReturnTransition
      v-if="profileReturnState"
      :avatar="ownAvatar"
      :source-rect="profileReturnState.sourceRect"
      @complete="completeProfileReturn"
    />

  </main>
  </Transition>
</template>
