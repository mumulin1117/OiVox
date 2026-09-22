<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '../i18n'
import { readEulaConsent, setEulaAccepted } from '../services/eulaPreference'
import portraitLayla from '../assets/portraits/portrait-03.png'
import portraitNoah from '../assets/portraits/portrait-07.png'
import portraitTwo from '../assets/portraits/portrait-02.png'
import portraitFour from '../assets/portraits/portrait-04.png'

const emit = defineEmits(['open-auth'])
const { t } = useI18n()
const accepted = ref(readEulaConsent().accepted)
const showEula = ref(!accepted.value)
const eulaMode = ref('eula')

function syncConsent(event) {
  accepted.value = event.detail?.accepted === true
}

onMounted(() => window.addEventListener('oivox:eula-change', syncConsent))
onBeforeUnmount(() => window.removeEventListener('oivox:eula-change', syncConsent))

function toggleConsent() {
  accepted.value = !accepted.value
  setEulaAccepted(accepted.value)
}

function openLegal(mode) {
  eulaMode.value = mode
  showEula.value = true
}

function agree() {
  accepted.value = true
  setEulaAccepted(true)
  showEula.value = false
}

function continueToAuth() {
  if (!accepted.value) {
    eulaMode.value = 'eula'
    showEula.value = true
    return
  }
  emit('open-auth')
}
</script>

<template>
  <main class="welcome-screen app-screen">
    <div class="welcome-orb welcome-orb-purple" />
    <div class="welcome-orb welcome-orb-peach" />

    <section class="welcome-content">
      <header class="welcome-brand">
        <strong>OiVox</strong>
        <span>{{ t('welcomeTagline') }}</span>
      </header>

      <div class="welcome-heading-row">
        <div>
          <h1>{{ t('welcomeTitleLine1') }}<br>{{ t('welcomeTitleLine2') }}</h1>
          <p>{{ t('welcomeSubtitle') }}</p>
        </div>
        <div class="voice-note" aria-hidden="true">
          <span>{{ t('justVoice') }}</span>
          <svg viewBox="0 0 54 17"><path d="M2 10c10 5 23 4 32-2 6-4 12-5 18-2" /></svg>
        </div>
      </div>

      <div class="voice-cards" aria-hidden="true">
        <article class="voice-card voice-card-back">
          <img :src="portraitNoah" alt="">
          <span class="voice-card-time">0:07</span>
        </article>
        <article class="voice-card voice-card-front">
          <img :src="portraitLayla" alt="">
          <div class="voice-card-meta">
            <span><strong>Layla</strong><small>UAE · UTC+4</small></span>
            <span class="voice-wave"><i v-for="height in [7, 12, 18, 22, 17, 24, 20, 15, 9]" :key="height" :style="{ height: `${height}px` }" /></span>
            <small>0:07</small>
          </div>
        </article>
      </div>

      <div class="voice-community">
        <span class="avatar-stack" aria-hidden="true">
          <img v-for="(image, index) in [portraitLayla, portraitNoah, portraitTwo, portraitFour]" :key="image" :src="image" alt="" :style="{ zIndex: 4 - index }">
        </span>
        <span>{{ t('voiceCount') }}</span>
      </div>
    </section>

    <footer class="welcome-actions">
      <button class="primary-pill welcome-auth-button" type="button" @click="continueToAuth">
        {{ t('authEntry') }}
      </button>

      <div class="welcome-consent">
        <button class="consent-check" :class="{ checked: accepted }" type="button" role="checkbox" :aria-checked="accepted" :aria-label="t('acceptAgreement')" @click="toggleConsent">
          <svg v-if="accepted" viewBox="0 0 20 20" aria-hidden="true"><path d="m4.5 10.5 3.3 3.2 7.7-8" /></svg>
        </button>
        <p>
          {{ t('byContinuing') }}
          <button type="button" @click="openLegal('terms')">{{ t('terms') }}</button>
          {{ t('and') }}
          <button type="button" @click="openLegal('privacy')">{{ t('privacy') }}</button>.
          <span>{{ t('suggestions') }}</span>
        </p>
      </div>
    </footer>

    <div v-if="showEula" class="modal-backdrop" role="presentation" @click.self="accepted ? (showEula = false) : null">
      <section class="eula-sheet" role="dialog" aria-modal="true" :aria-labelledby="`eula-title-${eulaMode}`">
        <div class="sheet-handle" aria-hidden="true" />
        <h2 :id="`eula-title-${eulaMode}`">{{ t(eulaMode === 'privacy' ? 'privacyTitle' : eulaMode === 'terms' ? 'termsTitle' : 'eulaTitle') }}</h2>
        <div class="eula-copy">
          <p>{{ t('eulaIntro') }}</p>
          <h3>{{ t('eulaAgeTitle') }}</h3>
          <p>{{ t('eulaAgeBody') }}</p>
          <h3>{{ t('eulaConductTitle') }}</h3>
          <p>{{ t('eulaConductBody') }}</p>
          <h3>{{ t('eulaSafetyTitle') }}</h3>
          <p>{{ t('eulaSafetyBody') }}</p>
        </div>
        <div class="eula-actions">
          <button v-if="accepted" class="secondary-pill" type="button" @click="showEula = false">{{ t('close') }}</button>
          <button v-else class="primary-pill" type="button" @click="agree">{{ t('agreeContinue') }}</button>
        </div>
      </section>
    </div>
  </main>
</template>
