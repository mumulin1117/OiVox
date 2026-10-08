<script setup>
import { nextTick, onMounted, ref } from 'vue'
import coinIcon from '../assets/coin.png'
import insufficientWarningArt from '../assets/slices/coin-insufficient-warning@2x.png'

const props = defineProps({
  mode: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  cost: { type: Number, required: true },
  balance: { type: Number, required: true },
  costLabel: { type: String, required: true },
  balanceLabel: { type: String, required: true },
  afterLabel: { type: String, required: true },
  shortByLabel: { type: String, required: true },
  cancelLabel: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  getCoinsLabel: { type: String, required: true },
  busyLabel: { type: String, required: true },
  note: { type: String, default: '' },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'confirm', 'get-coins'])
const dialog = ref(null)
const dragOffset = ref(0)
const dragging = ref(false)
let pointerID = null
let dragStartY = 0
let dragStartedAt = 0

function resetDrag() {
  pointerID = null
  dragOffset.value = 0
  dragging.value = false
}

function close() {
  if (props.busy) return
  resetDrag()
  emit('close')
}

function beginDrag(event) {
  if (props.busy || pointerID !== null || (event.pointerType === 'mouse' && event.button !== 0)) return
  pointerID = event.pointerId
  dragStartY = event.clientY
  dragStartedAt = performance.now()
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveDrag(event) {
  if (event.pointerId !== pointerID) return
  dragOffset.value = Math.min(Math.max(0, event.clientY - dragStartY), window.innerHeight * .42)
}

function finishDrag(event, cancelled = false) {
  if (event.pointerId !== pointerID) return
  const capturedPointerID = pointerID
  const elapsed = Math.max(1, performance.now() - dragStartedAt)
  const velocity = dragOffset.value / elapsed
  const shouldDismiss = !cancelled
    && !props.busy
    && (dragOffset.value >= Math.min(110, window.innerHeight * .12) || velocity >= .62)

  pointerID = null
  dragging.value = false
  if (event.currentTarget.hasPointerCapture?.(capturedPointerID)) {
    event.currentTarget.releasePointerCapture(capturedPointerID)
  }

  if (shouldDismiss) close()
  else dragOffset.value = 0
}

onMounted(() => nextTick(() => dialog.value?.focus()))
</script>

<template>
  <div class="voice-discovery-modal is-coin-spend-sheet" role="presentation" @click.self="close" @keydown.esc.stop="close">
    <section
      ref="dialog"
      class="voice-discovery-coin-dialog"
      :class="[mode === 'confirm' ? 'is-confirm' : 'is-insufficient', { 'is-dragging': dragging }]"
      :style="{ '--coin-sheet-drag-offset': `${dragOffset}px` }"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      :aria-busy="busy"
      tabindex="-1"
    >
      <div
        class="voice-discovery-coin-drag-zone"
        aria-hidden="true"
        @click.stop
        @pointerdown="beginDrag"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag($event, true)"
        @lostpointercapture="finishDrag($event, true)"
      >
        <span class="voice-discovery-coin-handle" />
      </div>
      <header class="voice-discovery-coin-header">
        <span v-if="mode === 'confirm'" class="voice-discovery-coin-art"><img :src="coinIcon" alt=""></span>
        <img v-else class="voice-discovery-insufficient-art" :src="insufficientWarningArt" alt="">
        <span><h2>{{ title }}</h2><p>{{ body }}</p></span>
      </header>

      <dl v-if="mode === 'confirm'" class="voice-discovery-coin-breakdown">
        <div><dt>{{ costLabel }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">{{ cost }}</dd></div>
        <div><dt>{{ balanceLabel }}</dt><dd dir="ltr"><img :src="coinIcon" alt="">{{ balance }}</dd></div>
        <div><dt>{{ afterLabel }}</dt><dd class="is-after" dir="ltr"><img :src="coinIcon" alt="">{{ Math.max(0, balance - cost) }}</dd></div>
      </dl>
      <div v-else class="voice-discovery-coin-shortfall"><span>{{ shortByLabel }}</span><b dir="ltr"><img :src="coinIcon" alt="">{{ Math.max(0, cost - balance) }}</b></div>

      <p v-if="error" class="voice-discovery-sheet-error" role="alert">{{ error }}</p>
      <div class="voice-discovery-coin-actions coin-spend-dialog-actions">
        <button class="is-cancel" type="button" :disabled="busy" @click="close">{{ cancelLabel }}</button>
        <button v-if="mode === 'confirm'" class="is-primary" type="button" :disabled="busy" @click="emit('confirm')">{{ busy ? busyLabel : confirmLabel }}</button>
        <button v-else class="is-primary" type="button" @click="emit('get-coins')">{{ getCoinsLabel }}</button>
      </div>
      <p v-if="note" class="voice-discovery-coin-note">{{ note }}</p>
    </section>
  </div>
</template>
