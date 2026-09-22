<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  voice: { type: Object, required: true },
})

const emit = defineEmits(['complete'])
const root = ref(null)
const blankPage = ref(null)
const traveler = ref(null)
const phase = ref('idle')

const animations = new Set()
let sourceTarget = null
let hubScroll = null
let reducedMotionQuery = null
let disposed = false
let sequenceID = 0
let completed = false

function tracked(animation) {
  animations.add(animation)
  animation.finished.catch(() => {}).finally(() => animations.delete(animation))
  return animation
}

function waitFor(animation) {
  return tracked(animation).finished.catch(() => {})
}

function cancelAnimations() {
  animations.forEach((animation) => animation.cancel())
  animations.clear()
}

function clearSourceState() {
  sourceTarget?.getAnimations().forEach((animation) => animation.cancel())
  if (sourceTarget) {
    sourceTarget.style.removeProperty('opacity')
    sourceTarget.style.removeProperty('filter')
    sourceTarget.style.removeProperty('transform')
  }
  hubScroll?.getAnimations().forEach((animation) => animation.cancel())
  if (hubScroll) {
    hubScroll.style.removeProperty('opacity')
    hubScroll.style.removeProperty('filter')
    hubScroll.style.removeProperty('transform')
    hubScroll.style.removeProperty('visibility')
  }
}

function pointFromRect(rect) {
  const rootRect = root.value.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - rootRect.left,
    y: rect.top + rect.height / 2 - rootRect.top,
    size: Math.max(44, Math.min(94, Math.min(rect.width, rect.height))),
  }
}

function setTraveler(point, scale = 1, opacity = 1) {
  if (!traveler.value) return
  traveler.value.style.left = `${point.x}px`
  traveler.value.style.top = `${point.y}px`
  traveler.value.style.width = `${point.size}px`
  traveler.value.style.height = `${point.size}px`
  traveler.value.style.opacity = String(opacity)
  traveler.value.style.transform = `translate(-50%, -50%) scale(${scale})`
}

function finish() {
  if (completed || disposed) return
  completed = true
  phase.value = 'complete'
  if (hubScroll) hubScroll.style.visibility = 'hidden'
  emit('complete', props.voice.id)
}

function finishImmediately() {
  sequenceID += 1
  cancelAnimations()
  finish()
}

async function runEntry() {
  const token = ++sequenceID
  await nextTick()
  if (disposed || token !== sequenceID) return

  sourceTarget = document.querySelector(`[data-discovery-source="${props.voice.id}"]`)
  hubScroll = document.querySelector('.hub-scroll')
  if (reducedMotionQuery?.matches || !sourceTarget || !root.value || !traveler.value || !blankPage.value) {
    finishImmediately()
    return
  }

  const rootRect = root.value.getBoundingClientRect()
  const start = pointFromRect(sourceTarget.getBoundingClientRect())
  const lift = {
    x: rootRect.width * .5,
    y: Math.max(104, rootRect.height * .2),
    size: Math.min(82, Math.max(66, rootRect.width * .19)),
  }
  const landing = {
    x: rootRect.width * .5,
    y: rootRect.height * .43,
    size: Math.min(112, Math.max(86, rootRect.width * .25)),
  }

  setTraveler(start, .98, 1)
  phase.value = 'extracting'
  const sourceFade = waitFor(sourceTarget.animate([
    { opacity: 1, filter: 'blur(0) saturate(1)', transform: 'scale(1)' },
    { opacity: .04, filter: 'blur(3px) saturate(.65)', transform: 'scale(.86)' },
  ], {
    duration: 360,
    easing: 'cubic-bezier(.2,.76,.22,1)',
    fill: 'forwards',
  }))
  const extract = waitFor(traveler.value.animate([
    { left: `${start.x}px`, top: `${start.y}px`, width: `${start.size}px`, height: `${start.size}px`, transform: 'translate(-50%, -50%) scale(.98)', borderRadius: '24%', opacity: 1 },
    { left: `${(start.x + lift.x) / 2}px`, top: `${Math.min(start.y, lift.y) - 42}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1.13) rotate(-4deg)', borderRadius: '50%', opacity: 1, offset: .54 },
    { left: `${lift.x}px`, top: `${lift.y}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1)', borderRadius: '50%', opacity: 1 },
  ], {
    duration: 720,
    easing: 'cubic-bezier(.18,.76,.2,1)',
    fill: 'forwards',
  }))
  const clearHub = hubScroll ? waitFor(hubScroll.animate([
    { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
    { opacity: 0, filter: 'blur(10px)', transform: 'scale(.985)' },
  ], {
    delay: 190,
    duration: 520,
    easing: 'ease',
    fill: 'forwards',
  })) : Promise.resolve()
  const revealBlank = waitFor(blankPage.value.animate([
    { opacity: 0 },
    { opacity: 1 },
  ], {
    delay: 170,
    duration: 500,
    easing: 'ease',
    fill: 'forwards',
  }))

  await Promise.all([sourceFade, extract, clearHub, revealBlank])
  if (disposed || token !== sequenceID) return

  setTraveler(lift, 1, 1)
  phase.value = 'falling'
  await waitFor(traveler.value.animate([
    { left: `${lift.x}px`, top: `${lift.y}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1) rotate(0)', opacity: 1 },
    { left: `${landing.x}px`, top: `${landing.y + 10}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(1.08) rotate(2deg)', opacity: 1, offset: .72 },
    { left: `${landing.x}px`, top: `${landing.y - 4}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(.97) rotate(0)', opacity: 1, offset: .88 },
    { left: `${landing.x}px`, top: `${landing.y}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
  ], {
    duration: 680,
    easing: 'cubic-bezier(.2,.82,.22,1)',
    fill: 'forwards',
  }))
  if (disposed || token !== sequenceID) return

  phase.value = 'handing-off'
  await waitFor(traveler.value.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, filter: 'blur(0)' },
    { transform: 'translate(-50%, -50%) scale(.72)', opacity: 0, filter: 'blur(4px)' },
  ], {
    duration: 210,
    easing: 'ease-in',
    fill: 'forwards',
  }))
  if (disposed || token !== sequenceID) return
  finish()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') finishImmediately()
}

function handleMotionPreference(event) {
  if (event.matches) finishImmediately()
}

function handleViewportChange() {
  if (!completed) finishImmediately()
}

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('resize', handleViewportChange)
  window.visualViewport?.addEventListener('resize', handleViewportChange)
  if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', handleMotionPreference)
  else reducedMotionQuery.addListener(handleMotionPreference)
  runEntry()
})

onBeforeUnmount(() => {
  disposed = true
  sequenceID += 1
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', handleViewportChange)
  window.visualViewport?.removeEventListener('resize', handleViewportChange)
  if (reducedMotionQuery?.removeEventListener) reducedMotionQuery.removeEventListener('change', handleMotionPreference)
  else reducedMotionQuery?.removeListener(handleMotionPreference)
  cancelAnimations()
  clearSourceState()
})
</script>

<template>
  <section ref="root" class="voice-discovery-entry-transition" :class="`is-${phase}`" aria-busy="true" aria-hidden="true">
    <div ref="blankPage" class="voice-discovery-entry-blank" />
    <div ref="traveler" class="voice-discovery-entry-traveler">
      <img :src="voice.avatarAsset" alt="">
      <span v-if="voice.flagAsset"><img :src="voice.flagAsset" alt=""></span>
    </div>
  </section>
</template>
