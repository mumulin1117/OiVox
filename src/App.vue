<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AuthScreen from './components/AuthScreen.vue'
import FirstLaunchTransition from './components/FirstLaunchTransition.vue'
import LanguageScreen from './components/LanguageScreen.vue'
import MainHub from './components/MainHub.vue'
import RegistrationFlow from './components/RegistrationFlow.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import { installContentInteractionGuard } from './contentInteractionGuard'
import { syncNativeLanguage, useI18n } from './i18n'
import { installKeyboardViewport } from './keyboardViewport'
import { oivoxAccountApi } from './services/oivoxAccountApi'
import { mergeAccountUserWithLocalCache } from './services/accountUserCache'
import { attachProfileAvatarPreview } from './services/profileAvatar'

const { t } = useI18n()
const screen = ref('welcome')
const user = ref(null)
const restoring = ref(true)
const launchTransitionActive = ref(false)
const mainHubIntroRequested = ref(false)
const registrationDraft = ref(null)
const authRouteDirection = ref('forward')
const isAuthFlowScreen = computed(() => ['welcome', 'auth', 'registration'].includes(screen.value))
let removeContentInteractionGuard = () => {}
let removeKeyboardViewport = () => {}

onMounted(async () => {
  removeContentInteractionGuard = installContentInteractionGuard(document)
  removeKeyboardViewport = installKeyboardViewport(window, document)

  await syncNativeLanguage().catch(() => {})

  let hadSessionAtLaunch = false
  try {
    hadSessionAtLaunch = await oivoxAccountApi.hasSession()
    if (hadSessionAtLaunch) {
      user.value = await attachProfileAvatarPreview(mergeAccountUserWithLocalCache(await oivoxAccountApi.getProfile()))
      mainHubIntroRequested.value = true
      screen.value = 'authenticated'
    }
  } catch {
    await oivoxAccountApi.logout().catch(() => {})
  } finally {
    restoring.value = false
    if (!hadSessionAtLaunch) launchTransitionActive.value = true
  }
})

onBeforeUnmount(() => {
  removeContentInteractionGuard()
  removeKeyboardViewport()
})

function authenticated(profile) {
  const merged = mergeAccountUserWithLocalCache(profile)
  user.value = merged
  attachProfileAvatarPreview(merged).then((hydrated) => {
    if (user.value?.id === merged?.id) user.value = hydrated
  })
  registrationDraft.value = null
  launchTransitionActive.value = false
  mainHubIntroRequested.value = true
  screen.value = 'authenticated'
  window.dispatchEvent(new CustomEvent('oivox:authenticated', { detail: { user: merged } }))
}

function beginRegistration(draft) {
  authRouteDirection.value = 'forward'
  registrationDraft.value = draft
  screen.value = 'registration'
}

function returnToAuth(draft) {
  authRouteDirection.value = 'back'
  registrationDraft.value = draft
  screen.value = 'auth'
}

function cancelAuth() {
  authRouteDirection.value = 'back'
  registrationDraft.value = null
  screen.value = 'welcome'
}

function openAuth() {
  authRouteDirection.value = 'forward'
  screen.value = 'auth'
}

function registered(profile) {
  const merged = mergeAccountUserWithLocalCache(profile)
  user.value = merged
  attachProfileAvatarPreview(merged).then((hydrated) => {
    if (user.value?.id === merged?.id) user.value = hydrated
  })
  window.dispatchEvent(new CustomEvent('oivox:registered', { detail: { user: merged } }))
}

function profileUpdated(profile) {
  const merged = mergeAccountUserWithLocalCache(profile)
  user.value = merged
  attachProfileAvatarPreview(merged).then((hydrated) => {
    if (user.value?.id === merged?.id) user.value = hydrated
  })
}

async function logout() {
  await oivoxAccountApi.logout().catch(() => {})
  user.value = null
  registrationDraft.value = null
  launchTransitionActive.value = false
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

function completeLaunchTransition() {
  launchTransitionActive.value = false
}
</script>

<template>
  <div v-if="restoring" class="app-loading" role="status" :aria-label="t('restoringSession')"><span /></div>
  <template v-else>
    <Transition v-if="isAuthFlowScreen" :name="`auth-route-${authRouteDirection}`" mode="out-in">
      <div v-if="screen === 'welcome'" key="welcome" class="auth-route-frame">
        <WelcomeScreen
          :inert="launchTransitionActive"
          :aria-hidden="launchTransitionActive ? 'true' : undefined"
          :defer-initial-eula="launchTransitionActive"
          @open-auth="openAuth"
        />
        <FirstLaunchTransition v-if="launchTransitionActive" @complete="completeLaunchTransition" />
      </div>
      <AuthScreen v-else-if="screen === 'auth'" key="auth" :initial-draft="registrationDraft" @back="cancelAuth" @authenticated="authenticated" @begin-registration="beginRegistration" />
      <RegistrationFlow v-else key="registration" :draft="registrationDraft" @back-to-auth="returnToAuth" @registered="registered" @authenticated="authenticated" />
    </Transition>
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
</template>
