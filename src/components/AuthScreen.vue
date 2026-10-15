<script setup>
import { computed, nextTick, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import { useI18n } from '../i18n'
import { accountErrorMessageKey, oivoxAccountApi } from '../services/oivoxAccountApi'
import { readEulaConsent } from '../services/eulaPreference'

const props = defineProps({
  initialDraft: { type: Object, default: null },
})
const emit = defineEmits(['back', 'authenticated', 'begin-registration'])
const { t } = useI18n()

const mode = ref('signup')
const email = ref(props.initialDraft?.email || '')
const password = ref(props.initialDraft?.password || '')
const ageRange = ref(props.initialDraft?.ageRange || '')
const showPassword = ref(false)
const busy = ref(false)
const error = ref('')
const errorCode = ref('')
const emailInput = ref(null)
const passwordInput = ref(null)

const ages = computed(() => [
  { value: 'under18', label: t('under18'), note: t('notEligible') },
  { value: '18-24', label: '18 – 24', note: t('allFeatures') },
  { value: '25-34', label: '25 – 34', note: t('allFeatures') },
  { value: '35+', label: t('age35'), note: t('allFeatures') },
])

const submitLabel = computed(() => {
  if (busy.value) return t('loggingIn')
  return t(mode.value === 'signup' ? 'continue' : 'logIn')
})

function clearError() {
  error.value = ''
  errorCode.value = ''
}

function setMode(nextMode) {
  if (busy.value || mode.value === nextMode) return
  mode.value = nextMode
  password.value = ''
  ageRange.value = ''
  showPassword.value = false
  clearError()
  nextTick(() => emailInput.value?.focus())
}

function selectAge(value) {
  ageRange.value = value
  clearError()
}

function validate() {
  const normalizedEmail = email.value.trim()
  if (!normalizedEmail) return { message: t('emailRequired'), target: emailInput }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { message: t('invalidEmail'), target: emailInput }
  if (!password.value) return { message: t('passwordRequired'), target: passwordInput }
  if (password.value.length < 8) return { message: t('passwordTooShort'), target: passwordInput }
  if (mode.value === 'signup' && !ageRange.value) return { message: t('chooseAge') }
  if (mode.value === 'signup' && ageRange.value === 'under18') return { message: t('ageRestricted') }
  if (mode.value === 'signup' && !readEulaConsent().accepted) return { message: t('termsRequired') }
  return null
}

async function submit() {
  if (busy.value) return
  clearError()
  const validation = validate()
  if (validation) {
    error.value = validation.message
    await nextTick()
    validation.target?.value?.focus()
    return
  }

  const normalizedEmail = email.value.trim().toLowerCase()
  if (mode.value === 'signup') {
    const consent = readEulaConsent()
    emit('begin-registration', {
      ...(props.initialDraft || {}),
      email: normalizedEmail,
      password: password.value,
      ageRange: ageRange.value,
      acceptedTerms: true,
      termsVersion: consent.version,
    })
    return
  }

  busy.value = true
  try {
    const result = await oivoxAccountApi.login(normalizedEmail, password.value)
    emit('authenticated', result.user)
  } catch (requestError) {
    errorCode.value = requestError.code || 'REQUEST_FAILED'
    error.value = t(accountErrorMessageKey(errorCode.value))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="auth-screen app-screen">
    <div class="auth-orb" aria-hidden="true" />
    <header class="auth-nav">
      <button class="back-button" type="button" :aria-label="t('back')" @click="emit('back')">
        <img :src="arrowLeftIcon" alt="">
      </button>
      <strong>OiVox</strong>
      <span class="auth-step">{{ mode === 'signup' ? t('step1of7') : '' }}</span>
    </header>
    <div v-if="mode === 'signup'" class="auth-progress" aria-hidden="true"><span /></div>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <div class="auth-scroll-content">
        <h1>{{ t(mode === 'signup' ? 'createAccount' : 'logIn') }}</h1>
        <p class="privacy-kicker">{{ t('noRealName') }}</p>

        <div class="auth-tabs" role="tablist" :aria-label="t('authMode')">
          <button type="button" role="tab" :aria-selected="mode === 'signup'" :class="{ active: mode === 'signup' }" @click="setMode('signup')">{{ t('signUp') }}</button>
          <button type="button" role="tab" :aria-selected="mode === 'login'" :class="{ active: mode === 'login' }" @click="setMode('login')">{{ t('logIn') }}</button>
        </div>

        <label class="field-label" for="auth-email">{{ t('email') }}</label>
        <input id="auth-email" ref="emailInput" v-model="email" class="auth-input" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" :placeholder="t('emailPlaceholder')" :disabled="busy" @input="clearError">

        <label class="field-label" for="auth-password">{{ t('password') }}</label>
        <div class="password-field">
          <input id="auth-password" ref="passwordInput" v-model="password" class="auth-input" :type="showPassword ? 'text' : 'password'" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" :placeholder="t('passwordPlaceholder')" :disabled="busy" @input="clearError">
          <button type="button" :aria-label="t(showPassword ? 'hidePassword' : 'showPassword')" :disabled="busy" @click="showPassword = !showPassword">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>

        <section v-if="mode === 'signup'" class="age-section" aria-labelledby="age-title">
          <h2 id="age-title">{{ t('ageTitle') }}</h2>
          <p>{{ t('ageNote') }}</p>
          <div class="age-grid">
            <button v-for="age in ages" :key="age.value" type="button" :class="{ selected: ageRange === age.value, blocked: age.value === 'under18' }" :aria-pressed="ageRange === age.value" @click="selectAge(age.value)">
              <strong>{{ age.label }}</strong>
              <small>{{ age.note }}</small>
            </button>
          </div>
        </section>

        <div v-if="error" class="auth-error" role="alert">
          <span aria-hidden="true">!</span>
          <p>{{ error }}</p>
          <button v-if="errorCode === 'ACCOUNT_NOT_FOUND'" type="button" @click="setMode('signup')">{{ t('switchToSignup') }}</button>
          <button v-else-if="errorCode === 'EMAIL_IN_USE'" type="button" @click="setMode('login')">{{ t('switchToLogin') }}</button>
        </div>
      </div>

      <footer class="auth-submit-area">
        <button class="primary-pill" type="submit" :disabled="busy" :aria-busy="busy">
          <span v-if="busy" class="button-spinner" aria-hidden="true" />
          {{ submitLabel }}
        </button>
      </footer>
    </form>
  </main>
</template>
