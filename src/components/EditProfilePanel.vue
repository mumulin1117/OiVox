<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import cameraIcon from '../assets/icons/camera.svg'
import checkGreenIcon from '../assets/icons/check-green.svg'
import profileChevronIcon from '../assets/icons/profile-chevron.svg'
import profileNoteShieldIcon from '../assets/icons/profile-note-shield.svg'
import portrait02 from '../assets/portraits/portrait-02.png'
import portrait03 from '../assets/portraits/portrait-03.png'
import portrait04 from '../assets/portraits/portrait-04.png'
import portrait07 from '../assets/portraits/portrait-07.png'
import portrait09 from '../assets/portraits/portrait-09.png'
import { discoveryFlagAssets } from '../data/discoveryFixtures'
import { avatarFrameByID, resolveAvatarFrameID } from '../data/avatarFrameCatalog'
import { profileEditContent } from '../data/profileEditContent'
import { registrationInterests } from '../data/registrationContent'
import { languageOptions, useI18n } from '../i18n'
import { nativeBridge } from '../nativeBridge'
import { oivoxAccountApi } from '../services/oivoxAccountApi'
import { updateLocalAccountProfile } from '../services/accountUserCache'
import AvatarFramePanel from './AvatarFramePanel.vue'
import CoinStoreScreen from './CoinStoreScreen.vue'

const props = defineProps({ user: { type: Object, required: true }, coinBalance: { type: Number, default: 0 } })
const emit = defineEmits(['cancel', 'saved', 'open-language', 'coin-balance-changed'])
const { locale } = useI18n()
const copy = computed(() => profileEditContent(locale.value))
const interestOptions = computed(() => registrationInterests(locale.value))
const pageInstanceID = `profile-edit-${globalThis.crypto?.randomUUID?.() || Date.now()}`
const presetAvatars = Object.freeze({ 'portrait-02': portrait02, 'portrait-03': portrait03, 'portrait-04': portrait04, 'portrait-07': portrait07, 'portrait-09': portrait09 })
const original = Object.freeze({
  displayName: String(props.user.profile?.displayName || ''),
  handle: String(props.user.profile?.handle || '@mia_voice').replace(/^@/, ''),
  aboutMe: String(props.user.profile?.aboutMe || ''),
  spokenLanguages: [...(props.user.profile?.spokenLanguages || ['en'])],
  interests: [...(props.user.profile?.interests || [])],
  avatarSource: props.user.profile?.avatarSource || 'preset',
  avatarKey: props.user.profile?.avatarKey || 'portrait-09',
  localAssetID: props.user.profile?.localAssetID || '',
  avatarFrameID: resolveAvatarFrameID(props.user.profile),
  avatarFrameLabel: String(props.user.profile?.avatarFrameLabel || ''),
})
const form = reactive({
  displayName: original.displayName,
  handle: original.handle,
  aboutMe: original.aboutMe,
  spokenLanguages: [...original.spokenLanguages],
  interests: [...original.interests],
})
const avatar = reactive({
  status: 'ready',
  source: original.avatarSource,
  key: original.avatarKey,
  localAssetID: original.localAssetID,
  preview: presetAvatars[original.avatarKey] || portrait09,
  changed: false,
})
const errors = reactive({ displayName: '', handle: '', aboutMe: '', spokenLanguages: '', interests: '' })
const busy = ref(false)
const avatarBusy = ref(false)
const message = ref('')
const messageKind = ref('status')
const activePanel = ref('editor')
const panelTransitionDirection = ref('forward')
const walletBalance = ref(props.coinBalance)
const pendingFrameSelectionID = ref('')
const avatarFrame = reactive({ id: original.avatarFrameID, label: original.avatarFrameLabel, changed: false })

const selectedLanguageName = computed(() => languageOptions.find((item) => item.code === locale.value)?.nativeName || 'English')
const countryCode = computed(() => props.user.profile?.countryCode || '')
const countryFlag = computed(() => discoveryFlagAssets[countryCode.value] || '')
const selectedFrame = computed(() => avatarFrameByID(avatarFrame.id))
const hasAvatarFrame = computed(() => selectedFrame.value.id !== 'none')
const avatarFrameStyle = computed(() => hasAvatarFrame.value ? { '--avatar-frame-ring': selectedFrame.value.ring } : {})
const trimmedName = computed(() => form.displayName.trim())
const normalizedHandle = computed(() => `@${form.handle.trim().replace(/^@+/, '').toLowerCase()}`)
const handleValid = computed(() => /^@[a-z0-9_]{3,24}$/.test(normalizedHandle.value))
const arraysEqual = (left, right) => left.length === right.length && left.every((value, index) => value === right[index])
const hasChanges = computed(() => trimmedName.value !== original.displayName.trim()
  || normalizedHandle.value !== `@${original.handle.toLowerCase()}`
  || form.aboutMe.trim() !== original.aboutMe.trim()
  || !arraysEqual(form.spokenLanguages, original.spokenLanguages)
  || !arraysEqual(form.interests, original.interests)
  || avatar.changed
  || avatarFrame.changed)

