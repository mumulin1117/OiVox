<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import checkIcon from '../assets/icons/check-large.svg'
import { discoveryFlagAssets } from '../data/discoveryFixtures'
import { languageOptions, syncNativeLanguage, useI18n } from '../i18n'

const emit = defineEmits(['back'])
const { locale, t, setLocale } = useI18n()
const selected = ref(locale.value)
const autoTranslate = ref(localStorage.getItem('oivox.autoTranslate') === 'true')
const toast = ref('')
const saving = ref(false)
const saveError = ref('')
let toastTimer = 0
const languageFlagAssets = Object.freeze({
  en: discoveryFlagAssets.GB,
  ar: './assets/discovery/flags/flag-ae.svg',
  he: discoveryFlagAssets.IL,
  tr: discoveryFlagAssets.TR,
  fr: discoveryFlagAssets.FR,
  de: discoveryFlagAssets.DE,
  ja: discoveryFlagAssets.JP,
  ko: discoveryFlagAssets.KR,
})

onMounted(async () => {
  await syncNativeLanguage()
  selected.value = locale.value
})

function toggleTranslation() {
  if (saving.value) return
  autoTranslate.value = !autoTranslate.value
  localStorage.setItem('oivox.autoTranslate', String(autoTranslate.value))
}

function selectLanguage(language) {
  if (saving.value) return
  selected.value = language
  saveError.value = ''
}

async function save() {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  window.clearTimeout(toastTimer)
  try {
    await setLocale(selected.value)
    toast.value = t('saved')
    toastTimer = window.setTimeout(() => { toast.value = '' }, 1800)
  } catch {
    saveError.value = t('requestFailed')
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => window.clearTimeout(toastTimer))
</script>

<template>
  <main class="language-screen app-screen" :aria-busy="saving">
    <header class="language-topbar">
      <button class="language-back" type="button" :aria-label="t('back')" :disabled="saving" @click="emit('back')"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ t('language') }}</h1>
      <span class="language-topbar-spacer" aria-hidden="true" />
    </header>
    <div class="language-scroll">
      <p class="language-subtitle">{{ t('subtitle') }}</p>
      <section class="language-list" :aria-label="t('language')">
        <button v-for="option in languageOptions" :key="option.code" class="language-option" :class="{ selected: selected === option.code }" type="button" :aria-pressed="selected === option.code" :disabled="saving" @click="selectLanguage(option.code)">
          <span class="language-flag" aria-hidden="true"><img :src="languageFlagAssets[option.code]" alt=""></span>
          <span class="language-copy">
            <strong :lang="option.code" :dir="['ar', 'he'].includes(option.code) ? 'rtl' : 'ltr'">{{ option.nativeName }}</strong>
            <small lang="en" dir="ltr">{{ option.englishName }}</small>
          </span>
          <span class="language-option-end">
            <span v-if="['ar', 'he'].includes(option.code)" class="rtl-badge">{{ t('rtl') }}</span>
            <img v-if="selected === option.code" class="language-check" :src="checkIcon" alt="">
          </span>
        </button>
      </section>
      <button class="translate-card" type="button" role="switch" :aria-checked="autoTranslate" :disabled="saving" @click="toggleTranslation">
        <span class="translate-copy"><strong>{{ t('autoTranslate') }}</strong><small>{{ t('coinNote') }}</small></span>
        <span class="language-switch" :class="{ on: autoTranslate }" aria-hidden="true"><span /></span>
      </button>
    </div>
    <p v-if="saveError" class="language-save-error" role="alert">{{ saveError }}</p>
    <div class="language-bottom-action"><button class="language-save-button" type="button" :disabled="saving" @click="save">{{ t('save') }}</button></div>
    <div v-if="toast" class="language-toast" role="status">{{ toast }}</div>
  </main>
</template>
