<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import coinIcon from '../assets/coin.png'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import { discoveryExperienceContent } from '../data/discoveryExperienceContent'
import { useI18n } from '../i18n'
import { createTranslationHistoryStore } from '../services/translationHistoryStore'

const props = defineProps({
  accountId: { type: String, required: true },
  coinBalance: { type: Number, default: 0 },
})
const emit = defineEmits(['back'])
const { locale } = useI18n()
const copy = computed(() => discoveryExperienceContent(locale.value))
const store = createTranslationHistoryStore({ accountID: props.accountId })
const entries = ref(store.getSnapshot().entries)
const clearStep = ref('idle')
const clearing = ref(false)
const clearError = ref('')
let clearTimer = 0

const clearLabel = computed(() => clearStep.value === 'confirm' ? copy.value.confirmClear : clearStep.value === 'done' ? copy.value.historyCleared : copy.value.clearHistory)
const languagePair = (entry) => `${copy.value.languageNames[entry.sourceLanguage] || entry.sourceLanguage.toUpperCase()} → ${copy.value.languageNames[entry.targetLanguage] || entry.targetLanguage.toUpperCase()}`

function clearHistory() {
  if (clearing.value) return
  window.clearTimeout(clearTimer)
  clearError.value = ''
  if (clearStep.value === 'idle') {
    clearStep.value = 'confirm'
    clearTimer = window.setTimeout(() => { clearStep.value = 'idle' }, 2600)
    return
  }
  if (clearStep.value !== 'confirm') return
  clearing.value = true
  try {
    const operationID = `clear-history-${globalThis.crypto?.randomUUID?.() || Date.now()}`
    entries.value = store.clear(operationID).entries
    clearStep.value = 'done'
    clearTimer = window.setTimeout(() => { clearStep.value = 'idle' }, 1800)
  } catch {
    clearStep.value = 'idle'
    clearError.value = copy.value.requestFailed
  } finally {
    clearing.value = false
  }
}

onBeforeUnmount(() => window.clearTimeout(clearTimer))
</script>

<template>
  <main class="translation-history-screen app-screen">
    <header class="translation-history-nav">
      <button type="button" :aria-label="copy.dismiss" @click="emit('back')"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ copy.history }}</h1>
      <span class="translation-history-balance" dir="ltr"><img :src="coinIcon" alt=""><b>{{ coinBalance }}</b></span>
    </header>

    <section class="translation-history-scroll">
      <h2>{{ copy.historyTitle }}</h2>
      <p class="translation-history-subtitle">{{ copy.historySubtitle }}</p>

      <div v-if="entries.length" class="translation-history-list">
        <article v-for="entry in entries" :key="entry.id" class="translation-history-card">
          <span class="translation-history-avatar"><img :src="entry.avatarAsset" :alt="entry.displayName"><i><img :src="entry.flagAsset" alt=""></i></span>
          <div>
            <header><strong>{{ entry.displayName }}</strong><time>{{ copy[entry.whenKey] }}</time></header>
            <b class="translation-history-pair" dir="ltr">{{ languagePair(entry) }}</b>
            <p :lang="entry.sourceLanguage" :dir="['ar', 'he'].includes(entry.sourceLanguage) ? 'rtl' : 'ltr'">{{ entry.originalText }}</p>
            <span />
            <p class="translation-history-result">{{ entry.translatedText }}</p>
          </div>
        </article>
      </div>
      <div v-else class="translation-history-empty"><span /><h2>{{ copy.historyEmpty }}</h2></div>
    </section>

    <footer class="translation-history-footer">
      <p v-if="clearError" class="translation-history-error" role="alert">{{ clearError }}</p>
      <button type="button" :class="`is-${clearStep}`" :disabled="clearing || (!entries.length && clearStep !== 'done')" @click="clearHistory">{{ clearLabel }}</button>
      <p>{{ copy.aiNote }}</p>
    </footer>
  </main>
</template>
