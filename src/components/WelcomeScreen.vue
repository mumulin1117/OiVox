<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '../i18n'
import { readEulaConsent, setEulaAccepted } from '../services/eulaPreference'
import { discoveryPeople, firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'
import { legalDocuments } from '../data/legalDocuments'
import { formatVoiceDuration } from '../services/voicePlaybackService'

const emit = defineEmits(['open-auth'])
const props = defineProps({ deferInitialEula: { type: Boolean, default: false } })
const { locale, t } = useI18n()
const accepted = ref(readEulaConsent().accepted)
const showEula = ref(!accepted.value && !props.deferInitialEula)
const eulaEntryMode = ref(showEula.value ? 'immediate' : 'none')
const eulaMode = ref('eula')
const legalCopy = computed(() => legalDocuments(locale.value))
const activeLegalDocument = computed(() => legalCopy.value[eulaMode.value] || legalCopy.value.eula)
const legalScroll = ref(null)
const eulaDragOffset = ref(0)
const eulaDragging = ref(false)
let eulaPointerID = null
let eulaDragStartY = 0
let eulaDragStartedAt = 0
const welcomeVoices = Object.freeze(firstDayFreeDiscoveryIDs.slice(0, 2).map((userID) => discoveryPeople[userID]).filter(Boolean))
const frontVoice = welcomeVoices[0]
const backVoice = welcomeVoices[1]

function syncConsent(event) {
  accepted.value = event.detail?.accepted === true
}

onMounted(() => window.addEventListener('oivox:eula-change', syncConsent))
onBeforeUnmount(() => window.removeEventListener('oivox:eula-change', syncConsent))

watch(() => props.deferInitialEula, (isDeferred, wasDeferred) => {
  if (wasDeferred && !isDeferred && !accepted.value) {
    nextTick(() => {
      eulaMode.value = 'eula'
      eulaEntryMode.value = 'after-launch'
      showEula.value = true
    })
  }
})

function toggleConsent() {
  accepted.value = !accepted.value
  setEulaAccepted(accepted.value)
}

function openLegal(mode) {
  eulaMode.value = mode
  eulaEntryMode.value = 'manual'
  showEula.value = true
  nextTick(() => { if (legalScroll.value) legalScroll.value.scrollTop = 0 })
}

function selectLegalMode(mode) {
  eulaMode.value = mode
  nextTick(() => { if (legalScroll.value) legalScroll.value.scrollTop = 0 })
}

function agree() {
  accepted.value = true
  setEulaAccepted(true)
  eulaEntryMode.value = 'none'
  showEula.value = false
}

function closeEula() {
  eulaPointerID = null
  eulaDragOffset.value = 0
  eulaDragging.value = false
  eulaEntryMode.value = 'none'
  showEula.value = false
}

function beginEulaDrag(event) {
  if (eulaPointerID !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
  eulaPointerID = event.pointerId
  eulaDragStartY = event.clientY
  eulaDragStartedAt = performance.now()
  eulaDragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveEulaDrag(event) {
  if (event.pointerId !== eulaPointerID) return
  const offset = Math.max(0, event.clientY - eulaDragStartY)
  eulaDragOffset.value = Math.min(offset, window.innerHeight * .42)
}

function finishEulaDrag(event, cancelled = false) {
  if (event.pointerId !== eulaPointerID) return
  const pointerID = eulaPointerID
  const elapsed = Math.max(1, performance.now() - eulaDragStartedAt)
  const velocity = eulaDragOffset.value / elapsed
  const shouldDismiss = !cancelled && (eulaDragOffset.value >= Math.min(110, window.innerHeight * .12) || velocity >= .62)
  eulaPointerID = null
  eulaDragging.value = false
  if (event.currentTarget.hasPointerCapture?.(pointerID)) event.currentTarget.releasePointerCapture(pointerID)
  if (shouldDismiss) closeEula()
  else eulaDragOffset.value = 0
}

function continueToAuth() {
  if (!accepted.value) {
    eulaMode.value = 'eula'
    eulaEntryMode.value = 'manual'
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
          <img :src="backVoice.avatarAsset" alt="">
          <span class="voice-card-time">{{ formatVoiceDuration(backVoice.voiceClip.durationMs) }}</span>
        </article>
        <article class="voice-card voice-card-front">
          <img :src="frontVoice.avatarAsset" alt="">
          <div class="voice-card-meta">
            <span><strong>{{ frontVoice.displayName }}</strong><small>{{ frontVoice.countryLabel }} · {{ frontVoice.timezone }}</small></span>
            <span class="voice-wave"><i v-for="height in [7, 12, 18, 22, 17, 24, 20, 15, 9]" :key="height" :style="{ height: `${height}px` }" /></span>
            <small>{{ formatVoiceDuration(frontVoice.voiceClip.durationMs) }}</small>
          </div>
        </article>
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

    <div
      v-if="showEula"
      class="modal-backdrop eula-page-backdrop"
      :class="{
        'eula-after-launch': eulaMode === 'eula' && eulaEntryMode === 'after-launch',
        'eula-manual-sheet': eulaEntryMode === 'manual',
      }"
      role="presentation"
      @click.self="closeEula"
    >
      <section
        v-if="eulaMode === 'eula'"
        class="eula-standalone-page"
        :class="{ 'is-dragging': eulaDragging }"
        :style="{ '--eula-drag-offset': `${eulaDragOffset}px` }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eula-title-eula"
      >
        <div
          class="eula-drag-zone"
          aria-hidden="true"
          @click.stop
          @pointerdown="beginEulaDrag"
          @pointermove="moveEulaDrag"
          @pointerup="finishEulaDrag"
          @pointercancel="finishEulaDrag($event, true)"
          @lostpointercapture="finishEulaDrag($event, true)"
        ><span /></div>
        <div ref="legalScroll" class="eula-standalone-scroll">
          <header class="eula-standalone-heading">
            <h1 id="eula-title-eula">{{ activeLegalDocument.title }}</h1>
            <p><span>{{ legalCopy.labels.effective }}</span><span>{{ legalCopy.labels.version }}</span></p>
          </header>
          <article class="eula-standalone-intro"><p>{{ activeLegalDocument.intro }}</p></article>
          <article v-for="item in activeLegalDocument.sections" :key="item.title" class="eula-standalone-section">
            <h2>{{ item.title }}</h2>
            <p>{{ item.body }}</p>
          </article>
          <p class="eula-standalone-contact">{{ legalCopy.labels.contact }}</p>
        </div>
        <footer class="eula-standalone-action">
          <button class="secondary-pill" type="button" @click="closeEula">{{ t('cancel') }}</button>
          <button class="primary-pill" type="button" @click="agree">{{ t('agreeContinue') }}</button>
        </footer>
      </section>

      <section
        v-else
        class="eula-standalone-page legal-document-sheet"
        :class="{ 'is-dragging': eulaDragging }"
        :style="{ '--eula-drag-offset': `${eulaDragOffset}px` }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`eula-title-${eulaMode}`"
      >
        <div
          class="eula-drag-zone"
          aria-hidden="true"
          @click.stop
          @pointerdown="beginEulaDrag"
          @pointermove="moveEulaDrag"
          @pointerup="finishEulaDrag"
          @pointercancel="finishEulaDrag($event, true)"
          @lostpointercapture="finishEulaDrag($event, true)"
        ><span /></div>
        <nav class="legal-tabs legal-tabs-two" :aria-label="legalCopy.labels.contents">
          <button v-for="mode in ['terms', 'privacy']" :key="mode" type="button" :class="{ selected: eulaMode === mode }" :aria-pressed="eulaMode === mode" @click="selectLegalMode(mode)">{{ legalCopy.labels[mode] }}</button>
        </nav>
        <h2 :id="`eula-title-${eulaMode}`">{{ activeLegalDocument.title }}</h2>
        <p class="legal-version"><span>{{ legalCopy.labels.effective }}</span><span>{{ legalCopy.labels.version }}</span></p>
        <div ref="legalScroll" class="eula-copy">
          <p class="legal-intro">{{ activeLegalDocument.intro }}</p>
          <article v-for="item in activeLegalDocument.sections" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </article>
          <p class="legal-contact">{{ legalCopy.labels.contact }}</p>
        </div>
        <div class="eula-actions legal-document-actions">
          <button v-if="accepted" class="secondary-pill" type="button" @click="closeEula">{{ t('close') }}</button>
          <button v-else class="primary-pill" type="button" @click="agree">{{ t('agreeContinue') }}</button>
        </div>
      </section>
    </div>
  </main>
</template>