function showMessage(value, kind = 'status') {
  message.value = value
  messageKind.value = kind
}

function clearFieldError(field) {
  errors[field] = ''
  if (messageKind.value === 'error') message.value = ''
}

function toggleLanguage(code) {
  clearFieldError('spokenLanguages')
  const index = form.spokenLanguages.indexOf(code)
  if (index >= 0) form.spokenLanguages.splice(index, 1)
  else form.spokenLanguages.push(code)
}

function toggleInterest(id) {
  clearFieldError('interests')
  const index = form.interests.indexOf(id)
  if (index >= 0) form.interests.splice(index, 1)
  else if (form.interests.length < 5) form.interests.push(id)
  else errors.interests = copy.value.interestError
}

function validate() {
  errors.displayName = trimmedName.value.length >= 1 && trimmedName.value.length <= 32 ? '' : copy.value.nicknameError
  errors.handle = handleValid.value ? '' : copy.value.handleError
  errors.aboutMe = form.aboutMe.length <= 140 ? '' : copy.value.aboutError
  errors.spokenLanguages = form.spokenLanguages.length >= 1 ? '' : copy.value.languageError
  const interestsChanged = !arraysEqual(form.interests, original.interests)
  errors.interests = interestsChanged && (form.interests.length < 2 || form.interests.length > 5) ? copy.value.interestError : ''
  return !Object.values(errors).some(Boolean)
}

async function changePhoto() {
  if (avatarBusy.value || busy.value) return
  message.value = ''
  if (!nativeBridge.isNative) {
    showMessage(copy.value.photoNativeOnly, 'error')
    return
  }
  avatarBusy.value = true
  const previous = { ...avatar }
  avatar.status = 'processing'
  try {
    const result = await nativeBridge.chooseAvatar({
      photoLibraryLabel: copy.value.change,
      cameraLabel: copy.value.profilePhoto,
      cancelLabel: copy.value.cancel,
    }, { pageInstanceID, timeout: 120000 })
    if (result?.cancelled) {
      Object.assign(avatar, previous)
      showMessage(copy.value.photoCancelled)
      return
    }
    if (!['photoLibrary', 'camera'].includes(result?.source)
      || !/^avatar_[A-Za-z0-9_-]{8,100}$/.test(result?.localAssetID || '')
      || !String(result?.previewDataURL || '').startsWith('data:image/')) throw new Error('INVALID_AVATAR_RESULT')
    Object.assign(avatar, { status: 'ready', source: result.source, key: '', localAssetID: result.localAssetID, preview: result.previewDataURL, changed: true })
  } catch (error) {
    Object.assign(avatar, previous)
    showMessage(error?.code === 'PERMISSION_DENIED' ? copy.value.photoPermissionDenied : copy.value.photoFailed, 'error')
  } finally {
    avatarBusy.value = false
  }
}

function openFrames() {
  if (busy.value || avatarBusy.value) return
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  message.value = ''
  pendingFrameSelectionID.value = ''
  panelTransitionDirection.value = 'forward'
  activePanel.value = 'frames'
}

function openFrameStore(payload) {
  pendingFrameSelectionID.value = payload?.selectedFrameID || avatarFrame.id
  panelTransitionDirection.value = 'forward'
  activePanel.value = 'coin-store'
}

function selectFrame(value) {
  avatarFrame.id = avatarFrameByID(value?.id).id
  avatarFrame.label = String(value?.label || '')
  avatarFrame.changed = avatarFrame.id !== original.avatarFrameID
  panelTransitionDirection.value = 'back'
  activePanel.value = 'editor'
}

function closeFrameStore() {
  panelTransitionDirection.value = 'back'
  activePanel.value = 'frames'
}

