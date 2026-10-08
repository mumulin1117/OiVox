<script setup>
import { computed, onMounted, ref } from 'vue'
import { reportBlockContent } from '../data/reportBlockContent'
import { useI18n } from '../i18n'

const props = defineProps({
  person: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
  source: { type: String, default: 'user' },
})
const emit = defineEmits(['close', 'submit'])
const { locale } = useI18n()
const copy = computed(() => reportBlockContent(locale.value))
const page = ref(null)
const confirmDialog = ref(null)
const reason = ref('harassment')
const details = ref('')
const alsoBlock = ref(true)
const confirmOpen = ref(false)

const countryText = computed(() => {
  const code = props.person.countryCode || ''
  let country = props.person.countryLabel || code
  try { country = new Intl.DisplayNames([locale.value], { type: 'region' }).of(code) || country } catch {}
  return [country, props.person.timezone].filter(Boolean).join(' · ')
})

function close() {
  if (props.busy) return
  if (confirmOpen.value) { confirmOpen.value = false; return }
  emit('close')
}

function requestSubmit() {
  if (props.busy) return
  if (!alsoBlock.value) { submit(false); return }
  confirmOpen.value = true
}

function focusConfirmDialog() { confirmDialog.value?.focus() }

function submit(block) {
  if (props.busy) return
  confirmOpen.value = false
  emit('submit', {
    reason: reason.value,
    details: details.value.trim(),
    alsoBlock: block,
    targetType: props.source === 'voice' ? 'voice' : 'user',
    voiceID: props.source === 'voice' ? props.person.voiceClip?.id || '' : '',
  })
}

onMounted(() => page.value?.focus())
</script>

<template>
  <div class="report-block-presentation app-screen">
  <main ref="page" class="report-block-screen" role="dialog" aria-modal="true" :aria-label="copy.title" tabindex="-1" @keydown.esc.stop="close">
    <header class="report-block-nav">
      <button type="button" :disabled="busy" @click="close">{{ copy.cancel }}</button>
      <h1>{{ copy.title }}</h1>
      <span aria-hidden="true" />
    </header>

    <form class="report-block-scroll" :aria-busy="busy" @submit.prevent="requestSubmit">
      <section class="report-block-person">
        <img class="report-block-avatar" :src="person.avatarAsset" :alt="person.displayName">
        <span><strong>{{ person.displayName }} <img v-if="person.flagAsset" :src="person.flagAsset" alt=""></strong><small>{{ countryText }}</small></span>
        <b>{{ copy.free }}</b>
      </section>

      <fieldset class="report-block-reasons">
        <legend>{{ copy.whatHappened }}</legend>
        <label v-for="item in copy.reasons" :key="item[0]" :class="{ selected: reason === item[0] }">
          <input v-model="reason" type="radio" name="report-reason" :value="item[0]">
          <i aria-hidden="true" />
          <span>{{ item[1] }}</span>
        </label>
      </fieldset>

      <label class="report-block-details">
        <span class="sr-only">{{ copy.details }}</span>
        <textarea v-model="details" maxlength="500" rows="1" :placeholder="copy.details" />
      </label>

      <label class="report-block-toggle">
        <input v-model="alsoBlock" type="checkbox">
        <i aria-hidden="true" />
        <span>{{ copy.alsoBlock }}</span>
      </label>

      <p v-if="error" class="report-block-error" role="alert">{{ error }}</p>
      <div class="report-block-spacer" />

      <footer class="report-block-footer">
        <button class="report-block-submit" type="submit" :disabled="busy">{{ busy ? copy.submitting : copy.submit }}</button>
        <p>{{ copy.reviewNote }}</p>
      </footer>
    </form>

    <Transition name="ios-sheet" @after-enter="focusConfirmDialog">
    <div v-if="confirmOpen" class="report-block-confirm-backdrop" role="presentation" @pointerdown.self="close">
      <section ref="confirmDialog" class="report-block-confirm" role="alertdialog" aria-modal="true" :aria-label="copy.blockTitle" tabindex="-1">
        <h2>{{ copy.blockTitle }}</h2>
        <p>{{ copy.blockBody }}</p>
        <div>
          <button type="button" :disabled="busy" @click="submit(false)">{{ copy.keepReporting }}</button>
          <button class="danger" type="button" :disabled="busy" @click="submit(true)">{{ copy.confirmBlock }}</button>
        </div>
      </section>
    </div>
    </Transition>
  </main>
  </div>
</template>
