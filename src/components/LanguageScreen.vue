<script setup>
import { onMounted, ref } from 'vue'
import { languageOptions, syncNativeLanguage, useI18n } from '../i18n'

const emit = defineEmits(['back'])
const { locale, t, setLocale } = useI18n()
const selected = ref(locale.value)
const autoTranslate = ref(localStorage.getItem('oivox.autoTranslate') === 'true')
const toast = ref('')

onMounted(async () => {
  await syncNativeLanguage()
  selected.value = locale.value
})

function toggleTranslation() {
  autoTranslate.value = !autoTranslate.value
  localStorage.setItem('oivox.autoTranslate', String(autoTranslate.value))
}

async function save() {
  await setLocale(selected.value)
  toast.value = t('saved')
  window.setTimeout(() => { toast.value = '' }, 1800)
}
</script>

<template>
  <main class="language-screen app-screen">
    <header class="topbar">
      <button class="icon-button" type="button" :aria-label="t('back')" @click="emit('back')"><span aria-hidden="true">←</span></button>
      <h1>{{ t('language') }}</h1>
      <span class="topbar-spacer" />
    </header>
    <p class="subtitle">{{ t('subtitle') }}</p>
    <section class="language-list" :aria-label="t('language')">
      <button v-for="option in languageOptions" :key="option.code" class="language-row" :class="{ selected: selected === option.code }" type="button" @click="selected = option.code">
        <span class="flag" aria-hidden="true">{{ option.flag }}</span>
        <span class="language-copy">
          <strong :lang="option.code" :dir="['ar', 'he'].includes(option.code) ? 'rtl' : 'ltr'">{{ option.nativeName }}</strong>
          <small>{{ option.englishName }}</small>
        </span>
        <span v-if="['ar', 'he'].includes(option.code)" class="rtl-badge">{{ t('rtl') }}</span>
        <span v-else-if="selected === option.code" class="check" aria-hidden="true">✓</span>
      </button>
    </section>
    <button class="translate-card" type="button" role="switch" :aria-checked="autoTranslate" @click="toggleTranslation">
      <span class="translate-copy"><strong>{{ t('autoTranslate') }}</strong><small>{{ t('coinNote') }}</small></span>
      <span class="switch" :class="{ on: autoTranslate }"><span /></span>
    </button>
    <div class="bottom-action"><button class="save-button" type="button" @click="save">{{ t('save') }}</button></div>
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </main>
</template>