function closeFrames() {
  panelTransitionDirection.value = 'back'
  activePanel.value = 'editor'
}

function updateWalletBalance(value) {
  if (!Number.isSafeInteger(value) || value < 0) return
  walletBalance.value = value
  emit('coin-balance-changed', value)
}

function openLanguage() {
  if (busy.value || avatarBusy.value) return
  if (hasChanges.value) {
    showMessage(copy.value.saveBeforeLanguage, 'error')
    return
  }
  emit('open-language')
}

function buildPatch() {
  const patch = {}
  if (trimmedName.value !== original.displayName.trim()) patch.displayName = trimmedName.value
  if (normalizedHandle.value !== `@${original.handle.toLowerCase()}`) patch.handle = normalizedHandle.value
  if (form.aboutMe.trim() !== original.aboutMe.trim()) patch.aboutMe = form.aboutMe.trim()
  if (!arraysEqual(form.spokenLanguages, original.spokenLanguages)) patch.spokenLanguages = [...form.spokenLanguages]
  if (!arraysEqual(form.interests, original.interests)) patch.interests = [...form.interests]
  if (avatar.changed) {
    patch.avatarSource = avatar.source
    if (avatar.source === 'preset') patch.avatarKey = avatar.key
    else patch.localAssetID = avatar.localAssetID
  }
  return patch
}

async function save() {
  if (busy.value || avatarBusy.value) return
  message.value = ''
  if (!validate()) {
    showMessage(Object.values(errors).find(Boolean), 'error')
    return
  }
  const patch = buildPatch()
  if (!Object.keys(patch).length && !avatarFrame.changed) {
    showMessage(copy.value.noChanges)
    return
  }
  busy.value = true
  try {
    const updatedUser = Object.keys(patch).length ? await oivoxAccountApi.updateProfile(patch) : props.user
    const mergedUser = avatarFrame.changed
      ? updateLocalAccountProfile(updatedUser, { avatarFrameID: avatarFrame.id, avatarFrameLabel: avatarFrame.label })
      : updatedUser
    emit('saved', mergedUser)
  } catch {
    showMessage(copy.value.saveFailed, 'error')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  if (!original.localAssetID || !nativeBridge.isNative) return
  try {
    const result = await nativeBridge.loadAvatarPreview(original.localAssetID, { pageInstanceID, timeout: 15000 })
    if (String(result?.previewDataURL || '').startsWith('data:image/')) avatar.preview = result.previewDataURL
  } catch {
    avatar.preview = portrait09
  }
})

onBeforeUnmount(() => nativeBridge.cancelPage(pageInstanceID))
</script>

