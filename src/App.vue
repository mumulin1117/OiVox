<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AuthScreen from './components/AuthScreen.vue'
import LanguageScreen from './components/LanguageScreen.vue'
import MainHub from './components/MainHub.vue'
import RegistrationFlow from './components/RegistrationFlow.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import { installContentInteractionGuard } from './contentInteractionGuard'
import { syncNativeLanguage, useI18n } from './i18n'
import { installKeyboardViewport } from './keyboardViewport'
import { oivoxAccountApi } from './services/oivoxAccountApi'
import { attachProfileAvatarPreview } from './services/profileAvatar'

const { t } = useI18n()
const screen = ref('welcome')
const user = ref(null)
const restoring = ref(true)
const mainHubIntroRequested = ref(false)
const registrationDraft = ref(null)
let removeContentInteractionGuard = () => {}
let removeKeyboardViewport = () => {}

onMounted(async () => {
  removeContentInteractionGuard = installContentInteractionGuard(document)
  removeKeyboardViewport = installKeyboardViewport(window, document)

  syncNativeLanguage().catch(() => {})

  try {
    if (await oivoxAccountApi.hasSession()) {
      user.value = await attachProfileAvatarPreview(await oivoxAccountApi.getProfile())
      mainHubIntroRequested.value = true
      screen.value = 'authenticated'
    }
  } catch {
    await oivoxAccountApi.logout().catch(() => {})
  } finally {
    restoring.value = false
  }
})

onBeforeUnmount(() => {
  removeContentInteractionGuard()
  removeKeyboardViewport()
})

function authenticated(profile) {
  user.value = profile
  attachProfileAvatarPreview(profile).then((hydrated) => {
    if (user.value?.id === profile?.id) user.value = hydrated
  })
  registrationDraft.value = null
  mainHubIntroRequested.value = true
  screen.value = 'authenticated'
  window.dispatchEvent(new CustomEvent('oivox:authenticated', { detail: { user: profile } }))
}

function beginRegistration(draft) {
  registrationDraft.value = draft
  screen.value = 'registration'
}

function returnToAuth(draft) {
  registrationDraft.value = draft
  screen.value = 'auth'
}

function cancelAuth() {
  registrationDraft.value = null
  screen.value = 'welcome'
}

function registered(profile) {
  user.value = profile
  attachProfileAvatarPreview(profile).then((hydrated) => {
    if (user.value?.id === profile?.id) user.value = hydrated
  })
  window.dispatchEvent(new CustomEvent('oivox:registered', { detail: { user: profile } }))
}

function profileUpdated(profile) {
  user.value = profile
  attachProfileAvatarPreview(profile).then((hydrated) => {
    if (user.value?.id === profile?.id) user.value = hydrated
  })
}

async function logout() {
  await oivoxAccountApi.logout().catch(() => {})
  user.value = null
  registrationDraft.value = null
  screen.value = 'welcome'
}

function openLanguage() {
  screen.value = 'language'
}

function closeLanguage() {
  screen.value = 'authenticated'
}

function completeMainHubIntro() {
  mainHubIntroRequested.value = false
}
</script>

<template>
  <div v-if="restoring" class="app-loading" role="status" :aria-label="t('restoringSession')"><span /></div>
  <WelcomeScreen v-else-if="screen === 'welcome'" @open-auth="screen = 'auth'" />
  <AuthScreen v-else-if="screen === 'auth'" :initial-draft="registrationDraft" @back="cancelAuth" @authenticated="authenticated" @begin-registration="beginRegistration" />
  <RegistrationFlow v-else-if="screen === 'registration' && registrationDraft" :draft="registrationDraft" @back-to-auth="returnToAuth" @registered="registered" @authenticated="authenticated" />
  <LanguageScreen v-else-if="screen === 'language'" @back="closeLanguage" />
  <MainHub
    v-else
    :user="user"
    :play-intro="mainHubIntroRequested"
    @intro-complete="completeMainHubIntro"
    @open-language="openLanguage"
    @profile-updated="profileUpdated"
    @logout="logout"
  />
</template>
