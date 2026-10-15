<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import coinIcon from '../assets/coin.png'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import skipButtonIcon from '../assets/icons/discovery-skip-button.png'
import filterIcon from '../assets/icons/discovery-filter.svg'
import heartIcon from '../assets/icons/discovery-heart.svg'
import historyIcon from '../assets/icons/discovery-history.svg'
import infoIcon from '../assets/icons/discovery-info.svg'
import moreIcon from '../assets/icons/discovery-more.svg'
import personAddIcon from '../assets/icons/discovery-person-add.svg'
import sparkleIcon from '../assets/icons/discovery-sparkle.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import insufficientWarningArt from '../assets/slices/coin-insufficient-warning@2x.png'
import { discoveryExperienceContent } from '../data/discoveryExperienceContent'
import { discoveryFilterContent } from '../data/discoveryFilterContent'
import { discoveryCardPackContent, discoveryCoinProducts, discoveryCommerceContent } from '../data/discoveryCommerceContent'
import { discoveryPeople } from '../data/discoveryFixtures'
import { getDiscoveryVoiceTranslation } from '../data/discoveryVoiceTranslations'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { toPublicSocialProfile } from '../data/socialProfile'
import { useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { createCoinWalletStore } from '../services/coinWalletStore'
import { createDiscoveryStore } from '../services/discoveryStore'
import { createSocialStore } from '../services/socialStore'
import { coinPurchaseErrorMessage, loadCoinProductPrices, purchaseCoinProduct } from '../services/storeKitCoinPurchase'
import { createTranslationHistoryStore } from '../services/translationHistoryStore'
import { createVoiceActivityStore } from '../services/voiceActivityStore'
import { EMPTY_VOICE_PLAYBACK_STATE, formatVoiceDuration, voicePlaybackProgress, voicePlaybackRemainingMs, voicePlaybackService } from '../services/voicePlaybackService'
import DiscoveryFilterSheet from './DiscoveryFilterSheet.vue'
import TranslationHistoryScreen from './TranslationHistoryScreen.vue'
import CoinStoreScreen from './CoinStoreScreen.vue'
import ReportBlockScreen from './ReportBlockScreen.vue'

const props = defineProps({
  initialUserId: { type: String, required: true },
  animateEntry: { type: Boolean, default: false },
  accountId: { type: String, default: 'local-review-account' },
  coinBalance: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'open-profile', 'coin-balance-changed'])
const { locale } = useI18n()
const copy = computed(() => discoveryExperienceContent(locale.value))
const filterCopy = computed(() => discoveryFilterContent(locale.value))
const commerceCopy = computed(() => discoveryCommerceContent(locale.value))
const cardPackCopy = computed(() => discoveryCardPackContent(locale.value))
const audioCopy = computed(() => postRegistrationContent(locale.value))
const currentUserID = ref(props.initialUserId)
const activePanel = ref('discovery')
const panelTransitionName = ref('social-route-none')
const audioState = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const audioBusy = ref(false)
const audioError = ref(false)
const entrySurface = ref(null)
const contentScroll = ref(null)
const currentPhoto = ref(null)
const entryPhase = ref(props.animateEntry ? 'pending' : 'ready')
const closing = ref(false)
const dragX = ref(0)
const dragging = ref(false)
const cardResetting = ref(false)
const decisionBusy = ref(false)
const decisionFeedback = ref('')
const likeBusy = ref(false)
const requestOpen = ref(false)
const requestDraft = ref('')
const requestBusy = ref(false)
const requestError = ref('')
const notice = ref('')
const reportBusy = ref(false)
const reportError = ref('')
const reportTransaction = ref(null)
const translationModal = ref('')
const translationDialog = ref(null)
const translationBusy = ref(false)
const translationError = ref('')
const insufficientStorePrices = ref({})
const insufficientProductsLoading = ref(false)
const insufficientPurchaseBusy = ref(false)

watch(activePanel, (nextPanel, previousPanel) => {
  if (nextPanel === 'report-block') panelTransitionName.value = 'ios-bottom-page-present'
  else if (previousPanel === 'report-block') panelTransitionName.value = 'ios-bottom-page-dismiss'
  else panelTransitionName.value = 'social-route-none'
}, { flush: 'sync' })
const insufficientPurchaseMessage = ref('')
const insufficientPurchaseMessageKind = ref('')
const cardPackModal = ref('')
const cardPackBusy = ref(false)
const cardPackError = ref('')
const cardPackDialog = ref(null)
const cardPackTrigger = ref(null)
const coinSheetDragOffset = ref(0)
const coinSheetDragging = ref(false)
const coinSheetKind = ref('')
const filterOpen = ref(false)
const filterTrigger = ref(null)
const coinStorePurpose = ref('translation')
const translatedByVoiceID = ref({})
const socialStore = createSocialStore({ accountID: props.accountId })
const socialSnapshot = ref(socialStore.getSnapshot())
let walletStore = createCoinWalletStore({ accountID: props.accountId, initialBalance: props.coinBalance })
const walletBalance = ref(walletStore.getSnapshot().balance)
const voiceActivityStore = createVoiceActivityStore({ accountID: props.accountId })
const discoveryStore = createDiscoveryStore({ accountID: props.accountId, relationshipsByUserID: socialSnapshot.value.relationshipsByUserID })
const discoverySnapshot = ref(discoveryStore.getSnapshot(walletStore.getSnapshot(), socialSnapshot.value.relationshipsByUserID, voiceActivityStore.getSnapshot().heardVoices.map((item) => item.voiceID)))
const unsubscribeSocial = socialStore.subscribe((value) => {
  socialSnapshot.value = value
  refreshDiscoverySnapshot()
  if (!discoverySnapshot.value.allocatedUserIDs.includes(currentUserID.value) && discoverySnapshot.value.remainingUserIDs[0]) {
    showProfile(discoverySnapshot.value.remainingUserIDs[0])
  }
})
if (!discoverySnapshot.value.allocatedUserIDs.includes(currentUserID.value) && discoverySnapshot.value.remainingUserIDs[0]) {
  currentUserID.value = discoverySnapshot.value.remainingUserIDs[0]
}
const translationHistoryStore = createTranslationHistoryStore({ accountID: props.accountId })
translatedByVoiceID.value = Object.fromEntries(translationHistoryStore.getSnapshot().entries.map((entry) => [`${entry.userID}:${entry.targetLanguage}`, entry.translatedText]))
let pointerID = null
let pointerStartX = 0
let pointerStartY = 0
let pointerStartAt = 0
let pointerIntent = 'unknown'
let suppressClickUntil = 0
let coinSheetPointerID = null
let coinSheetDragStartY = 0
let coinSheetDragStartedAt = 0
let suppressPhotoClick = false
let entryAnimation = null
let entryFrame = 0
let decisionTimer = 0
let noticeTimer = 0
let reducedMotionQuery = null
let disposed = false
const insufficientPurchasePageInstanceID = `voice-discovery-coin-purchase-${globalThis.crypto?.randomUUID?.() || Date.now()}`

const currentProfile = computed(() => {
  const visibleCurrentID = discoverySnapshot.value.allocatedUserIDs.includes(currentUserID.value)
    ? currentUserID.value
    : (discoverySnapshot.value.remainingUserIDs[0] || discoverySnapshot.value.allocatedUserIDs[0])
  return toPublicSocialProfile(discoveryPeople[visibleCurrentID])
})
const currentDecision = computed(() => currentProfile.value ? discoverySnapshot.value.decisionsByUserID[currentProfile.value.id] || null : null)
const isReviewMode = computed(() => Boolean(currentDecision.value))
const nextProfile = computed(() => {
  const ids = discoverySnapshot.value.remainingUserIDs.filter((userID) => userID !== currentUserID.value)
  return ids[0] ? toPublicSocialProfile(discoveryPeople[ids[0]]) : null
})
const remainingCount = computed(() => discoverySnapshot.value.remainingCount)
const exhausted = computed(() => remainingCount.value === 0)
const relationship = computed(() => currentProfile.value ? (socialSnapshot.value.relationshipsByUserID[currentProfile.value.id] || currentProfile.value.relationship) : null)
const isPlaying = computed(() => audioState.value.id === currentProfile.value?.voiceClip?.id && audioState.value.status === 'playing')
const isPaused = computed(() => audioState.value.id === currentProfile.value?.voiceClip?.id && audioState.value.status === 'paused')
const clipProgress = computed(() => voicePlaybackProgress(audioState.value, currentProfile.value?.voiceClip))
const remainingTime = computed(() => voicePlaybackRemainingMs(audioState.value, currentProfile.value?.voiceClip))
const currentLikes = computed(() => Number.isFinite(currentProfile.value?.likesCount) ? currentProfile.value.likesCount + (isLiked.value ? 1 : 0) : null)
const isLiked = computed(() => socialSnapshot.value.likedUserIDs?.includes(currentProfile.value?.id) || false)
const translatedText = computed(() => currentProfile.value ? translatedByVoiceID.value[`${currentProfile.value.id}:${locale.value}`] || '' : '')
const voiceUsesPreferredLanguage = computed(() => Boolean(currentProfile.value?.voiceClip?.transcriptLanguage === locale.value))
const canTranslate = computed(() => !voiceUsesPreferredLanguage.value && !translatedText.value)
const insufficientCoinPacks = computed(() => discoveryCoinProducts
  .filter((item) => [60, 180].includes(item.coins))
  .map((item) => ({ ...item, displayPrice: insufficientStorePrices.value[item.productID] || item.fallbackPrice })))
const defaultInsufficientProductID = insufficientCoinPacks.value.find((item) => item.coins === 180)?.productID || insufficientCoinPacks.value[0]?.productID || ''
const selectedInsufficientProductID = ref(defaultInsufficientProductID)
const selectedInsufficientProduct = computed(() => insufficientCoinPacks.value.find((item) => item.productID === selectedInsufficientProductID.value) || insufficientCoinPacks.value[0])
const insufficientPurchaseNote = computed(() => {
  if (insufficientPurchaseMessage.value) return insufficientPurchaseMessage.value
  if (insufficientProductsLoading.value) return commerceCopy.value.loadingProducts
  return commerceCopy.value.freeFeaturesNote
})
const translateLabel = computed(() => translatedText.value ? commerceCopy.value.translated : voiceUsesPreferredLanguage.value ? commerceCopy.value.alreadyPreferred : copy.value.translate)
const addLabel = computed(() => {
  if (relationship.value?.friendshipStatus === 'friends') return copy.value.friend
  if (relationship.value?.friendshipStatus === 'pending_out') return copy.value.requestSent
  return copy.value.add
})
const addDisabled = computed(() => requestBusy.value || relationship.value?.blockStatus !== 'none' || ['friends', 'pending_out'].includes(relationship.value?.friendshipStatus))
const cardStyle = computed(() => ({
  '--discovery-drag-x': `${dragX.value}px`,
  '--discovery-drag-rotate': `${dragX.value / 32}deg`,
  '--discovery-drag-progress': Math.min(1, Math.abs(dragX.value) / 120),
}))
const operationID = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`

function showNotice(message) {
  window.clearTimeout(noticeTimer)
  notice.value = message
  noticeTimer = window.setTimeout(() => { notice.value = '' }, 2600)
}

function stopVoice() {
  voicePlaybackService.stop()
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
}

function refreshDiscoverySnapshot() {
  discoverySnapshot.value = discoveryStore.getSnapshot(
    walletStore.getSnapshot(),
    socialSnapshot.value.relationshipsByUserID,
    voiceActivityStore.getSnapshot().heardVoices.map((item) => item.voiceID),
  )
}

function showProfile(userID) {
  if (!userID || !discoveryPeople[userID]) return
  stopVoice()
  audioError.value = false
  currentUserID.value = userID
  dragX.value = 0
  decisionFeedback.value = ''
  translationModal.value = ''
  translationError.value = ''
  resetCoinSheetDrag()
}

function resetCoinSheetDrag() {
  coinSheetPointerID = null
  coinSheetDragOffset.value = 0
  coinSheetDragging.value = false
  coinSheetKind.value = ''
}

function closeTranslationModal() {
  if (translationBusy.value || insufficientPurchaseBusy.value) return
  resetCoinSheetDrag()
  translationModal.value = ''
}

function beginCoinSheetDrag(event, kind) {
  const busy = kind === 'translation' ? (translationBusy.value || insufficientPurchaseBusy.value) : cardPackBusy.value
  if (busy || coinSheetPointerID !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
  coinSheetPointerID = event.pointerId
  coinSheetDragStartY = event.clientY
  coinSheetDragStartedAt = performance.now()
  coinSheetKind.value = kind
  coinSheetDragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveCoinSheetDrag(event) {
  if (event.pointerId !== coinSheetPointerID) return
  coinSheetDragOffset.value = Math.min(Math.max(0, event.clientY - coinSheetDragStartY), window.innerHeight * .42)
}

function finishCoinSheetDrag(event, cancelled = false) {
  if (event.pointerId !== coinSheetPointerID) return
  const capturedPointerID = coinSheetPointerID
  const elapsed = Math.max(1, performance.now() - coinSheetDragStartedAt)
  const velocity = coinSheetDragOffset.value / elapsed
  const dismissKind = coinSheetKind.value
  const busy = dismissKind === 'translation' ? (translationBusy.value || insufficientPurchaseBusy.value) : cardPackBusy.value
  const shouldDismiss = !cancelled
    && !busy
    && (coinSheetDragOffset.value >= Math.min(110, window.innerHeight * .12) || velocity >= .62)

  coinSheetPointerID = null
  coinSheetDragging.value = false
  if (event.currentTarget.hasPointerCapture?.(capturedPointerID)) {
    event.currentTarget.releasePointerCapture(capturedPointerID)
  }

  if (shouldDismiss) {
    if (dismissKind === 'translation') closeTranslationModal()
    else closeCardPackModal()
  } else {
    coinSheetDragOffset.value = 0
    coinSheetKind.value = ''
  }
}

async function toggleVoice() {
  const clip = currentProfile.value.voiceClip
  if (!clip || audioBusy.value || decisionBusy.value) return
  audioBusy.value = true
  audioError.value = false
  try {
    await voicePlaybackService.play(clip, (state) => {
      audioState.value = { ...audioState.value, ...state, durationMs: state.durationMs || clip.durationMs }
    })
    voiceActivityStore.markHeard({ voiceID: clip.id, userID: currentProfile.value.id, countryCode: currentProfile.value.countryCode })
  } catch {
    audioError.value = true
  } finally {
    audioBusy.value = false
  }
}

function finishDecision(kind) {
  if (disposed) return
  window.clearTimeout(decisionTimer)
  decisionTimer = 0
  const decidedUserID = currentProfile.value.id
  try {
    if (kind === 'like' && !isLiked.value) socialStore.setLiked(decidedUserID, true, operationID('discovery-swipe-like'))
    discoverySnapshot.value = discoveryStore.decide({
      userID: decidedUserID,
      kind,
      operationID: operationID(`discovery-${kind}`),
      walletSnapshot: walletStore.getSnapshot(),
      relationships: socialSnapshot.value.relationshipsByUserID,
      heardVoiceIDs: voiceActivityStore.getSnapshot().heardVoices.map((item) => item.voiceID),
    })
    const nextUserID = discoverySnapshot.value.remainingUserIDs[0]
    if (nextUserID) showProfile(nextUserID)
    else {
      cardResetting.value = true
      dragX.value = 0
      decisionFeedback.value = ''
      nextTick(() => {
        contentScroll.value?.scrollTo({ top: contentScroll.value.scrollHeight, behavior: reducedMotionQuery?.matches ? 'auto' : 'smooth' })
        window.requestAnimationFrame(() => { if (!disposed) cardResetting.value = false })
      })
    }
  } catch {
    dragX.value = 0
    decisionFeedback.value = ''
    showNotice(cardPackCopy.value.decisionFailed)
  }
  decisionBusy.value = false
}

function toggleLike() {
  if (decisionBusy.value || likeBusy.value || entryPhase.value !== 'ready') return
  likeBusy.value = true
  try {
    socialStore.setLiked(currentProfile.value.id, !isLiked.value, operationID(isLiked.value ? 'discovery-unlike' : 'discovery-like'))
  } catch {
    showNotice(copy.value.requestFailed)
  } finally {
    likeBusy.value = false
  }
}

function openProfile() {
  if (suppressPhotoClick || decisionBusy.value || entryPhase.value !== 'ready') return
  stopVoice()
  emit('open-profile', currentProfile.value.id)
}

async function focusTranslationDialog() {
  await nextTick()
  translationDialog.value?.focus()
}

async function openTranslationConfirmation() {
  if (translationBusy.value || !canTranslate.value) return
  stopVoice()
  translationError.value = ''
  translationModal.value = walletBalance.value < 5 ? 'insufficient' : 'confirm'
  await focusTranslationDialog()
}

function updateWalletBalance(value) {
  walletBalance.value = value
  walletStore = createCoinWalletStore({ accountID: props.accountId, initialBalance: value })
  refreshDiscoverySnapshot()
  emit('coin-balance-changed', value)
}

async function loadInsufficientCoinProducts() {
  if (insufficientProductsLoading.value || Object.keys(insufficientStorePrices.value).length) return
  insufficientProductsLoading.value = nativeBridge.isNative
  try {
    const result = await loadCoinProductPrices(insufficientCoinPacks.value.map((item) => item.productID), {
      pageInstanceID: insufficientPurchasePageInstanceID,
    })
    if (disposed) return
    insufficientStorePrices.value = result.prices
  } catch {
    if (disposed) return
    insufficientPurchaseMessageKind.value = 'error'
    insufficientPurchaseMessage.value = commerceCopy.value.storeLoadFailed
  } finally {
    if (!disposed) insufficientProductsLoading.value = false
  }
}

function selectInsufficientProduct(productID) {
  if (insufficientPurchaseBusy.value) return
  selectedInsufficientProductID.value = productID
  insufficientPurchaseMessage.value = ''
}

async function buySelectedInsufficientProduct() {
  const product = selectedInsufficientProduct.value
  if (!product || insufficientPurchaseBusy.value || insufficientProductsLoading.value) return
  insufficientPurchaseBusy.value = true
  insufficientPurchaseMessageKind.value = 'notice'
  insufficientPurchaseMessage.value = commerceCopy.value.purchaseProcessing
  try {
    const result = await purchaseCoinProduct({
      product,
      wallet: walletStore,
      pageInstanceID: insufficientPurchasePageInstanceID,
    })
    if (disposed) return
    if (result.status === 'complete') {
      updateWalletBalance(result.balance)
      insufficientPurchaseMessageKind.value = 'success'
      insufficientPurchaseMessage.value = commerceCopy.value.purchaseComplete.replace('{coins}', result.coins)
    } else if (result.status === 'pending') {
      insufficientPurchaseMessageKind.value = 'notice'
      insufficientPurchaseMessage.value = commerceCopy.value.purchasePending
    } else if (result.status === 'cancelled') {
      insufficientPurchaseMessageKind.value = 'notice'
      insufficientPurchaseMessage.value = commerceCopy.value.purchaseCancelled
    } else if (result.status === 'unavailable') {
      insufficientPurchaseMessageKind.value = 'error'
      insufficientPurchaseMessage.value = commerceCopy.value.storeUnavailable
    } else {
      insufficientPurchaseMessageKind.value = 'error'
      insufficientPurchaseMessage.value = commerceCopy.value.purchaseFailed
    }
  } catch (error) {
    if (disposed) return
    insufficientPurchaseMessageKind.value = 'error'
    insufficientPurchaseMessage.value = coinPurchaseErrorMessage(commerceCopy.value, error)
  } finally {
    if (!disposed) insufficientPurchaseBusy.value = false
  }
}

watch(translationModal, (value) => {
  if (value !== 'insufficient') return
  insufficientPurchaseMessage.value = ''
  insufficientPurchaseMessageKind.value = ''
  loadInsufficientCoinProducts()
})

async function translateCurrentVoice() {
  if (translationBusy.value) return
  if (walletBalance.value < 5) {
    translationModal.value = 'insufficient'
    await focusTranslationDialog()
    return
  }
  translationBusy.value = true
  translationError.value = ''
  const profile = currentProfile.value
  const clip = profile.voiceClip
  const transactionID = operationID(`translation-${clip.id}-${locale.value}`)
  try {
    let result = getDiscoveryVoiceTranslation({
      pairingID: clip.mediaPairID,
      voiceID: clip.id,
      originalText: clip.transcript,
      targetLanguage: locale.value,
    })
    if (!result && nativeBridge.isNative) {
      result = await nativeBridge.translateText(clip.transcript, clip.transcriptLanguage, locale.value, { pageInstanceID: 'voice-discovery-translation', timeout: 120000 })
    } else if (!result) {
      throw new Error('TRANSLATION_UNAVAILABLE')
    }
    if (!result?.translatedText) throw new Error('TRANSLATION_EMPTY')
    const wallet = walletStore.spend({ amount: 5, reason: 'voice_translation', transactionID, metadata: { userID: profile.id, voiceID: clip.id, targetLanguage: locale.value } })
    try {
      translationHistoryStore.add({
        userID: profile.id, displayName: profile.displayName, avatarAsset: profile.avatarAsset, flagAsset: profile.flagAsset,
        sourceLanguage: clip.transcriptLanguage, targetLanguage: locale.value, originalText: clip.transcript,
        translatedText: result.translatedText, createdAt: new Date().toISOString(), isFixture: result.source === 'bundled-localization' || Boolean(result.simulated),
      }, transactionID)
    } catch (error) {
      const rollback = walletStore.refund({ amount: 5, reason: 'translation_persist_rollback', transactionID: `${transactionID}-rollback`, relatedTransactionID: transactionID })
      updateWalletBalance(rollback.balance)
      throw error
    }
    translatedByVoiceID.value = { ...translatedByVoiceID.value, [`${profile.id}:${locale.value}`]: result.translatedText }
    updateWalletBalance(wallet.balance)
    translationModal.value = ''
  } catch {
    translationError.value = commerceCopy.value.translationFailed
  } finally {
    translationBusy.value = false
  }
}

function openCoinStore(purpose = 'translation') {
  resetCoinSheetDrag()
  translationModal.value = ''
  cardPackModal.value = ''
  coinStorePurpose.value = purpose
  activePanel.value = 'coin-store'
}

function closeCoinStore() {
  activePanel.value = 'discovery'
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  if (coinStorePurpose.value === 'translation' && canTranslate.value) {
    translationModal.value = walletBalance.value >= 5 ? 'confirm' : 'insufficient'
    nextTick(() => translationDialog.value?.focus())
  }
  if (coinStorePurpose.value === 'card-pack' && exhausted.value) {
    cardPackModal.value = walletBalance.value >= 50 ? 'confirm' : 'insufficient'
    nextTick(() => cardPackDialog.value?.focus())
  }
}

async function openCardPackConfirmation() {
  if (cardPackBusy.value || !exhausted.value) return
  stopVoice()
  cardPackError.value = ''
  cardPackModal.value = walletBalance.value < 50 ? 'insufficient' : 'confirm'
  await nextTick()
  cardPackDialog.value?.focus()
}

function closeCardPackModal() {
  if (cardPackBusy.value) return
  resetCoinSheetDrag()
  cardPackModal.value = ''
  cardPackError.value = ''
  nextTick(() => cardPackTrigger.value?.focus())
}

function purchaseFiveMore(transactionID = operationID('discovery-card-pack')) {
  if (cardPackBusy.value) return false
  cardPackBusy.value = true
  cardPackError.value = ''
  try {
    const userIDs = discoveryStore.getNextEligibleIDs(
      5,
      walletStore.getSnapshot(),
      socialSnapshot.value.relationshipsByUserID,
      voiceActivityStore.getSnapshot().heardVoices.map((item) => item.voiceID),
    )
    if (userIDs.length !== 5) {
      cardPackError.value = cardPackCopy.value.notEnoughProfiles
      return false
    }
    if (walletBalance.value < 50) {
      cardPackModal.value = 'insufficient'
      return false
    }
    const wallet = walletStore.exchangeDiscoveryCards({
      cost: 50,
      userIDs,
      transactionID,
      dayKey: discoverySnapshot.value.dateKey,
    })
    updateWalletBalance(wallet.balance)
    cardPackModal.value = ''
    const nextUserID = discoverySnapshot.value.remainingUserIDs[0]
    if (nextUserID) showProfile(nextUserID)
    showNotice(cardPackCopy.value.packAdded)
    return true
  } catch (error) {
    if (error?.code === 'INSUFFICIENT_BALANCE') cardPackModal.value = 'insufficient'
    else cardPackError.value = cardPackCopy.value.purchaseFailed
    return false
  } finally {
    cardPackBusy.value = false
  }
}

function handleCoinPurchaseComplete(payload) {
  if (!payload?.transactionID) return
  activePanel.value = 'discovery'
  if (coinStorePurpose.value === 'translation' && canTranslate.value) {
    translationModal.value = walletBalance.value >= 5 ? 'confirm' : 'insufficient'
    nextTick(() => translationDialog.value?.focus())
  }
  if (coinStorePurpose.value === 'card-pack' && exhausted.value) {
    cardPackModal.value = walletBalance.value >= 50 ? 'confirm' : 'insufficient'
    nextTick(() => cardPackDialog.value?.focus())
  }
}

function decide(kind) {
  if (decisionBusy.value || exhausted.value || isReviewMode.value || entryPhase.value !== 'ready') return
  stopVoice()
  decisionBusy.value = true
  decisionFeedback.value = kind
  dragX.value = kind === 'like' ? window.innerWidth + 100 : -window.innerWidth - 100
  const duration = reducedMotionQuery?.matches ? 0 : 260
  window.clearTimeout(decisionTimer)
  decisionTimer = window.setTimeout(() => finishDecision(kind), duration)
}

function beginDrag(event) {
  const blockedControl = event.target.closest('input, textarea, select, label, [contenteditable="true"], [data-discovery-swipe-ignore]')
  const surfaceRect = event.currentTarget.getBoundingClientRect()
  const localX = event.clientX - surfaceRect.left
  const edgeGuard = Math.min(22, surfaceRect.width * .06)
  if (
    decisionBusy.value
    || exhausted.value
    || isReviewMode.value
    || closing.value
    || entryPhase.value !== 'ready'
    || filterOpen.value
    || requestOpen.value
    || translationModal.value
    || cardPackModal.value
    || pointerID !== null
    || event.isPrimary === false
    || (event.pointerType === 'mouse' && event.button !== 0)
    || blockedControl
    || localX <= edgeGuard
    || localX >= surfaceRect.width - edgeGuard
  ) return
  pointerID = event.pointerId
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pointerStartAt = performance.now()
  pointerIntent = 'unknown'
  dragging.value = false
}

function moveDrag(event) {
  if (event.pointerId !== pointerID) return
  const deltaX = event.clientX - pointerStartX
  const deltaY = event.clientY - pointerStartY
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) suppressPhotoClick = true
  if (pointerIntent === 'unknown' && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) pointerIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.2 ? 'horizontal' : 'vertical'
  if (pointerIntent !== 'horizontal') return
  if (!dragging.value) {
    dragging.value = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  event.preventDefault()
  if (Math.abs(deltaX) > 10) suppressClickUntil = performance.now() + 360
  stopVoice()
  dragX.value = Math.max(-170, Math.min(170, deltaX))
  decisionFeedback.value = dragX.value > 12 ? 'like' : dragX.value < -12 ? 'pass' : ''
}

function endDrag(event) {
  if (event.pointerId !== pointerID) return
  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  const elapsed = Math.max(1, performance.now() - pointerStartAt)
  const velocity = Math.abs(dragX.value) / elapsed
  const completed = pointerIntent === 'horizontal' && (Math.abs(dragX.value) >= 64 || (Math.abs(dragX.value) >= 30 && velocity >= .55))
  const kind = dragX.value > 0 ? 'like' : 'pass'
  dragging.value = false
  pointerID = null
  pointerIntent = 'unknown'
  window.setTimeout(() => { suppressPhotoClick = false }, 0)
  if (completed) decide(kind)
  else { dragX.value = 0; decisionFeedback.value = '' }
}

function cancelDrag(event) {
  if (event?.pointerId != null && pointerID !== null && event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
  dragging.value = false
  pointerID = null
  pointerIntent = 'unknown'
  window.setTimeout(() => { suppressPhotoClick = false }, 0)
  if (!decisionBusy.value) { dragX.value = 0; decisionFeedback.value = '' }
}

function guardClickAfterSwipe(event) {
  if (performance.now() > suppressClickUntil) return
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation?.()
}

function openPanel(panel) {
  if (decisionBusy.value) return
  stopVoice()
  cancelDrag()
  activePanel.value = panel
}

function closePanel() {
  activePanel.value = 'discovery'
  audioState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
}

function openFilter() {
  if (decisionBusy.value || filterOpen.value || entryPhase.value !== 'ready') return
  stopVoice()
  cancelDrag()
  filterOpen.value = true
}

function closeFilter() {
  if (!filterOpen.value) return
  filterOpen.value = false
  nextTick(() => filterTrigger.value?.focus())
}

function applyFilters(filters) {
  discoverySnapshot.value = discoveryStore.setFilters(
    filters,
    walletStore.getSnapshot(),
    socialSnapshot.value.relationshipsByUserID,
    voiceActivityStore.getSnapshot().heardVoices.map((item) => item.voiceID),
  )
  filterOpen.value = false
  const nextUserID = discoverySnapshot.value.remainingUserIDs[0]
  if (nextUserID) showProfile(nextUserID)
  nextTick(() => filterTrigger.value?.focus())
}

function openRequest() {
  if (addDisabled.value) return
  stopVoice()
  requestError.value = ''
  requestDraft.value = copy.value.addNote
  requestOpen.value = true
}

async function submitRequest() {
  if (requestBusy.value || !requestDraft.value.trim()) return
  const target = currentProfile.value
  if (!target) return
  requestBusy.value = true
  requestError.value = ''
  try {
    socialStore.sendFriendRequest(target.id, requestDraft.value, operationID('discovery-request'))
    requestOpen.value = false
    showNotice(`${copy.value.requestSent} · ${target.displayName}`)
  } catch {
    requestError.value = copy.value.requestFailed
  } finally {
    requestBusy.value = false
  }
}

function openReport() {
  stopVoice()
  reportError.value = ''
  reportTransaction.value = null
  activePanel.value = 'report-block'
}

function closeReport() {
  if (reportBusy.value) return
  reportError.value = ''
  reportTransaction.value = null
  activePanel.value = 'discovery'
}

async function submitReport(payload) {
  if (reportBusy.value) return
  const target = currentProfile.value
  const transaction = reportTransaction.value || {
    reportID: operationID('discovery-report'),
    hideID: operationID('discovery-report-hide'),
    blockID: operationID('discovery-block'),
  }
  reportTransaction.value = transaction
  reportBusy.value = true
  reportError.value = ''
  try {
    const context = {
      details: payload.details,
      targetType: 'voice',
      voiceID: target.voiceClip?.id || '',
      operationID: transaction.reportID,
    }
    await nativeBridge.reportUser(target.id, payload.reason, context, { pageInstanceID: 'voice-discovery-safety' })
    socialStore.reportUser(target.id, payload.reason, transaction.reportID, context)
    let removedFromFeed = false
    if (payload.hideContent) {
      stopVoice()
      discoverySnapshot.value = discoveryStore.decide({
        userID: target.id,
        kind: 'pass',
        operationID: transaction.hideID,
        walletSnapshot: walletStore.getSnapshot(),
        relationships: socialSnapshot.value.relationshipsByUserID,
        heardVoiceIDs: voiceActivityStore.getSnapshot().heardVoices.map((item) => item.voiceID),
      })
      removedFromFeed = true
    }
    if (payload.alsoBlock) {
      stopVoice()
      await nativeBridge.blockUser(target.id, transaction.blockID, { pageInstanceID: 'voice-discovery-safety' })
      try {
        socialStore.blockUser(target.id, transaction.blockID)
      } catch (storeError) {
        await nativeBridge.unblockUser(target.id, `${transaction.blockID}-rollback`, { pageInstanceID: 'voice-discovery-safety' }).catch(() => {})
        throw storeError
      }
      refreshDiscoverySnapshot()
    }
    const nextUserID = discoverySnapshot.value.remainingUserIDs[0]
    if ((removedFromFeed || payload.alsoBlock) && nextUserID) showProfile(nextUserID)
    activePanel.value = 'discovery'
    reportTransaction.value = null
    showNotice(removedFromFeed ? copy.value.reportHidden : copy.value.reportSaved)
  } catch {
    reportError.value = copy.value.reportFailed
  } finally {
    reportBusy.value = false
  }
}

function close() {
  if (closing.value || entryPhase.value !== 'ready' || decisionBusy.value) return
  closing.value = true
  stopVoice()
  cancelDrag()
  const rect = currentPhoto.value?.getBoundingClientRect()
  emit('close', { userID: currentProfile.value?.id || currentUserID.value, sourceRect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null })
}

function stopHiddenAudio() {
  if (document.visibilityState !== 'hidden') return
  stopVoice()
  cancelDrag()
  requestOpen.value = false
  filterOpen.value = false
  if (activePanel.value === 'report-block') activePanel.value = 'discovery'
  resetCoinSheetDrag()
  translationModal.value = ''
  cardPackModal.value = ''
  if (entryPhase.value !== 'ready') completeEntry()
}

function completeEntry() {
  entryAnimation?.cancel()
  entryAnimation = null
  entryPhase.value = 'ready'
}

async function runEntryAnimation() {
  if (!props.animateEntry) return
  await nextTick()
  if (disposed || reducedMotionQuery?.matches || !entrySurface.value) { completeEntry(); return }
  entryFrame = window.requestAnimationFrame(() => {
    if (disposed || !entrySurface.value) return
    entryPhase.value = 'opening'
    entryAnimation = entrySurface.value.animate([
      { clipPath: 'circle(0% at 50% 43%)', opacity: .18, transform: 'scale(.9)', filter: 'blur(8px)' },
      { clipPath: 'circle(24% at 50% 43%)', opacity: .92, transform: 'scale(.965)', filter: 'blur(1px)', offset: .5 },
      { clipPath: 'circle(150% at 50% 43%)', opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    ], { duration: 720, easing: 'cubic-bezier(.18,.76,.2,1)', fill: 'forwards' })
    entryAnimation.finished.catch(() => {}).finally(() => { if (!disposed) completeEntry() })
  })
}

function handleMotionPreference(event) {
  if (!event.matches) return
  if (entryPhase.value !== 'ready') completeEntry()
  if (decisionBusy.value) {
    window.clearTimeout(decisionTimer)
    decisionTimer = 0
    finishDecision(decisionFeedback.value || 'pass')
  }
}
function handleViewportChange() { if (entryPhase.value !== 'ready') completeEntry() }

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('visibilitychange', stopHiddenAudio)
  window.addEventListener('resize', handleViewportChange)
  window.visualViewport?.addEventListener('resize', handleViewportChange)
  if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', handleMotionPreference)
  else reducedMotionQuery.addListener(handleMotionPreference)
  runEntryAnimation()
})

onBeforeUnmount(() => {
  disposed = true
  window.cancelAnimationFrame(entryFrame)
  window.clearTimeout(decisionTimer)
  window.clearTimeout(noticeTimer)
  entryAnimation?.cancel()
  if (reducedMotionQuery?.removeEventListener) reducedMotionQuery.removeEventListener('change', handleMotionPreference)
  else reducedMotionQuery?.removeListener(handleMotionPreference)
  document.removeEventListener('visibilitychange', stopHiddenAudio)
  window.removeEventListener('resize', handleViewportChange)
  window.visualViewport?.removeEventListener('resize', handleViewportChange)
  unsubscribeSocial()
  nativeBridge.cancelPage('voice-discovery-translation')
  nativeBridge.cancelPage('voice-discovery-safety')
  nativeBridge.cancelPage(insufficientPurchasePageInstanceID)
  resetCoinSheetDrag()
  stopVoice()
})
</script>

<template>
  <Transition :name="panelTransitionName">
  <ReportBlockScreen v-if="activePanel === 'report-block'" :key="`report-block-${currentProfile.id}`" :person="currentProfile" :busy="reportBusy" :error="reportError" source="voice" @close="closeReport" @submit="submitReport" />
  <TranslationHistoryScreen v-else-if="activePanel === 'history'" :account-id="accountId" :coin-balance="walletBalance" @back="closePanel" />
  <CoinStoreScreen v-else-if="activePanel === 'coin-store'" :account-id="accountId" :initial-balance="walletBalance" @back="closeCoinStore" @balance-changed="updateWalletBalance" @purchase-complete="handleCoinPurchaseComplete" />

  <main v-else class="voice-discovery-screen app-screen" :class="[`is-entry-${entryPhase}`, { 'is-decision-busy': decisionBusy, 'is-exhausted': exhausted }]" :aria-busy="entryPhase !== 'ready' || decisionBusy ? 'true' : undefined">
    <span class="voice-discovery-orb voice-discovery-orb-peach" aria-hidden="true" />
    <span class="voice-discovery-orb voice-discovery-orb-lavender" aria-hidden="true" />
    <div
      ref="entrySurface"
      class="voice-discovery-entry-surface"
      :class="{ 'is-page-swiping': dragging }"
      :inert="entryPhase !== 'ready' || Boolean(filterOpen || requestOpen || translationModal || cardPackModal)"
      @click.capture="guardClickAfterSwipe"
      @pointerdown="beginDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="cancelDrag"
      @lostpointercapture="cancelDrag"
    >
      <header class="voice-discovery-toolbar">
        <button type="button" :aria-label="copy.dismiss" :disabled="closing || entryPhase !== 'ready'" :aria-disabled="decisionBusy" @click="close"><img :src="arrowLeftIcon" alt=""></button>
        <span />
        <nav>
          <button type="button" :aria-label="copy.history" :disabled="decisionBusy" @click="openPanel('history')"><img :src="historyIcon" alt=""></button>
          <button ref="filterTrigger" type="button" :aria-label="filterCopy.title" aria-haspopup="dialog" :aria-expanded="filterOpen" :disabled="decisionBusy" @click="openFilter"><img :src="filterIcon" alt=""></button>
        </nav>
      </header>

      <section class="voice-discovery-heading">
        <div><h1>{{ copy.title }}</h1><span aria-hidden="true"><i /><i /></span></div>
        <span class="voice-discovery-free" :class="{ empty: exhausted, bonus: discoverySnapshot.bonusRemainingCount > 0 }">
          <img :src="coinIcon" alt="">
          <span dir="ltr">{{ copy.freeToday.replace('{current}', discoverySnapshot.freeRemainingCount).replace('{total}', '7') }}</span>
        </span>
        <p>{{ copy.subtitle }}</p>
      </section>

      <div ref="contentScroll" class="voice-discovery-content">
        <template v-if="currentProfile">
        <section class="voice-discovery-stack" :style="cardStyle">
          <article v-if="nextProfile && !isReviewMode" class="voice-discovery-card voice-discovery-card-next" aria-hidden="true"><img :src="nextProfile.avatarAsset" alt=""></article>
          <article class="voice-discovery-card voice-discovery-card-current" :class="{ dragging, resetting: cardResetting }">
            <div class="voice-discovery-photo">
              <button class="voice-discovery-photo-open" type="button" :aria-label="`${commerceCopy.profile}: ${currentProfile.displayName}`" @click.stop="openProfile">
                <img ref="currentPhoto" :src="currentProfile.avatarAsset" :alt="currentProfile.displayName">
              </button>
              <span v-if="currentProfile.flagAsset" class="voice-discovery-flag"><img :src="currentProfile.flagAsset" alt=""></span>
              <button class="voice-discovery-more" type="button" :aria-label="copy.report" @click.stop="openReport"><img :src="moreIcon" alt=""></button>
              <b class="voice-discovery-swipe-feedback is-pass" :class="{ visible: decisionFeedback === 'pass' }">{{ copy.passFeedback }}</b>
              <b class="voice-discovery-swipe-feedback is-like" :class="{ visible: decisionFeedback === 'like' }">{{ copy.likeFeedback }}</b>
            </div>
            <footer class="voice-discovery-card-footer">
              <span class="voice-discovery-identity"><strong>{{ currentProfile.displayName }}</strong><small v-if="currentProfile.countryLabel">{{ currentProfile.countryLabel }} · {{ currentProfile.timezone }}</small></span>
              <button v-if="currentProfile.voiceClip" class="voice-discovery-player" :class="{ playing: isPlaying, paused: isPaused, active: isPlaying || isPaused }" type="button" data-discovery-swipe-ignore :aria-label="isPlaying ? audioCopy.pause : audioCopy.play" :aria-busy="audioBusy" :disabled="audioBusy || decisionBusy" @pointerdown.stop @click.stop="toggleVoice">
                <span class="voice-discovery-play"><img :src="isPlaying ? pauseIcon : playIcon" alt=""></span>
                <span class="voice-discovery-wave" :style="{ '--voice-progress': clipProgress }" aria-hidden="true"><i v-for="(height, index) in [8, 15, 22, 12, 25, 18, 9, 20, 14, 23, 11, 18, 8, 16, 10]" :key="index" :style="{ height: `${height}px` }" /></span>
                <time>{{ formatVoiceDuration(remainingTime) }}</time>
              </button>
            </footer>
          </article>
        </section>

        <p v-if="audioError" class="voice-discovery-error" role="alert">{{ copy.audioUnavailable }} <button type="button" @click="toggleVoice">{{ copy.retry }}</button></p>
        <section class="voice-discovery-transcript">
          <header><strong>{{ copy.languageNames[currentProfile.voiceClip.transcriptLanguage] || currentProfile.voiceClip.transcriptLanguage.toUpperCase() }}</strong><span>{{ translatedText ? commerceCopy.translated : copy.notTranslated }}</span></header>
          <p :lang="currentProfile.voiceClip.transcriptLanguage" :dir="['ar', 'he'].includes(currentProfile.voiceClip.transcriptLanguage) ? 'rtl' : 'ltr'">{{ currentProfile.voiceClip.transcript }}</p>
          <p v-if="translatedText" class="voice-discovery-translated-text" :lang="locale" :dir="['ar', 'he'].includes(locale) ? 'rtl' : 'ltr'">{{ translatedText }}</p>
        </section>
        <button class="voice-discovery-translate" type="button" :disabled="translationBusy || !canTranslate" @click="openTranslationConfirmation"><span><img :src="sparkleIcon" alt="">{{ translateLabel }}</span><b v-if="canTranslate" dir="ltr"><img :src="coinIcon" alt="">5</b></button>
        <p class="voice-discovery-match"><img :src="infoIcon" alt=""><span>{{ copy.matchReason }}</span></p>
        <section v-if="exhausted" class="voice-discovery-exhausted" aria-live="polite">
          <span><strong>{{ cardPackCopy.exhaustedTitle }}</strong><small>{{ cardPackCopy.exhaustedSubtitle }}</small></span>
          <button ref="cardPackTrigger" type="button" :disabled="cardPackBusy" @click="openCardPackConfirmation"><img :src="coinIcon" alt=""><b dir="ltr">50 · +5</b></button>
        </section>
        </template>
        <section v-else class="voice-discovery-no-profile" aria-live="polite">
          <strong>{{ cardPackCopy.exhaustedTitle }}</strong>
          <small>{{ cardPackCopy.exhaustedSubtitle }}</small>
          <button ref="cardPackTrigger" type="button" :disabled="cardPackBusy" @click="openCardPackConfirmation"><img :src="coinIcon" alt=""><b dir="ltr">50 · +5</b></button>
        </section>
      </div>

      <p v-if="notice" class="voice-discovery-notice" role="status">{{ notice }}</p>
      <footer v-if="currentProfile" class="voice-discovery-actions" dir="ltr">
        <button class="voice-discovery-pass" type="button" :aria-label="copy.skip" :disabled="decisionBusy || exhausted || isReviewMode" @click="decide('pass')"><img :src="skipButtonIcon" alt=""></button>
        <button class="voice-discovery-like" :class="{ selected: isLiked }" type="button" :aria-label="copy.like" :aria-pressed="isLiked" :disabled="decisionBusy || likeBusy" @click="toggleLike"><img :src="heartIcon" alt=""><b v-if="currentLikes !== null">{{ currentLikes }}</b></button>
        <button class="voice-discovery-add" type="button" :disabled="addDisabled || decisionBusy" @click="openRequest"><img :src="personAddIcon" alt=""><span>{{ addLabel }}</span></button>
        <button class="voice-discovery-report" type="button" :disabled="decisionBusy" @click="openReport">{{ copy.report }}</button>
      </footer>
    </div>

    <DiscoveryFilterSheet v-if="filterOpen" :filters="discoverySnapshot.filters" @close="closeFilter" @apply="applyFilters" />

    <div v-if="requestOpen" class="voice-discovery-modal" role="presentation" @click.self="requestOpen = false">
      <section class="voice-discovery-sheet" role="dialog" aria-modal="true" :aria-label="copy.requestTitle">
        <span class="voice-discovery-sheet-handle" />
        <header><span class="voice-discovery-sheet-avatar"><img :src="currentProfile.avatarAsset" alt=""><i><img :src="currentProfile.flagAsset" alt=""></i></span><div><h2>{{ currentProfile.displayName }}</h2><p>{{ currentProfile.countryLabel }} · {{ currentProfile.languages?.map((item) => copy.languageNames[item] || item.toUpperCase()).join(' · ') }}</p></div></header>
        <label><strong>{{ copy.requestTitle }}</strong><textarea v-model="requestDraft" maxlength="200" :placeholder="copy.requestPlaceholder" /><small>{{ requestDraft.length }} / 200</small></label>
        <div class="voice-discovery-request-templates" :aria-label="copy.requestPlaceholder"><button v-for="template in commerceCopy.requestTemplates" :key="template" type="button" :class="{ selected: requestDraft === template }" :disabled="requestBusy" @click="requestDraft = template">{{ template }}</button></div>
        <p v-if="requestError" class="voice-discovery-sheet-error" role="alert">{{ requestError }}</p>
        <button class="voice-discovery-sheet-primary" type="button" :disabled="requestBusy || !requestDraft.trim()" @click="submitRequest">{{ copy.sendRequest }}</button>
        <button class="voice-discovery-sheet-cancel" type="button" :disabled="requestBusy" @click="requestOpen = false">{{ copy.cancel }}</button>
        <p class="voice-discovery-sheet-note">{{ copy.requestHint }}</p>
      </section>
    </div>

    <div v-if="translationModal" class="voice-discovery-modal is-coin-spend-sheet" role="presentation" @click.self="closeTranslationModal" @keydown.esc.stop="closeTranslationModal">
      <section v-if="translationModal === 'confirm'" ref="translationDialog" class="voice-discovery-coin-dialog is-confirm" :class="{ 'is-dragging': coinSheetDragging && coinSheetKind === 'translation' }" :style="{ '--coin-sheet-drag-offset': `${coinSheetKind === 'translation' ? coinSheetDragOffset : 0}px` }" role="dialog" aria-modal="true" :aria-label="commerceCopy.confirmTitle" :aria-busy="translationBusy" tabindex="-1">
        <div class="voice-discovery-coin-drag-zone" aria-hidden="true" @click.stop @pointerdown="beginCoinSheetDrag($event, 'translation')" @pointermove="moveCoinSheetDrag" @pointerup="finishCoinSheetDrag" @pointercancel="finishCoinSheetDrag($event, true)" @lostpointercapture="finishCoinSheetDrag($event, true)"><span class="voice-discovery-coin-handle" /></div>
        <header class="voice-discovery-coin-header">
          <span class="voice-discovery-coin-art"><img :src="coinIcon" alt=""></span>
          <span><h2>{{ commerceCopy.confirmTitle }}</h2><p>{{ commerceCopy.confirmBody }}</p></span>
        </header>
        <dl class="voice-discovery-coin-breakdown">
          <div><dt>{{ commerceCopy.cost }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">5</dd></div>
          <div><dt>{{ commerceCopy.balance }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">{{ walletBalance }}</dd></div>
          <div><dt>{{ commerceCopy.after }}</dt><dd class="is-after" dir="ltr"><img :src="coinIcon" alt="">{{ Math.max(0, walletBalance - 5) }}</dd></div>
        </dl>
        <p v-if="translationError" class="voice-discovery-sheet-error" role="alert">{{ translationError }}</p>
        <div class="voice-discovery-coin-actions">
          <button class="is-cancel" type="button" :disabled="translationBusy" @click="closeTranslationModal">{{ commerceCopy.cancel }}</button>
          <button class="is-primary" type="button" :disabled="translationBusy" @click="translateCurrentVoice">{{ translationBusy ? commerceCopy.translating : commerceCopy.confirm }}</button>
        </div>
        <p class="voice-discovery-coin-note">{{ commerceCopy.confirmSafetyNote }}</p>
      </section>
      <section v-else ref="translationDialog" class="voice-discovery-coin-dialog is-insufficient" :class="{ 'is-dragging': coinSheetDragging && coinSheetKind === 'translation' }" :style="{ '--coin-sheet-drag-offset': `${coinSheetKind === 'translation' ? coinSheetDragOffset : 0}px` }" role="dialog" aria-modal="true" :aria-label="commerceCopy.insufficientTitle" :aria-busy="insufficientPurchaseBusy || insufficientProductsLoading" tabindex="-1">
        <div class="voice-discovery-coin-drag-zone" aria-hidden="true" @click.stop @pointerdown="beginCoinSheetDrag($event, 'translation')" @pointermove="moveCoinSheetDrag" @pointerup="finishCoinSheetDrag" @pointercancel="finishCoinSheetDrag($event, true)" @lostpointercapture="finishCoinSheetDrag($event, true)"><span class="voice-discovery-coin-handle" /></div>
        <header class="voice-discovery-coin-header">
          <img class="voice-discovery-insufficient-art" :src="insufficientWarningArt" alt="">
          <span><h2>{{ commerceCopy.insufficientTitle }}</h2><p>{{ commerceCopy.insufficientNeed.replace('{cost}', '5') }}</p></span>
        </header>
        <div class="voice-discovery-coin-shortfall"><span>{{ commerceCopy.shortBy }}</span><b dir="ltr"><img :src="coinIcon" alt="">{{ Math.max(0, 5 - walletBalance) }}</b></div>
        <div class="voice-discovery-coin-packs" role="radiogroup" :aria-label="commerceCopy.storeSubtitle">
          <button v-for="pack in insufficientCoinPacks" :key="pack.productID" type="button" role="radio" :aria-checked="selectedInsufficientProductID === pack.productID" :class="{ selected: selectedInsufficientProductID === pack.productID }" :disabled="insufficientPurchaseBusy" @click="selectInsufficientProduct(pack.productID)">
            <span><img :src="coinIcon" alt=""><strong dir="ltr">{{ pack.coins }}</strong><small v-if="pack.coins === 180">{{ commerceCopy.storePopular }}</small></span>
            <b dir="ltr">{{ pack.displayPrice }}</b>
          </button>
        </div>
        <div class="voice-discovery-coin-actions">
          <button class="is-cancel" type="button" :disabled="insufficientPurchaseBusy" @click="closeTranslationModal">{{ commerceCopy.cancel }}</button>
          <button class="is-primary" type="button" :disabled="insufficientPurchaseBusy || insufficientProductsLoading || !selectedInsufficientProduct" @click="buySelectedInsufficientProduct">
            {{ commerceCopy.getCoins }}
          </button>
        </div>
        <p class="voice-discovery-coin-note" :role="insufficientPurchaseMessageKind === 'error' ? 'alert' : 'status'" aria-live="polite">{{ insufficientPurchaseNote }}</p>
      </section>
    </div>

    <div v-if="cardPackModal" class="voice-discovery-modal" :class="{ 'is-card-pack-sheet': cardPackModal === 'confirm', 'is-centered': cardPackModal !== 'confirm' }" role="presentation" @click.self="closeCardPackModal" @keydown.esc.stop="closeCardPackModal">
      <section v-if="cardPackModal === 'confirm'" ref="cardPackDialog" class="voice-discovery-card-pack-dialog" :class="{ 'is-dragging': coinSheetDragging && coinSheetKind === 'card-pack' }" :style="{ '--coin-sheet-drag-offset': `${coinSheetKind === 'card-pack' ? coinSheetDragOffset : 0}px` }" role="dialog" aria-modal="true" aria-describedby="voice-discovery-card-pack-description" :aria-label="cardPackCopy.confirmTitle" :aria-busy="cardPackBusy" tabindex="-1">
        <div class="voice-discovery-card-pack-drag-zone" aria-hidden="true" @click.stop @pointerdown="beginCoinSheetDrag($event, 'card-pack')" @pointermove="moveCoinSheetDrag" @pointerup="finishCoinSheetDrag" @pointercancel="finishCoinSheetDrag($event, true)" @lostpointercapture="finishCoinSheetDrag($event, true)"><span class="voice-discovery-card-pack-handle" /></div>
        <header class="voice-discovery-card-pack-header">
          <span class="voice-discovery-card-pack-art"><img :src="coinIcon" alt=""></span>
          <span><h2>{{ cardPackCopy.confirmTitle }}</h2><p id="voice-discovery-card-pack-description">{{ cardPackCopy.confirmBody }}</p></span>
        </header>
        <dl class="voice-discovery-card-pack-breakdown">
          <div><dt>{{ cardPackCopy.cost }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">50</dd></div>
          <div><dt>{{ cardPackCopy.balance }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">{{ walletBalance }}</dd></div>
          <div><dt>{{ cardPackCopy.after }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">{{ Math.max(0, walletBalance - 50) }}</dd></div>
        </dl>
        <p class="voice-discovery-card-pack-assurance"><img :src="infoIcon" alt=""><span>{{ cardPackCopy.availabilityNote }}</span></p>
        <p v-if="cardPackError" class="voice-discovery-sheet-error" role="alert">{{ cardPackError }}</p>
        <div class="voice-discovery-card-pack-actions">
          <button class="voice-discovery-card-pack-cancel" type="button" :disabled="cardPackBusy" @click="closeCardPackModal">{{ cardPackCopy.cancel }}</button>
          <button class="voice-discovery-card-pack-confirm" type="button" :disabled="cardPackBusy" @click="purchaseFiveMore()">{{ cardPackBusy ? cardPackCopy.processing : cardPackCopy.confirm }}</button>
        </div>
        <p class="voice-discovery-card-pack-note">{{ cardPackCopy.safetyNote }}</p>
      </section>
      <section v-else class="voice-discovery-translation-dialog is-insufficient" role="dialog" aria-modal="true" :aria-label="cardPackCopy.insufficientTitle">
        <span class="voice-discovery-translation-icon"><img :src="coinIcon" alt=""></span>
        <h2>{{ cardPackCopy.insufficientTitle }}</h2>
        <p>{{ cardPackCopy.insufficientBody.replace('{amount}', Math.max(0, 50 - walletBalance)) }}</p>
        <button class="voice-discovery-sheet-primary" type="button" @click="openCoinStore('card-pack')">{{ cardPackCopy.getCoins }}</button>
        <button class="voice-discovery-sheet-cancel" type="button" @click="cardPackModal = ''">{{ cardPackCopy.cancel }}</button>
      </section>
    </div>
  </main>
  </Transition>
</template>