<template>
  <Transition :name="`ios-page-${panelTransitionDirection}`">
  <CoinStoreScreen
    v-if="activePanel === 'coin-store'"
    :account-id="props.user.id || props.user.userID"
    :initial-balance="walletBalance"
    @back="closeFrameStore"
    @balance-changed="updateWalletBalance"
  />
  <AvatarFramePanel
    v-else-if="activePanel === 'frames'"
    :account-id="props.user.id || props.user.userID"
    :avatar="avatar.preview"
    :initial-balance="walletBalance"
    :initial-frame-id="avatarFrame.id"
    :initial-selection-id="pendingFrameSelectionID"
    @back="closeFrames"
    @selected="selectFrame"
    @open-store="openFrameStore"
    @balance-changed="updateWalletBalance"
  />
  <main v-else class="profile-edit-screen app-screen">
    <header class="profile-edit-nav">
      <button type="button" :disabled="busy" @click="emit('cancel')">{{ copy.cancel }}</button>
      <h1>{{ copy.title }}</h1>
      <button class="save" type="button" :disabled="busy || avatarBusy" :aria-busy="busy" @click="save">{{ busy ? copy.saving : copy.save }}</button>
    </header>

    <p v-if="message" class="profile-edit-message" :class="messageKind" :role="messageKind === 'error' ? 'alert' : 'status'">{{ message }}</p>

    <section class="profile-edit-scroll">
      <article class="profile-edit-photo-card">
        <span class="profile-edit-avatar-ring" :class="{ framed: hasAvatarFrame }" :style="avatarFrameStyle">
          <img :src="avatar.preview" alt="">
          <button class="profile-edit-camera-button" type="button" :aria-label="copy.change" :disabled="busy || avatarBusy" @click="changePhoto">
            <span v-if="avatarBusy" class="button-spinner" aria-hidden="true" />
            <img v-else :src="cameraIcon" alt="">
          </button>
        </span>
        <div>
          <h2>{{ copy.profilePhoto }}</h2>
          <p>{{ copy.photoHint }}</p>
          <span class="profile-edit-photo-actions">
            <button type="button" :disabled="busy || avatarBusy" @click="openFrames">{{ copy.changeFrame }}</button>
          </span>
        </div>
      </article>

      <article class="profile-edit-card profile-edit-fields">
        <label class="profile-edit-label" for="profile-nickname">{{ copy.nickname }}</label>
        <div class="profile-edit-input-wrap" :class="{ invalid: errors.displayName }">
          <input id="profile-nickname" v-model="form.displayName" dir="auto" type="text" autocomplete="nickname" maxlength="32" enterkeyhint="next" @input="clearFieldError('displayName')">
          <span>{{ trimmedName.length }}/32</span>
        </div>
        <p class="profile-edit-help">{{ copy.nicknameHint }}</p>
        <p v-if="errors.displayName" class="profile-edit-error" role="alert">{{ errors.displayName }}</p>

        <label class="profile-edit-label" for="profile-handle">{{ copy.handle }}</label>
        <div class="profile-edit-input-wrap handle" :class="{ invalid: errors.handle }">
          <span aria-hidden="true">@</span>
          <input id="profile-handle" v-model="form.handle" dir="ltr" type="text" autocapitalize="none" autocomplete="off" maxlength="24" enterkeyhint="next" @input="clearFieldError('handle')">
          <img v-if="handleValid" :src="checkGreenIcon" alt="">
        </div>
        <p v-if="handleValid && !errors.handle" class="profile-edit-valid">{{ copy.handleValid }}</p>
        <p v-if="errors.handle" class="profile-edit-error" role="alert">{{ errors.handle }}</p>

        <label class="profile-edit-label" for="profile-about">{{ copy.aboutMe }}</label>
        <textarea id="profile-about" v-model="form.aboutMe" dir="auto" maxlength="140" rows="4" @input="clearFieldError('aboutMe')"></textarea>
        <span class="profile-edit-about-meta"><small>{{ copy.noContactDetails }}</small><small>{{ form.aboutMe.length }}/140</small></span>
        <p v-if="errors.aboutMe" class="profile-edit-error" role="alert">{{ errors.aboutMe }}</p>
      </article>

      <article class="profile-edit-card profile-edit-choices">
        <h2>{{ copy.languages }}</h2>
        <div class="profile-edit-chip-list languages">
          <button v-for="option in languageOptions" :key="option.code" type="button" :class="{ selected: form.spokenLanguages.includes(option.code) }" :aria-pressed="form.spokenLanguages.includes(option.code)" :lang="option.code" :dir="['ar', 'he'].includes(option.code) ? 'rtl' : 'ltr'" @click="toggleLanguage(option.code)">{{ option.nativeName }}</button>
        </div>
        <p v-if="errors.spokenLanguages" class="profile-edit-error" role="alert">{{ errors.spokenLanguages }}</p>

        <h2>{{ copy.interests }}</h2>
        <div class="profile-edit-chip-list interests">
          <button v-for="option in interestOptions" :key="option[0]" type="button" :class="{ selected: form.interests.includes(option[0]) }" :aria-pressed="form.interests.includes(option[0])" @click="toggleInterest(option[0])">{{ option[1] }}</button>
        </div>
        <p v-if="errors.interests" class="profile-edit-error" role="alert">{{ errors.interests }}</p>
      </article>

      <article class="profile-edit-card profile-edit-preferences">
        <div class="profile-edit-readonly-row country-row">
          <span><strong>{{ copy.country }}</strong><small>{{ copy.countryHint }}</small></span>
          <b class="profile-edit-country" dir="ltr"><img v-if="countryFlag" :src="countryFlag" alt="">{{ countryCode || '—' }}</b>
        </div>
        <button class="profile-edit-readonly-row language-row" type="button" @click="openLanguage">
          <span><strong>{{ copy.appLanguage }}</strong><small>{{ copy.interfaceOnly }}</small></span>
          <b>{{ selectedLanguageName }}</b>
          <img :src="profileChevronIcon" alt="">
        </button>
      </article>

      <p class="profile-edit-privacy-note"><img :src="profileNoteShieldIcon" alt=""><span>{{ copy.editNote }}</span></p>
    </section>
  </main>
  </Transition>
</template>
