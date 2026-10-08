<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import cameraHeroIcon from '../assets/icons/camera-hero.svg'
import cameraIcon from '../assets/icons/camera.svg'
import checkGreenIcon from '../assets/icons/check-green.svg'
import checkLargeIcon from '../assets/icons/check-large.svg'
import micHeroIcon from '../assets/icons/mic-hero.svg'
import micIcon from '../assets/icons/mic.svg'
import shieldCheckIcon from '../assets/icons/shield-check.svg'
import warningHeroIcon from '../assets/icons/warning-hero.svg'
import portrait02 from '../assets/portraits/portrait-02.png'
import portrait03 from '../assets/portraits/portrait-03.png'
import portrait04 from '../assets/portraits/portrait-04.png'
import portrait07 from '../assets/portraits/portrait-07.png'
import portrait09 from '../assets/portraits/portrait-09.png'
import { discoveryDatasetSummary, discoveryPeople, firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'
import { registrationContent, registrationInterests } from '../data/registrationContent'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { permissionContent } from '../data/permissionContent'
import { languageOptions, useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { accountErrorMessageKey, oivoxAccountApi } from '../services/oivoxAccountApi'
import { createLivenessChallenge, createOpaqueID, createRegistrationSubmissionID } from '../services/livenessFlow'
import { saveLocalSupportTicket, saveNotificationPreference, savePublishedVoiceClip } from '../services/localBusinessStore'
import { resolveVerificationPermissions } from '../services/verificationPermissionGate'
import { unlockVoiceEarth } from '../services/voiceEarthAccess'
import { EMPTY_VOICE_PLAYBACK_STATE, voicePlaybackService } from '../services/voicePlaybackService'

const props = defineProps({ draft: { type: Object, required: true } })
const emit = defineEmits(['back-to-auth', 'registered', 'authenticated'])
const { locale, t } = useI18n()
const copy = computed(() => registrationContent(locale.value))
const postCopy = computed(() => postRegistrationContent(locale.value))
const permissionCopy = computed(() => permissionContent(locale.value))
const interestOptions = computed(() => registrationInterests(locale.value))

const stage = ref('profile')
const questionIndex = ref(0)
const registrationTransitionDirection = ref('forward')
const answers = reactive(props.draft.onboarding?.questionnaire?.length === 6 ? [...props.draft.onboarding.questionnaire] : Array(6).fill(''))
const nickname = ref(props.draft.profile?.displayName || '')
const presetAvatars = { 'portrait-02': portrait02, 'portrait-03': portrait03, 'portrait-04': portrait04, 'portrait-07': portrait07, 'portrait-09': portrait09 }
const initialAvatarSource = ['preset', 'photoLibrary', 'camera'].includes(props.draft.profile?.avatarSource) ? props.draft.profile.avatarSource : ''
const initialAvatarKey = initialAvatarSource === 'preset' && presetAvatars[props.draft.profile?.avatarKey] ? props.draft.profile.avatarKey : ''
const initialLocalAssetID = ['photoLibrary', 'camera'].includes(initialAvatarSource) && /^avatar_[A-Za-z0-9_-]{8,100}$/.test(props.draft.profile?.localAssetID || '') ? props.draft.profile.localAssetID : ''
const avatarStatus = ref(props.draft.profile?.avatarStatus === 'ready' && (initialAvatarKey || initialLocalAssetID) ? 'ready' : 'placeholder')
const avatarSource = ref(avatarStatus.value === 'ready' ? initialAvatarSource : '')
const avatarKey = ref(avatarStatus.value === 'ready' ? initialAvatarKey : '')
const avatarLocalAssetID = ref(avatarStatus.value === 'ready' ? initialLocalAssetID : '')
const avatarPreview = ref(initialAvatarKey ? presetAvatars[initialAvatarKey] : '')
const selectedLanguages = ref(props.draft.profile?.spokenLanguages || [locale.value])
const selectedInterests = ref(props.draft.onboarding?.interests || [])
const error = ref('')
const errorCode = ref('')
const nicknameError = ref('')
const avatarError = ref('')
const profileAdvancing = ref(false)
const busy = ref(false)
const permissionNote = ref('')
const permissionPromptPermissions = ref([])
const permissionPromptCanOpenSettings = ref(false)
const permissionPromptError = ref('')
const permissionSettingsDialog = ref(null)
const completedUser = ref(null)
const nicknameInput = ref(null)
let advanceTimer = 0
let revealTimers = []
let recordTimer = 0
let recordingStartedAt = 0
let registrationPromise = null
let permissionPromptTrigger = null
let disposed = false
const pageInstanceID = createOpaqueID('registration-page')
const registrationSubmissionID = createRegistrationSubmissionID()
const livenessAttempt = ref(null)
const attemptNumber = ref(0)
const visibleDigits = ref(['symbol', 'symbol', 'symbol'])
const faceCount = ref(0)
const dynamicFaceDetected = ref(false)
const usesNativeLivenessPreview = ref(false)
const livenessMessage = ref('')
const supportCategory = ref('user_or_clip')
const supportDetails = ref('')
const supportDiagnostics = ref(true)
const supportAttachmentIDs = ref([])
const supportStatus = ref('')
const voiceClip = ref(null)
const voiceState = ref('idle')
const secondsLeft = ref(7)
const guidelineAccepted = ref(false)
const playbackState = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const isPlaying = computed(() => playbackState.value.id === voiceClip.value?.id && playbackState.value.status === 'playing')
const notificationNote = ref('')
const voiceRecordReturnStage = ref('complete')
const lockedVoices = Object.freeze(firstDayFreeDiscoveryIDs.slice(0, 6).map((id) => discoveryPeople[id]))
const communitySummary = computed(() => copy.value.completeCommunity
  .replace('{voiceCount}', new Intl.NumberFormat(locale.value).format(discoveryDatasetSummary.voiceCount))
  .replace('{countryCount}', new Intl.NumberFormat(locale.value).format(discoveryDatasetSummary.countryCount)))
const permissionPromptOpen = computed(() => permissionPromptPermissions.value.length > 0)
const permissionPromptBody = computed(() => {
  if (!nativeBridge.isNative) return permissionCopy.value.nativeOnly
  if (permissionPromptPermissions.value.length > 1) return permissionCopy.value.bothSettingsBody
  return permissionPromptPermissions.value[0] === 'microphone'
    ? permissionCopy.value.microphoneSettingsBody
    : permissionCopy.value.cameraSettingsBody
})

const outerStep = computed(() => ({ profile: 2, questionnaire: 3, interests: 4, communication: 4, microphone: 5, camera: 6, verificationIntro: 7, verificationDigits: 7, processing: 7, verificationFailed: 7, registrationFailed: 7, submitting: 7 }[stage.value] || null))
const currentQuestion = computed(() => copy.value.questions[questionIndex.value])
const selectedInterestLabels = computed(() => interestOptions.value.filter(([id]) => selectedInterests.value.includes(id)).map(([, label]) => label))
const questionLabel = (index) => copy.value.questions[index]?.options.find(([id]) => id === answers[index])?.[1] || '—'
const canSubmitLiveness = computed(() => stage.value === 'verificationDigits' && livenessAttempt.value?.captureState === 'recording' && faceCount.value === 1 && dynamicFaceDetected.value && visibleDigits.value.every((value) => Number.isInteger(value)))
const faceMessage = computed(() => {
  if (faceCount.value > 1) return postCopy.value.multipleFaces
  if (faceCount.value !== 1) return postCopy.value.noFace
  return dynamicFaceDetected.value ? postCopy.value.dynamicFaceReady : postCopy.value.moveFaceNaturally
})
const nicknameValid = computed(() => nickname.value.trim().length >= 1 && nickname.value.trim().length <= 32)
const avatarReady = computed(() => avatarStatus.value === 'ready' && Boolean(avatarKey.value || avatarLocalAssetID.value) && Boolean(avatarPreview.value))
const registrationTransitionKey = computed(() => stage.value === 'questionnaire' ? `${stage.value}-${questionIndex.value}` : stage.value)
const registrationTransitionRanks = Object.freeze({
  profile: 20, questionnaire: 30, interests: 40, communication: 45, microphone: 50, camera: 60,
  verificationIntro: 70, verificationDigits: 71, processing: 72, verificationFailed: 72,
  registrationFailed: 72, support: 73, submitting: 74, complete: 80, voiceEarthLocked: 81,
  voiceRecord: 82, voicePreview: 83, notification: 84,
})

function registrationTransitionRank(nextStage, nextQuestion) {
  return (registrationTransitionRanks[nextStage] || 0) + (nextStage === 'questionnaire' ? nextQuestion / 10 : 0)
}

function clearError() {
  error.value = ''
  errorCode.value = ''
}

function beginVoiceRecording(returnStage = 'complete') {
  if (busy.value) return
  clearError()
  voiceRecordReturnStage.value = returnStage
  stage.value = 'voiceRecord'
}

function skipFirstVoice() {
  if (busy.value) return
  clearError()
  stage.value = 'voiceEarthLocked'
}

function goBack() {
  clearError()
  if (stage.value === 'profile') return emit('back-to-auth', buildDraft())
  if (stage.value === 'questionnaire') {
    if (questionIndex.value > 0) questionIndex.value -= 1
    else stage.value = 'profile'
    return
  }
  const previous = {
    interests: 'questionnaire', communication: 'interests', microphone: 'communication', camera: 'microphone',
    verificationIntro: 'camera', verificationDigits: 'verificationIntro', verificationFailed: 'verificationDigits', submitting: 'verificationDigits',
  }
  if (stage.value === 'interests') questionIndex.value = 5
  stage.value = previous[stage.value] || 'profile'
}

function buildDraft() {
  return {
    ...props.draft,
    profile: {
      displayName: nickname.value.trim(),
      avatarStatus: avatarStatus.value,
      avatarSource: avatarSource.value || null,
      ...(avatarKey.value ? { avatarKey: avatarKey.value } : {}),
      ...(avatarLocalAssetID.value ? { localAssetID: avatarLocalAssetID.value } : {}),
      spokenLanguages: [...selectedLanguages.value],
      preferredLanguage: locale.value,
    },
    onboarding: { questionnaire: [...answers], interests: [...selectedInterests.value] },
  }
}

async function finishProfile() {
  if (profileAdvancing.value || avatarStatus.value === 'processing') return
  profileAdvancing.value = true
  clearError()
  nicknameError.value = nicknameValid.value ? '' : copy.value.nicknameRequired
  avatarError.value = avatarReady.value ? '' : copy.value.avatarRequired
  if (nicknameError.value || avatarError.value) {
    if (nicknameError.value) {
      await nextTick()
      nicknameInput.value?.focus()
    }
    profileAdvancing.value = false
    return
  }
  if (!selectedLanguages.value.length) selectedLanguages.value = [locale.value]
  stage.value = 'questionnaire'
  profileAdvancing.value = false
}

function toggleLanguage(code) {
  const values = selectedLanguages.value
  if (values.includes(code)) {
    if (values.length > 1) selectedLanguages.value = values.filter((item) => item !== code)
  } else selectedLanguages.value = [...values, code]
}

function chooseAnswer(value) {
  window.clearTimeout(advanceTimer)
  answers[questionIndex.value] = value
  advanceQuestion()
}

function skipQuestion() {
  window.clearTimeout(advanceTimer)
  answers[questionIndex.value] = 'skipped'
  advanceQuestion()
}

function advanceQuestion() {
  if (questionIndex.value < 5) {
    advanceTimer = window.setTimeout(() => { questionIndex.value += 1 }, 180)
  } else {
    advanceTimer = window.setTimeout(() => { stage.value = 'interests' }, 180)
  }
}

function toggleInterest(id) {
  clearError()
  if (selectedInterests.value.includes(id)) selectedInterests.value = selectedInterests.value.filter((value) => value !== id)
  else if (selectedInterests.value.length < 5) selectedInterests.value = [...selectedInterests.value, id]
}

function finishInterests() {
  if (selectedInterests.value.length < 2) {
    error.value = copy.value.chooseMore
    return
  }
  stage.value = 'communication'
}

function showPermissionPrompt(permissions, { canOpenSettings = false, trigger = null } = {}) {
  permissionPromptPermissions.value = [...new Set(permissions)]
  permissionPromptCanOpenSettings.value = canOpenSettings && nativeBridge.isNative
  permissionPromptError.value = ''
  permissionPromptTrigger = trigger
  nextTick(() => permissionSettingsDialog.value?.focus())
}

function closePermissionPrompt() {
  if (busy.value) return
  permissionPromptPermissions.value = []
  permissionPromptCanOpenSettings.value = false
  permissionPromptError.value = ''
  const trigger = permissionPromptTrigger
  permissionPromptTrigger = null
  nextTick(() => trigger?.focus?.())
}

async function openPermissionSettings() {
  if (busy.value || !permissionPromptCanOpenSettings.value) return
  busy.value = true
  permissionPromptError.value = ''
  try {
    const result = await nativeBridge.openAppSettings({ pageInstanceID })
    if (!result?.opened) permissionPromptError.value = permissionCopy.value.settingsOpenFailed
  } catch (settingsError) {
    if (settingsError?.code !== 'PAGE_DISPOSED') permissionPromptError.value = permissionCopy.value.settingsOpenFailed
  } finally {
    if (!disposed) busy.value = false
  }
}

function skipPermission(permission) {
  if (busy.value) return
  permissionNote.value = ''
  stage.value = permission === 'microphone' ? 'camera' : 'verificationIntro'
}

async function requestPermission(permission, event) {
  if (busy.value) return
  const trigger = event?.currentTarget || document.activeElement
  busy.value = true
  permissionNote.value = ''
  try {
    const result = await nativeBridge.requestPermission(permission, { pageInstanceID })
    if (disposed) return
    const granted = result?.granted === true
    permissionNote.value = permission === 'microphone'
      ? (granted ? copy.value.permissionGranted : permissionCopy.value.microphoneRequired)
      : (granted ? copy.value.cameraGranted : permissionCopy.value.cameraRequired)
    if (!granted) {
      showPermissionPrompt([permission], {
        canOpenSettings: ['denied', 'restricted'].includes(result?.status),
        trigger,
      })
      return
    }
    stage.value = permission === 'microphone' ? 'camera' : 'verificationIntro'
    permissionNote.value = ''
  } catch (permissionError) {
    if (permissionError?.code !== 'PAGE_DISPOSED') permissionNote.value = t('requestFailed')
  } finally {
    if (!disposed) busy.value = false
  }
}

function clearNicknameError() {
  nicknameError.value = ''
  clearError()
}

function resetAvatar(status = 'placeholder') {
  avatarPreview.value = ''
  avatarKey.value = ''
  avatarLocalAssetID.value = ''
  avatarSource.value = ''
  avatarStatus.value = status
}

function avatarFailure(message) {
  resetAvatar('failed')
  avatarError.value = message
}

function cancelPhotoSelection() {
  resetAvatar('placeholder')
  avatarError.value = copy.value.avatarCancelled
}

async function openPhotoPicker() {
  if (avatarStatus.value === 'processing') return
  avatarError.value = ''
  if (!nativeBridge.isNative) {
    avatarError.value = permissionCopy.value.nativeOnly
    return
  }
  avatarStatus.value = 'processing'
  try {
    const result = await nativeBridge.chooseAvatar({
      photoLibraryLabel: copy.value.chooseFromPhotos,
      cameraLabel: copy.value.takePhoto,
      cancelLabel: copy.value.cancel,
    }, { pageInstanceID, timeout: 120000 })
    if (result?.cancelled) {
      cancelPhotoSelection()
      return
    }
    if (!['photoLibrary', 'camera'].includes(result?.source) || !/^avatar_[A-Za-z0-9_-]{8,100}$/.test(result?.localAssetID || '') || !String(result?.previewDataURL || '').startsWith('data:image/')) throw new Error('Invalid avatar result')
    avatarPreview.value = result.previewDataURL
    avatarLocalAssetID.value = result.localAssetID
    avatarKey.value = ''
    avatarSource.value = result.source
    avatarStatus.value = 'ready'
  } catch (pickerError) {
    avatarFailure(pickerError.code === 'PERMISSION_DENIED' ? copy.value.avatarPermissionDenied : pickerError.code === 'AVATAR_DECODE_FAILED' ? copy.value.avatarDecodeFailed : copy.value.avatarProcessingFailed)
  }
}

function clearRevealTimers() {
  revealTimers.forEach((timer) => window.clearTimeout(timer))
  revealTimers = []
}

async function releaseLiveness() {
  clearRevealTimers()
  const sessionID = livenessAttempt.value?.mediaSessionID
  if (sessionID) await nativeBridge.releaseLiveness(sessionID, { pageInstanceID }).catch(() => {})
  if (livenessAttempt.value) {
    livenessAttempt.value.mediaSessionID = null
    livenessAttempt.value.captureState = 'released'
  }
  usesNativeLivenessPreview.value = false
  dynamicFaceDetected.value = false
}

async function startNativeLiveness() {
  if (!livenessAttempt.value || stage.value !== 'verificationDigits') return
  await nextTick()
  const target = document.querySelector('.digit-face')?.getBoundingClientRect()
  if (!target) return
  livenessAttempt.value.captureState = 'cameraStarting'
  livenessMessage.value = faceMessage.value
  try {
    const result = await nativeBridge.startLiveness({
      attemptID: livenessAttempt.value.id,
      previewRect: { x: target.x, y: target.y, width: target.width, height: target.height },
      cornerRadius: target.width / 2,
      recordingLabel: copy.value.recording,
      requireSingleFace: true,
    }, { pageInstanceID, timeout: 20000 })
    if (stage.value !== 'verificationDigits') return
    livenessAttempt.value.mediaSessionID = result?.sessionID || null
    livenessAttempt.value.captureState = 'recording'
    usesNativeLivenessPreview.value = result?.usesNativePreview === true
    faceCount.value = Number(result?.faceCount ?? (nativeBridge.isNative ? 0 : 1))
    dynamicFaceDetected.value = result?.dynamicFaceDetected === true
    livenessMessage.value = faceMessage.value
  } catch (nativeError) {
    usesNativeLivenessPreview.value = false
    livenessAttempt.value.captureState = 'failed'
    error.value = nativeError.code === 'PERMISSION_DENIED' ? permissionCopy.value.cameraRequired : t('requestFailed')
  }
}

async function beginLivenessAttempt() {
  if (busy.value) return
  const trigger = document.activeElement
  busy.value = true
  try {
    clearError()
    const permissionResult = await resolveVerificationPermissions(nativeBridge, { pageInstanceID })
    if (disposed) return
    if (!permissionResult.granted) {
      const settingsPermissions = permissionResult.missing.filter((permission) => ['denied', 'restricted'].includes(permissionResult.statuses[permission]))
      showPermissionPrompt(settingsPermissions.length ? settingsPermissions : permissionResult.missing, {
        canOpenSettings: permissionResult.needsSettings,
        trigger,
      })
      return
    }
    const previousDigits = livenessAttempt.value?.digits || []
    await releaseLiveness()
    registrationPromise = null
    attemptNumber.value += 1
    const attempt = createLivenessChallenge(undefined, previousDigits)
    attempt.attemptNumber = attemptNumber.value
    livenessAttempt.value = attempt
    visibleDigits.value = ['symbol', 'symbol', 'symbol']
    faceCount.value = 0
    dynamicFaceDetected.value = false
    livenessMessage.value = postCopy.value.noFace
    stage.value = 'verificationDigits'
    attempt.displayState = 'rolling'
    attempt.digits.forEach((digit, index) => {
      revealTimers.push(window.setTimeout(() => {
        const next = [...visibleDigits.value]
        next[index] = digit
        visibleDigits.value = next
        if (index === 2) {
          attempt.displayState = 'revealed'
          startNativeLiveness()
        }
      }, 420 + index * 420))
    })
  } catch (permissionError) {
    if (permissionError?.code !== 'PAGE_DISPOSED') error.value = t('requestFailed')
  } finally {
    if (!disposed) busy.value = false
  }
}

async function processLiveness() {
  if (busy.value || !canSubmitLiveness.value) return
  busy.value = true
  clearError()
  stage.value = 'processing'
  livenessAttempt.value.submittedAt = new Date().toISOString()
  try {
    await nativeBridge.stopLiveness(livenessAttempt.value.mediaSessionID, { pageInstanceID, timeout: 10000 })
    livenessAttempt.value.captureState = 'stopped'
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    Object.assign(livenessAttempt.value, {
      outcome: 'passed',
      outcomeSource: 'native-dynamic-face',
      fixtureID: 'dynamic-face-v1',
      failureCode: null,
      completedAt: new Date().toISOString(),
    })
    await releaseLiveness()
    await submitRegistration()
  } catch (nativeError) {
    error.value = t('requestFailed')
    stage.value = 'verificationDigits'
  } finally {
    busy.value = false
  }
}

async function submitRegistration() {
  if (registrationPromise) return registrationPromise
  busy.value = true
  clearError()
  stage.value = 'submitting'
  registrationPromise = oivoxAccountApi.register({
      email: props.draft.email,
      password: props.draft.password,
      ageRange: props.draft.ageRange,
      acceptedTerms: props.draft.acceptedTerms === true,
      termsVersion: props.draft.termsVersion,
      profile: {
        displayName: nickname.value.trim(),
        avatarSource: avatarSource.value,
        ...(avatarKey.value ? { avatarKey: avatarKey.value } : {}),
        ...(avatarLocalAssetID.value ? { localAssetID: avatarLocalAssetID.value } : {}),
        spokenLanguages: [...selectedLanguages.value],
        preferredLanguage: locale.value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      },
      onboarding: { questionnaire: [...answers], interests: [...selectedInterests.value] },
      verification: {
        status: 'passed', method: 'local-dynamic-face', attemptID: livenessAttempt.value.id,
        challengeID: livenessAttempt.value.challengeID, fixtureID: livenessAttempt.value.fixtureID,
        completedAt: livenessAttempt.value.completedAt,
      },
    }, registrationSubmissionID)
  try {
    const result = await registrationPromise
    completedUser.value = result.user
    emit('registered', result.user)
    stage.value = 'complete'
  } catch (requestError) {
    errorCode.value = requestError.code || 'REQUEST_FAILED'
    error.value = errorCode.value === 'EMAIL_IN_USE' ? copy.value.emailInUse
      : errorCode.value === 'AVATAR_REQUIRED' ? copy.value.avatarRequired
        : errorCode.value === 'INVALID_DISPLAY_NAME' ? copy.value.nicknameRequired
          : t(accountErrorMessageKey(errorCode.value))
    stage.value = 'registrationFailed'
    registrationPromise = null
  } finally {
    busy.value = false
  }
}

async function attachSupportScreenshot() {
  if (busy.value) return
  busy.value = true
  try {
    const result = await nativeBridge.selectSupportScreenshot({ pageInstanceID, timeout: 120000 })
    if (result?.assetID) supportAttachmentIDs.value = [result.assetID]
  } catch (value) {
    supportStatus.value = value?.code === 'PERMISSION_DENIED' ? permissionCopy.value.photoLibraryRequired : t('requestFailed')
  } finally {
    busy.value = false
  }
}

function submitSupportTicket() {
  supportStatus.value = ''
  if (!supportCategory.value || !supportDetails.value.trim()) {
    supportStatus.value = postCopy.value.supportRequired
    return
  }
  saveLocalSupportTicket({ category: supportCategory.value, details: supportDetails.value, attachmentAssetIDs: supportAttachmentIDs.value, includeDiagnostics: supportDiagnostics.value })
  supportStatus.value = postCopy.value.supportSaved
}

function clearRecordTimer() {
  window.clearInterval(recordTimer)
  recordTimer = 0
}

async function finishVoiceRecording(result) {
  clearRecordTimer()
  const durationMs = Math.min(7000, Math.max(0, Number(result?.durationMs) || Date.now() - recordingStartedAt))
  voiceClip.value = { id: createOpaqueID('clip'), localAssetID: result?.assetID || voiceClip.value?.localAssetID, durationMs, status: 'ready', createdAt: new Date().toISOString() }
  voiceState.value = 'ready'
  secondsLeft.value = Math.max(0, Math.ceil((7000 - durationMs) / 1000))
}

async function toggleVoiceRecording() {
  if (busy.value) return
  clearError()
  if (voiceState.value === 'recording') {
    busy.value = true
    try { await finishVoiceRecording(await nativeBridge.stopVoiceRecording(voiceClip.value.localAssetID, { pageInstanceID })) }
    catch { error.value = postCopy.value.recordingFailed; voiceState.value = 'idle' }
    finally { busy.value = false }
    return
  }
  busy.value = true
  const assetID = createOpaqueID('voice')
  try {
    const permission = await nativeBridge.requestPermission('microphone', { pageInstanceID })
    if (!permission?.granted) {
      error.value = postCopy.value.microphoneRequired
      return
    }
    const result = await nativeBridge.startVoiceRecording(assetID, { pageInstanceID })
    voiceClip.value = { id: createOpaqueID('clip'), localAssetID: result?.assetID || assetID, durationMs: 0, status: 'recording', createdAt: new Date().toISOString() }
    voiceState.value = 'recording'
    secondsLeft.value = 7
    recordingStartedAt = Date.now()
    clearRecordTimer()
    recordTimer = window.setInterval(async () => {
      secondsLeft.value = Math.max(0, 7 - Math.floor((Date.now() - recordingStartedAt) / 1000))
      if (secondsLeft.value === 0 && voiceState.value === 'recording') await toggleVoiceRecording()
    }, 200)
  } catch (nativeError) {
    error.value = nativeError.code === 'PERMISSION_DENIED' ? postCopy.value.microphoneRequired : postCopy.value.recordingFailed
  } finally {
    busy.value = false
  }
}

async function cancelVoiceRecording() {
  clearRecordTimer()
  voicePlaybackService.stop()
  if (voiceClip.value?.localAssetID) await nativeBridge.discardVoiceRecording(voiceClip.value.localAssetID, { pageInstanceID }).catch(() => {})
  voiceClip.value = null
  voiceState.value = 'idle'
  secondsLeft.value = 7
  stage.value = voiceRecordReturnStage.value
}

async function togglePlayback() {
  if (!voiceClip.value?.localAssetID || busy.value) return
  busy.value = true
  try {
    await voicePlaybackService.play({
      id: voiceClip.value.id,
      nativeAssetID: voiceClip.value.localAssetID,
      durationMs: voiceClip.value.durationMs,
    }, (state) => { playbackState.value = state })
  } catch { error.value = t('requestFailed') }
  finally { busy.value = false }
}

async function recordAgain() {
  if (busy.value) return
  busy.value = true
  voicePlaybackService.stop()
  try { if (voiceClip.value?.localAssetID) await nativeBridge.discardVoiceRecording(voiceClip.value.localAssetID, { pageInstanceID }) }
  finally {
    voiceClip.value = null
    voiceState.value = 'idle'
    secondsLeft.value = 7
    guidelineAccepted.value = false
    playbackState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
    busy.value = false
    clearError()
    stage.value = 'voiceRecord'
  }
}

async function publishVoice() {
  if (busy.value || !guidelineAccepted.value || !voiceClip.value) return
  busy.value = true
  clearError()
  voiceState.value = 'publishing'
  voicePlaybackService.stop()
  try {
    if (globalThis.__OIVOX_PUBLISH_FIXTURE__ === 'failure') throw new Error('Injected publish failure')
    const result = await nativeBridge.publishVoiceRecording(voiceClip.value.localAssetID, { pageInstanceID, timeout: 20000 })
    voiceClip.value = savePublishedVoiceClip(
      { ...voiceClip.value, localAssetID: result?.assetID || voiceClip.value.localAssetID },
      { accountID: completedUser.value?.id || completedUser.value?.userID },
    )
    unlockVoiceEarth({ accountID: completedUser.value?.id || completedUser.value?.userID, voiceClipID: voiceClip.value.id })
    voiceState.value = 'published'
    stage.value = 'notification'
  } catch {
    voiceState.value = 'publishFailed'
    error.value = postCopy.value.publishFailed
  } finally { busy.value = false }
}

function finishOnboarding() {
  emit('authenticated', completedUser.value)
}

async function allowNotifications() {
  if (busy.value) return
  busy.value = true
  try {
    notificationNote.value = ''
    const result = await nativeBridge.requestNotifications({ pageInstanceID })
    saveNotificationPreference({ onboardingChoice: 'allow_tapped', systemStatus: result?.status || (result?.granted ? 'authorized' : 'denied'), requestedAt: new Date().toISOString() })
    if (!result?.granted) {
      notificationNote.value = postCopy.value.notificationDenied
      return
    }
    finishOnboarding()
  } catch {
    saveNotificationPreference({ onboardingChoice: 'allow_tapped', systemStatus: 'denied', requestedAt: new Date().toISOString() })
    notificationNote.value = postCopy.value.notificationDenied
  } finally {
    busy.value = false
  }
}

function skipNotifications() {
  saveNotificationPreference({ onboardingChoice: 'not_now', systemStatus: 'notDetermined' })
  finishOnboarding()
}

function returnToAccount() {
  emit('back-to-auth', buildDraft())
}

function returnToProfile() {
  registrationPromise = null
  if (errorCode.value === 'AVATAR_REQUIRED') {
    resetAvatar('failed')
    avatarError.value = copy.value.avatarRequired
  }
  if (errorCode.value === 'INVALID_DISPLAY_NAME') nicknameError.value = copy.value.nicknameRequired
  clearError()
  stage.value = 'profile'
}

onMounted(async () => {
  if (!nativeBridge.isNative || avatarStatus.value !== 'ready' || !avatarLocalAssetID.value || avatarPreview.value) return
  avatarStatus.value = 'processing'
  try {
    const result = await nativeBridge.loadAvatarPreview(avatarLocalAssetID.value, { pageInstanceID })
    if (!String(result?.previewDataURL || '').startsWith('data:image/')) throw new Error('Missing preview')
    avatarPreview.value = result.previewDataURL
    avatarStatus.value = 'ready'
  } catch {
    avatarFailure(copy.value.avatarProcessingFailed)
  }
})

onBeforeUnmount(() => {
  disposed = true
  window.clearTimeout(advanceTimer)
  clearRevealTimers()
  clearRecordTimer()
  voicePlaybackService.dispose()
  nativeBridge.cancelPage(pageInstanceID)
  releaseLiveness()
  if (voiceState.value === 'recording' && voiceClip.value?.localAssetID) nativeBridge.stopVoiceRecording(voiceClip.value.localAssetID).catch(() => {})
})

watch(stage, (nextStage, previousStage) => {
  if (previousStage === 'voicePreview' && nextStage !== 'voicePreview') {
    voicePlaybackService.stop()
    playbackState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  }
})

watch([stage, questionIndex], ([nextStage, nextQuestion], [previousStage, previousQuestion]) => {
  registrationTransitionDirection.value = registrationTransitionRank(nextStage, nextQuestion) < registrationTransitionRank(previousStage, previousQuestion) ? 'back' : 'forward'
  document.activeElement?.blur?.()
}, { flush: 'sync' })

const removeNativeListener = nativeBridge.onEvent((event) => {
  if (event?.sessionID && event.sessionID !== livenessAttempt.value?.mediaSessionID) return
  if (event?.type === 'liveness.faceCountChanged') {
    faceCount.value = Number(event.faceCount || 0)
    if (livenessAttempt.value) livenessAttempt.value.faceState = faceCount.value === 1 ? 'single' : faceCount.value > 1 ? 'multiple' : 'none'
    livenessMessage.value = faceMessage.value
  }
  if (event?.type === 'liveness.dynamicFaceChanged') {
    faceCount.value = Number(event.faceCount ?? faceCount.value)
    dynamicFaceDetected.value = event.dynamicFaceDetected === true
    if (livenessAttempt.value) livenessAttempt.value.dynamicFaceDetected = dynamicFaceDetected.value
    livenessMessage.value = faceMessage.value
  }
  if (event?.type === 'voice.recordingFinished' && voiceState.value === 'recording') finishVoiceRecording(event)
  if (event?.type === 'media.interrupted') {
    releaseLiveness()
    if (voiceState.value === 'recording') {
      clearRecordTimer()
      voiceState.value = 'idle'
      error.value = postCopy.value.recordingFailed
    }
  }
})

function handleVisibilityChange() {
  if (!document.hidden) return
  releaseLiveness()
  if (voiceState.value === 'recording' && voiceClip.value?.localAssetID) nativeBridge.stopVoiceRecording(voiceClip.value.localAssetID).then(finishVoiceRecording).catch(() => {})
}

document.addEventListener('visibilitychange', handleVisibilityChange)
onBeforeUnmount(() => {
  removeNativeListener()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <main class="registration-screen app-screen" :class="`registration-${stage}`">
    <Transition :name="`registration-route-${registrationTransitionDirection}`" mode="out-in">
      <div :key="registrationTransitionKey" class="registration-stage-frame" :class="`registration-frame-${stage}`" :inert="permissionPromptOpen">
    <template v-if="!['complete', 'communication', 'verificationDigits', 'processing', 'submitting', 'support', 'voiceEarthLocked', 'voiceRecord', 'voicePreview', 'notification'].includes(stage)">
      <header class="flow-nav" :class="{ 'flow-nav-text': stage === 'questionnaire' || stage === 'interests' }">
        <button v-if="stage === 'questionnaire' || stage === 'interests'" class="flow-back-label" type="button" :disabled="busy" @click="goBack">
          <img :src="arrowLeftIcon" alt=""><span>{{ copy.back }}</span>
        </button>
        <button v-else class="flow-back" type="button" :aria-label="copy.back" :disabled="busy" @click="goBack"><img :src="arrowLeftIcon" alt=""></button>
        <strong>{{ stage === 'questionnaire' || stage === 'interests' ? copy.step(outerStep) : 'OiVox' }}</strong>
        <button v-if="stage === 'questionnaire'" class="flow-nav-action" type="button" @click="skipQuestion">{{ copy.skip }}</button>
        <button v-else-if="stage === 'interests'" class="flow-nav-action" type="button" @click="finishInterests">{{ copy.done }}</button>
        <span v-else class="flow-step">{{ outerStep ? copy.step(outerStep) : '' }}</span>
      </header>
      <div v-if="outerStep" class="flow-progress" aria-hidden="true"><span :style="{ width: `${outerStep / 7 * 100}%` }" /></div>
    </template>

    <header v-else-if="stage === 'communication'" class="preview-nav">
      <button class="flow-back" type="button" :aria-label="copy.back" @click="goBack"><img :src="arrowLeftIcon" alt=""></button>
      <strong>{{ copy.communicationTitle }}</strong><span />
    </header>

    <section v-if="stage === 'profile'" class="flow-page flow-profile">
      <div class="flow-scroll">
        <h1>{{ copy.profileTitle }}</h1>
        <p class="flow-lead">{{ copy.profileSubtitle }}</p>
        <div class="profile-identity">
          <div class="avatar-field" :class="{ invalid: avatarError }">
          <div class="avatar-editor" :class="{ empty: !avatarReady, processing: avatarStatus === 'processing' }">
            <img v-if="avatarPreview" :src="avatarPreview" alt="">
            <span v-else class="avatar-placeholder" aria-hidden="true"><img :src="cameraIcon" alt=""></span>
            <button type="button" :aria-label="copy.photoAction" :disabled="avatarStatus === 'processing'" @click="openPhotoPicker"><span v-if="avatarStatus === 'processing'" class="button-spinner"/><img v-else :src="cameraIcon" alt=""></button>
          </div>
          <p v-if="avatarError" class="field-error avatar-field-error" role="alert">{{ avatarError }}</p>
          </div>
          <div class="profile-name-field">
            <label class="flow-label" for="registration-nickname">{{ copy.nickname }}</label>
            <div class="flow-input-wrap" :class="{ invalid: nicknameError }">
              <input id="registration-nickname" ref="nicknameInput" v-model="nickname" class="flow-input" maxlength="32" autocomplete="nickname" :placeholder="copy.nicknamePlaceholder" :aria-invalid="Boolean(nicknameError)" @input="clearNicknameError">
              <span class="field-count">{{ nickname.length }}/32</span>
            </div>
            <p v-if="nicknameError" class="field-error" role="alert">{{ nicknameError }}</p>
          </div>
        </div>
        <span class="flow-label languages-label">{{ copy.languages }}</span>
        <div class="choice-chips language-chips">
          <button v-for="language in languageOptions" :key="language.code" type="button" :class="{ selected: selectedLanguages.includes(language.code) }" :aria-pressed="selectedLanguages.includes(language.code)" @click="toggleLanguage(language.code)">{{ language.nativeName }}</button>
        </div>
        <aside class="privacy-note"><img :src="shieldCheckIcon" alt=""><p>{{ copy.privacyBody }}</p></aside>
        <p v-if="error" class="flow-error" role="alert">{{ error }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" :disabled="profileAdvancing || avatarStatus === 'processing'" @click="finishProfile">{{ copy.continue }}</button></footer>
    </section>

    <section v-else-if="stage === 'questionnaire'" class="flow-page question-page">
      <div class="flow-scroll">
        <div class="question-progress-row">
          <div class="question-subprogress" aria-hidden="true"><span :style="{ width: `${(questionIndex + 1) / 6 * 100}%` }" /></div>
          <span>{{ questionIndex + 1 }}/6</span>
        </div>
        <div class="question-meta"><strong>{{ copy.question(questionIndex + 1) }}</strong></div>
        <h1>{{ currentQuestion.title }}</h1>
        <div class="question-options">
          <button v-for="([value, label], index) in currentQuestion.options" :key="value" type="button" :class="{ selected: answers[questionIndex] === value }" @click="chooseAnswer(value)">
            <span>{{ String.fromCharCode(65 + index) }}</span><strong>{{ label }}</strong><i aria-hidden="true">✓</i>
          </button>
        </div>
        <p class="question-note">{{ copy.questionNote }}</p>
      </div>
    </section>

    <section v-else-if="stage === 'interests'" class="flow-page interests-page">
      <div class="flow-scroll">
        <h1>{{ copy.interestTitle }}</h1>
        <div class="selected-summary">
          <div><span>{{ copy.selected }}</span><strong>{{ selectedInterests.length }}/5</strong></div>
          <div class="selected-tags"><span v-for="label in selectedInterestLabels" :key="label">{{ label }}</span><p v-if="!selectedInterestLabels.length">{{ copy.chooseMore }}</p></div>
        </div>
        <div class="interest-cloud">
          <button v-for="([id, label]) in interestOptions" :key="id" type="button" :class="{ selected: selectedInterests.includes(id) }" :aria-pressed="selectedInterests.includes(id)" @click="toggleInterest(id)">{{ label }}</button>
        </div>
        <p v-if="error" class="flow-error" role="alert">{{ error }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" @click="finishInterests">{{ copy.buildProfile }}</button></footer>
    </section>

    <section v-else-if="stage === 'communication'" class="flow-page communication-page">
      <div class="flow-scroll">
        <article class="profile-polaroid">
          <img :src="avatarPreview" alt="">
          <div><strong>{{ copy.helloWorld }}</strong><span>{{ nickname }}</span></div>
        </article>
        <div class="communication-grid">
          <article><span>{{ copy.iSpeak }}</span><strong>{{ selectedLanguages.map(code => languageOptions.find(item => item.code === code)?.nativeName).join(' · ') }}</strong></article>
          <article><span>{{ copy.reply }}</span><strong>{{ questionLabel(3) }}</strong></article>
          <article><span>{{ copy.online }}</span><strong>{{ questionLabel(4) }}</strong></article>
        </div>
        <article class="curiosity-card"><span>{{ copy.curiousAbout }}</span><h3>{{ questionLabel(0) }}</h3><p>{{ selectedInterestLabels.join(' · ') }}</p></article>
        <p class="profile-preview-note">{{ copy.communicationSubtitle }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" @click="stage = 'microphone'">{{ copy.continue }}</button></footer>
    </section>

    <section v-else-if="stage === 'microphone' || stage === 'camera'" class="flow-page permission-page">
      <div class="flow-scroll permission-content">
        <div class="permission-art" :class="stage" aria-hidden="true">
          <template v-if="stage === 'microphone'">
            <span class="permission-wave wave-left"><i v-for="height in [18, 36, 55, 26]" :key="height" :style="{ height: `${height}px` }" /></span>
            <span class="permission-icon-circle"><img :src="micHeroIcon" alt=""></span>
            <span class="permission-wave wave-right"><i v-for="height in [26, 55, 36, 18]" :key="height" :style="{ height: `${height}px` }" /></span>
          </template>
          <template v-else>
            <span class="camera-hero-card"><img :src="cameraHeroIcon" alt=""></span>
            <span class="camera-shield"><img :src="shieldCheckIcon" alt=""></span>
          </template>
        </div>
        <h1>{{ stage === 'microphone' ? copy.micTitle : copy.cameraTitle }}</h1>
        <p class="flow-lead">{{ stage === 'microphone' ? copy.micBody : copy.cameraBody }}</p>
        <ul class="permission-list">
          <li v-for="benefit in (stage === 'microphone' ? copy.micBenefits : copy.cameraBenefits)" :key="benefit"><img :src="checkGreenIcon" alt=""><span>{{ benefit }}</span></li>
        </ul>
        <p v-if="permissionNote" class="permission-status" role="status">{{ permissionNote }}</p>
      </div>
      <footer class="flow-footer permission-actions">
        <button class="flow-primary icon-primary" type="button" :disabled="busy" @click="requestPermission(stage, $event)"><img :src="stage === 'microphone' ? micIcon : cameraIcon" alt="">{{ stage === 'microphone' ? copy.allowMic : copy.allowCamera }}</button>
        <button class="flow-secondary" type="button" :disabled="busy" @click="skipPermission(stage)">{{ stage === 'microphone' ? copy.notNow : copy.skipForNow }}</button>
      </footer>
    </section>

    <section v-else-if="stage === 'verificationIntro'" class="flow-page verification-intro">
      <div class="flow-scroll permission-content">
        <div class="liveness-art" aria-hidden="true"><strong>3••</strong><span><img :src="micIcon" alt=""></span></div>
        <h1>{{ copy.verifyTitle }}</h1><p class="flow-lead">{{ copy.verifyBody }}</p>
        <p class="verification-privacy">{{ copy.verifyPrivacy }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" :disabled="busy" @click="beginLivenessAttempt">{{ copy.startCheck }}</button></footer>
    </section>

    <section v-else-if="['verificationDigits', 'processing', 'submitting'].includes(stage)" class="flow-page digits-page">
      <div class="flow-scroll digits-content">
        <div class="digit-prompt" :aria-label="visibleDigits.join(' ')">
          <span v-for="(value, index) in visibleDigits" :key="index" class="digit-slot" :class="{ rolling: value === 'symbol' }">
            <img v-if="value === 'symbol'" :src="checkGreenIcon" alt="">
            <strong v-else>{{ value }}</strong>
          </span>
        </div>
        <div class="digit-face" aria-label="Camera preview"><span class="camera-preview-placeholder"/><b v-show="!usesNativeLivenessPreview">{{ copy.recording }}</b></div>
        <div class="voice-wave" aria-hidden="true"><i v-for="n in 31" :key="n" :style="{ height: `${8 + ((n * 13) % 30)}px` }" /></div>
        <h1>{{ stage === 'submitting' ? copy.creating : stage === 'processing' ? postCopy.processing : copy.digitsTitle }}</h1>
        <p>{{ stage === 'verificationDigits' ? faceMessage : postCopy.simulatedCheck }}</p>
        <p v-if="error" class="flow-error dark" role="alert">{{ error }}</p>
      </div>
      <footer class="flow-footer dark-footer">
        <button v-if="stage === 'verificationDigits'" class="flow-primary light" type="button" :disabled="!canSubmitLiveness || busy" @click="processLiveness">{{ copy.saidAll }}</button>
        <div v-if="stage === 'verificationDigits' && !busy" class="digits-secondary-actions"><button type="button" @click="releaseLiveness(); stage = 'verificationIntro'">{{ copy.cancel }}</button><button type="button" @click="releaseLiveness(); stage = 'verificationFailed'">{{ copy.couldntHear }}</button></div>
        <button v-else class="flow-primary light" type="button" disabled><span class="button-spinner dark" />{{ stage === 'submitting' ? copy.creating : postCopy.processing }}</button>
      </footer>
    </section>

    <section v-else-if="stage === 'registrationFailed'" class="flow-page failed-page">
      <div class="flow-scroll permission-content"><div class="failure-mark" aria-hidden="true"><img :src="warningHeroIcon" alt=""></div><h1>{{ copy.submitError }}</h1><p class="flow-lead" role="alert">{{ error }}</p></div>
      <footer class="flow-footer permission-actions"><button class="flow-primary" type="button" :disabled="busy" @click="beginLivenessAttempt">{{ copy.tryAgain }}</button><button v-if="errorCode === 'EMAIL_IN_USE'" class="flow-secondary" type="button" @click="returnToAccount">{{ copy.returnToAccount }}</button><button v-else-if="['AVATAR_REQUIRED', 'INVALID_DISPLAY_NAME'].includes(errorCode)" class="flow-secondary" type="button" @click="returnToProfile">{{ copy.returnToProfile }}</button></footer>
    </section>

    <section v-else-if="stage === 'verificationFailed'" class="flow-page failed-page">
      <div class="flow-scroll permission-content">
        <div class="failure-mark" aria-hidden="true"><img :src="warningHeroIcon" alt=""></div>
        <h1>{{ copy.failedTitle }}</h1><p class="flow-lead">{{ copy.failedBody }}</p>
        <ul class="permission-list failure-tips"><li v-for="tip in copy.tipItems" :key="tip"><img :src="checkGreenIcon" alt=""><span>{{ tip }}</span></li></ul>
      </div>
      <footer class="flow-footer permission-actions"><button class="flow-primary" type="button" :disabled="busy" @click="beginLivenessAttempt">{{ copy.tryAgain }}</button><button class="flow-secondary" type="button" :disabled="busy" @click="stage = 'support'">{{ copy.contactSupport }}</button></footer>
    </section>

    <section v-else-if="stage === 'support'" class="flow-page support-page">
      <header class="standalone-nav"><button type="button" @click="stage = 'verificationFailed'">{{ postCopy.supportCancel }}</button><strong>{{ postCopy.supportTitle }}</strong><span /></header>
      <div class="flow-scroll support-content">
        <label class="support-label">{{ postCopy.supportAbout }}</label>
        <select v-model="supportCategory" class="support-select"><option v-for="(label, index) in postCopy.supportCategories" :key="label" :value="['user_or_clip','purchase','account','bug','other'][index]">{{ label }}</option></select>
        <label class="support-label" for="support-details">{{ postCopy.supportDetails }}</label>
        <textarea id="support-details" v-model="supportDetails" class="support-textarea" maxlength="1000" :placeholder="postCopy.supportPlaceholder" />
        <p class="support-private"><img :src="shieldCheckIcon" alt="">{{ postCopy.supportPrivate }}</p>
        <button class="support-row" type="button" :disabled="busy" @click="attachSupportScreenshot"><span>{{ postCopy.supportAttach }}</span><strong>{{ supportAttachmentIDs.length ? '1' : postCopy.supportAdd }}</strong></button>
        <button class="support-row" type="button" :aria-pressed="supportDiagnostics" @click="supportDiagnostics = !supportDiagnostics"><span>{{ postCopy.supportDiagnostics }}<small>{{ postCopy.supportNoAudio }}</small></span><i :class="{ active: supportDiagnostics }" /></button>
        <p class="local-disclosure">{{ postCopy.supportSimulated }}</p><p v-if="supportStatus" class="flow-error" role="status">{{ supportStatus }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" @click="submitSupportTicket">{{ postCopy.supportSubmit }}</button></footer>
    </section>

    <section v-else-if="stage === 'complete'" class="flow-page complete-page">
      <div class="complete-content">
        <div class="complete-mark" aria-hidden="true"><img :src="checkLargeIcon" alt=""></div>
        <h1>{{ copy.completeTitle(nickname) }}</h1><p>{{ copy.completeBody }}</p>
        <div class="complete-community"><span class="avatar-stack" aria-hidden="true"><img v-for="(voice, index) in lockedVoices.slice(0, 4)" :key="voice.id" :src="voice.avatarAsset" alt="" :style="{ zIndex: 4 - index }"></span><strong>{{ communitySummary }}</strong></div>
      </div>
      <footer class="flow-footer permission-actions"><button class="flow-primary" type="button" @click="beginVoiceRecording('complete')">{{ copy.record7 }}</button><button class="flow-secondary" type="button" @click="skipFirstVoice">{{ copy.skip }}</button></footer>
    </section>

    <section v-else-if="stage === 'voiceEarthLocked'" class="flow-page voice-earth-locked-page">
      <div class="voice-earth-locked-scroll">
        <button class="voice-earth-locked-back" type="button" :aria-label="copy.back" :disabled="busy" @click="stage = 'complete'"><img :src="arrowLeftIcon" alt=""></button>
        <h1>{{ copy.voiceEarthTitle }}</h1>
        <div class="locked-earth-visual" aria-hidden="true">
          <div class="locked-earth-globe">
            <div class="locked-earth-surface">
              <span v-for="index in 6" :key="index" :class="`locked-earth-land locked-earth-land-${index}`" />
            </div>
            <span class="locked-earth-shade" />
            <span class="locked-earth-glint" />
          </div>
          <span
            v-for="(voice, index) in lockedVoices"
            :key="voice.id"
            class="locked-earth-avatar"
            :class="`locked-earth-avatar-${index + 1}`"
          ><img :src="voice.avatarAsset" alt=""></span>
          <div class="locked-earth-card">
            <span class="locked-earth-shield"><img :src="shieldCheckIcon" alt=""></span>
            <strong>{{ copy.recordToUnlock }}</strong>
            <p>{{ copy.voiceEarthLockedBody }}</p>
          </div>
        </div>
        <ul class="locked-earth-benefits">
          <li v-for="benefit in copy.micBenefits" :key="benefit"><img :src="checkGreenIcon" alt=""><span>{{ benefit }}</span></li>
        </ul>
      </div>
      <footer class="flow-footer"><button class="flow-primary icon-primary" type="button" :disabled="busy" @click="beginVoiceRecording('voiceEarthLocked')"><img :src="micIcon" alt="">{{ copy.record7 }}</button></footer>
    </section>

    <section v-else-if="stage === 'voiceRecord'" class="flow-page voice-record-page">
      <header class="standalone-nav"><button class="flow-back" type="button" :aria-label="copy.back" @click="cancelVoiceRecording"><img :src="arrowLeftIcon" alt=""></button><strong>OiVox</strong><span /></header>
      <div class="voice-record-content">
        <p class="record-kicker">{{ postCopy.secondsLeft }}</p><strong class="record-count">{{ secondsLeft }}</strong>
        <h1>{{ postCopy.recordTitle }}</h1><p>{{ postCopy.recordHint }}</p>
        <button class="record-control" :class="{ active: voiceState === 'recording' }" type="button" :disabled="busy" @click="toggleVoiceRecording"><span /></button>
        <strong class="record-status">{{ voiceState === 'recording' ? postCopy.recording : postCopy.tapRecord }}</strong>
        <p v-if="error" class="flow-error" role="alert">{{ error }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" :disabled="voiceState !== 'ready'" @click="stage = 'voicePreview'">{{ postCopy.listenBack }}</button></footer>
    </section>

    <section v-else-if="stage === 'voicePreview'" class="flow-page voice-preview-page">
      <header class="standalone-nav"><button class="flow-back" type="button" :aria-label="copy.back" @click="stage = 'voiceRecord'"><img :src="arrowLeftIcon" alt=""></button><strong>OiVox</strong><span /></header>
      <div class="flow-scroll preview-content">
        <h1>{{ postCopy.previewTitle }}</h1><p>{{ postCopy.previewBody }}</p>
        <button class="play-control" type="button" :disabled="busy" @click="togglePlayback"><span :class="{ pause: isPlaying }" />{{ isPlaying ? postCopy.pause : postCopy.play }}</button>
        <button class="record-again" type="button" :disabled="busy" @click="recordAgain">{{ postCopy.recordAgain }}</button><p class="retake-note">{{ postCopy.retakeNote }}</p>
        <button class="guideline-row" type="button" :aria-pressed="guidelineAccepted" @click="guidelineAccepted = !guidelineAccepted"><span :class="{ checked: guidelineAccepted }"><img v-if="guidelineAccepted" :src="checkGreenIcon" alt=""></span><p>{{ postCopy.guidelinesPrefix }} <strong>{{ postCopy.guidelines }}</strong> {{ postCopy.guidelinesSuffix }}</p></button>
        <p class="local-disclosure">{{ postCopy.localPublishNote }}</p><p v-if="error" class="flow-error" role="alert">{{ error }}</p>
      </div>
      <footer class="flow-footer"><button class="flow-primary" type="button" :disabled="busy || !guidelineAccepted" @click="publishVoice"><span v-if="busy" class="button-spinner" />{{ voiceState === 'publishFailed' ? postCopy.publishRetry : busy ? postCopy.publishing : postCopy.publish }}</button></footer>
    </section>

    <section v-else-if="stage === 'notification'" class="flow-page notification-page">
      <div class="notification-content"><div class="notification-mark"><img :src="checkLargeIcon" alt=""></div><h1>{{ postCopy.notificationTitle }}</h1><p>{{ postCopy.notificationBody }}</p><ul><li v-for="benefit in postCopy.notificationBenefits" :key="benefit"><img :src="checkGreenIcon" alt=""><span>{{ benefit }}</span></li></ul><p v-if="notificationNote" class="flow-error" role="status">{{ notificationNote }}</p></div>
      <footer class="flow-footer permission-actions"><button class="flow-primary" type="button" :disabled="busy" @click="allowNotifications">{{ postCopy.allowNotifications }}</button><button class="flow-secondary" type="button" :disabled="busy" @click="skipNotifications">{{ postCopy.notNow }}</button></footer>
    </section>
      </div>
    </Transition>
    <div v-if="permissionPromptOpen" class="registration-permission-backdrop" role="presentation" @click.self="closePermissionPrompt" @keydown.esc.stop="closePermissionPrompt">
      <section ref="permissionSettingsDialog" class="registration-permission-dialog" role="alertdialog" aria-modal="true" :aria-label="permissionCopy.settingsTitle" :aria-busy="busy" tabindex="-1">
        <h2>{{ permissionCopy.settingsTitle }}</h2>
        <p>{{ permissionPromptBody }}</p>
        <p v-if="permissionPromptError" class="flow-error" role="alert">{{ permissionPromptError }}</p>
        <div class="registration-permission-dialog-actions">
          <button class="flow-secondary" type="button" :disabled="busy" @click="closePermissionPrompt">{{ permissionCopy.close }}</button>
          <button v-if="permissionPromptCanOpenSettings" class="flow-primary" type="button" :disabled="busy" @click="openPermissionSettings">{{ permissionCopy.openSettings }}</button>
        </div>
      </section>
    </div>
  </main>
</template>
