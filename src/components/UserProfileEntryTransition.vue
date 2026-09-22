<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  avatar: { type: String, required: true },
})

const emit = defineEmits(['complete'])
const root = ref(null)
const backdrop = ref(null)
const traveler = ref(null)
const phase = ref('idle')

const animations = new Set()
let sourceTarget = null
let hubScroll = null
let reducedMotionQuery = null
let disposed = false
let completed = false
let sequenceID = 0

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
  for (const target of [sourceTarget, hubScroll]) {
    target?.getAnimations().forEach((animation) => animation.cancel())
    if (!target) continue
    target.style.removeProperty('opacity')
    target.style.removeProperty('filter')
    target.style.removeProperty('transform')
    target.style.removeProperty('visibility')
  }
}

function pointFromRect(rect) {
  const rootRect = root.value.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - rootRect.left,
    y: rect.top + rect.height / 2 - rootRect.top,
    size: Math.max(44, Math.min(76, Math.min(rect.width, rect.height))),
  }
}

function setTraveler(point, scale = 1, opacity = 1) {
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
  emit('complete')
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

  sourceTarget = document.querySelector('[data-profile-center-source]')
  hubScroll = document.querySelector('.hub-scroll')
  if (reducedMotionQuery?.matches || !sourceTarget || !hubScroll || !root.value || !backdrop.value || !traveler.value) {
    finishImmediately()
    return
  }

  const rootRect = root.value.getBoundingClientRect()
  const start = pointFromRect(sourceTarget.getBoundingClientRect())
  const lift = {
    x: rootRect.width * .66,
    y: Math.max(112, rootRect.height * .22),
    size: Math.min(88, Math.max(68, rootRect.width * .2)),
  }
  const landing = {
    x: rootRect.width * .5,
    y: rootRect.height * .43,
    size: Math.min(116, Math.max(92, rootRect.width * .27)),
  }

  setTraveler(start, .96, 1)
  phase.value = 'extracting'
  await Promise.all([
    waitFor(sourceTarget.animate([
      { opacity: 1, filter: 'blur(0) saturate(1)', transform: 'scale(1)' },
      { opacity: .05, filter: 'blur(3px) saturate(.62)', transform: 'scale(.84)' },
    ], { duration: 340, easing: 'cubic-bezier(.2,.76,.22,1)', fill: 'forwards' })),
    waitFor(traveler.value.animate([
      { left: `${start.x}px`, top: `${start.y}px`, width: `${start.size}px`, height: `${start.size}px`, transform: 'translate(-50%, -50%) scale(.96)', opacity: 1 },
      { left: `${(start.x + lift.x) / 2}px`, top: `${Math.min(start.y, lift.y) - 38}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1.14) rotate(4deg)', opacity: 1, offset: .55 },
      { left: `${lift.x}px`, top: `${lift.y}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1) rotate(0)', opacity: 1 },
    ], { duration: 620, easing: 'cubic-bezier(.18,.76,.2,1)', fill: 'forwards' })),
    waitFor(hubScroll.animate([
      { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
      { opacity: 0, filter: 'blur(11px)', transform: 'scale(.985)' },
    ], { delay: 150, duration: 460, easing: 'ease', fill: 'forwards' })),
    waitFor(backdrop.value.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 130, duration: 470, easing: 'ease', fill: 'forwards' })),
  ])
  if (disposed || token !== sequenceID) return

  setTraveler(lift, 1, 1)
  phase.value = 'falling'
  await waitFor(traveler.value.animate([
    { left: `${lift.x}px`, top: `${lift.y}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1) rotate(0)', opacity: 1 },
    { left: `${(lift.x + landing.x) / 2}px`, top: `${landing.y - 58}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(1.08) rotate(-3deg)', opacity: 1, offset: .48 },
    { left: `${landing.x}px`, top: `${landing.y + 8}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(1.04) rotate(1deg)', opacity: 1, offset: .82 },
    { left: `${landing.x}px`, top: `${landing.y}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
  ], { duration: 620, easing: 'cubic-bezier(.2,.82,.22,1)', fill: 'forwards' }))
  if (disposed || token !== sequenceID) return

  phase.value = 'handing-off'
  await waitFor(traveler.value.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, filter: 'blur(0)' },
    { transform: 'translate(-50%, -50%) scale(.78)', opacity: 0, filter: 'blur(3px)' },
  ], { duration: 180, easing: 'ease-in', fill: 'forwards' }))
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
  <section ref="root" class="user-profile-entry-transition" :class="`is-${phase}`" aria-busy="true" aria-hidden="true">
    <div ref="backdrop" class="user-profile-entry-backdrop" />
    <div ref="traveler" class="user-profile-entry-traveler"><img :src="avatar" alt=""></div>
  </section>
</template>
