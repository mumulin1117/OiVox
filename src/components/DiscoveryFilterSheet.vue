<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { discoveryFilterContent, discoveryFilterLanguageOptions } from '../data/discoveryFilterContent'
import { useI18n } from '../i18n'
import { EMPTY_DISCOVERY_FILTERS, normalizeDiscoveryFilters } from '../services/discoveryFilters'

const props = defineProps({
  filters: { type: Object, default: () => ({ ...EMPTY_DISCOVERY_FILTERS }) },
})
const emit = defineEmits(['close', 'apply'])
const { locale } = useI18n()
const copy = computed(() => discoveryFilterContent(locale.value))
const draft = ref(normalizeDiscoveryFilters(props.filters))
const dialog = ref(null)
const submitting = ref(false)
const dragOffset = ref(0)
const dragging = ref(false)
const regions = Object.freeze(['middleEast', 'europe', 'eastAsia'])
let pointerID = null
let dragStartY = 0
let dragStartedAt = 0

function toggleRegion(region) {
  if (submitting.value) return
  draft.value = {
    ...draft.value,
    regions: draft.value.regions.includes(region)
      ? draft.value.regions.filter((item) => item !== region)
      : [...draft.value.regions, region],
  }
}

function useAnywhere() {
  if (submitting.value) return
  draft.value = { ...draft.value, regions: [] }
}

function toggleLanguage(language) {
  if (submitting.value) return
  draft.value = {
    ...draft.value,
    languages: draft.value.languages.includes(language)
      ? draft.value.languages.filter((item) => item !== language)
      : [...draft.value.languages, language],
  }
}

function toggleFlag(key) {
  if (submitting.value) return
  draft.value = { ...draft.value, [key]: !draft.value[key] }
}

function reset() {
  if (submitting.value) return
  draft.value = normalizeDiscoveryFilters(EMPTY_DISCOVERY_FILTERS)
}

function close() {
  if (submitting.value) return
  pointerID = null
  dragOffset.value = 0
  dragging.value = false
  emit('close')
}

function apply() {
  if (submitting.value) return
  submitting.value = true
  emit('apply', normalizeDiscoveryFilters(draft.value))
}

function beginDrag(event) {
  if (submitting.value || pointerID !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
  pointerID = event.pointerId
  dragStartY = event.clientY
  dragStartedAt = performance.now()
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveDrag(event) {
  if (event.pointerId !== pointerID) return
  const offset = Math.max(0, event.clientY - dragStartY)
  dragOffset.value = Math.min(offset, window.innerHeight * .42)
}

function finishDrag(event, cancelled = false) {
  if (event.pointerId !== pointerID) return
  const capturedPointerID = pointerID
  const elapsed = Math.max(1, performance.now() - dragStartedAt)
  const velocity = dragOffset.value / elapsed
  const shouldDismiss = !cancelled
    && !submitting.value
    && (dragOffset.value >= Math.min(110, window.innerHeight * .12) || velocity >= .62)

  pointerID = null
  dragging.value = false
  if (event.currentTarget.hasPointerCapture?.(capturedPointerID)) {
    event.currentTarget.releasePointerCapture(capturedPointerID)
  }

  if (shouldDismiss) close()
  else dragOffset.value = 0
}

onMounted(async () => {
  await nextTick()
  dialog.value?.focus()
})
</script>

<template>
  <div class="voice-filter-modal" role="presentation" @click.self="close" @keydown.esc.stop="close">
    <section
      ref="dialog"
      class="voice-filter-sheet"
      :class="{ 'is-dragging': dragging }"
      :style="{ '--filter-drag-offset': `${dragOffset}px` }"
      role="dialog"
      aria-modal="true"
      :aria-label="copy.title"
      tabindex="-1"
    >
      <div
        class="voice-filter-drag-zone"
        aria-hidden="true"
        @pointerdown="beginDrag"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag($event, true)"
        @lostpointercapture="finishDrag($event, true)"
      >
        <span class="voice-filter-handle" />
      </div>
      <header class="voice-filter-header">
        <button type="button" :disabled="submitting" @click="close">{{ copy.cancel }}</button>
        <h2>{{ copy.title }}</h2>
        <button class="is-reset" type="button" :disabled="submitting" @click="reset">{{ copy.reset }}</button>
      </header>

      <div class="voice-filter-scroll">
        <p class="voice-filter-scope-note">{{ copy.purchaseOnlyNote }}</p>

        <fieldset class="voice-filter-group voice-filter-region">
          <legend>{{ copy.region }}</legend>
          <div class="voice-filter-chips">
            <button v-for="region in regions" :key="region" type="button" :class="{ selected: draft.regions.includes(region) }" :aria-pressed="draft.regions.includes(region)" :disabled="submitting" @click="toggleRegion(region)">{{ copy.regions[region] }}</button>
            <button type="button" :class="{ selected: draft.regions.length === 0 }" :aria-pressed="draft.regions.length === 0" :disabled="submitting" @click="useAnywhere">{{ copy.regions.anywhere }}</button>
          </div>
        </fieldset>

        <fieldset class="voice-filter-group voice-filter-language">
          <legend>{{ copy.language }}</legend>
          <div class="voice-filter-chips">
            <button v-for="language in discoveryFilterLanguageOptions" :key="language.id" type="button" :class="{ selected: draft.languages.includes(language.id) }" :aria-pressed="draft.languages.includes(language.id)" :disabled="submitting" @click="toggleLanguage(language.id)">{{ language.label }}</button>
          </div>
        </fieldset>

        <fieldset class="voice-filter-group voice-filter-more">
          <legend>{{ copy.more }}</legend>
          <button type="button" role="switch" :aria-checked="draft.onlineNow" :disabled="submitting" @click="toggleFlag('onlineNow')">
            <span><strong>{{ copy.onlineNow }}</strong><small>{{ copy.onlineHint }}</small></span>
            <i :class="{ selected: draft.onlineNow }" aria-hidden="true"><b /></i>
          </button>
          <button type="button" role="switch" :aria-checked="draft.notHeardYet" :disabled="submitting" @click="toggleFlag('notHeardYet')">
            <span><strong>{{ copy.notHeardYet }}</strong><small>{{ copy.notHeardHint }}</small></span>
            <i :class="{ selected: draft.notHeardYet }" aria-hidden="true"><b /></i>
          </button>
        </fieldset>
      </div>

      <footer class="voice-filter-footer">
        <button type="button" :disabled="submitting" @click="apply">{{ copy.showVoices }}</button>
      </footer>
    </section>
  </div>
</template>
