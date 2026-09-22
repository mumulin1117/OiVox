<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  voice: { type: Object, required: true },
  sourceRect: { type: Object, default: null },
})

const emit = defineEmits(['complete'])
const root = ref(null)
const backdrop = ref(null)
const traveler = ref(null)
const phase = ref('idle')

const animations = new Set()
let hubScroll = null
let targetAvatar = null
let targetItem = null
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

function clearInlineState() {
  for (const target of [hubScroll, targetAvatar, targetItem]) {
    target?.getAnimations().forEach((animation) => animation.cancel())
    if (!target) continue
    target.style.removeProperty('opacity')
    target.style.removeProperty('filter')
    target.style.removeProperty('transform')
    target.style.removeProperty('visibility')
  }
}

function pointFromRect(rect, preferredSize) {
  const rootRect = root.value.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - rootRect.left,
    y: rect.top + rect.height / 2 - rootRect.top,
    size: preferredSize || Math.max(44, Math.min(96, Math.min(rect.width, rect.height))),
  }
}

function sourcePoint() {
  const rootRect = root.value.getBoundingClientRect()
  if (props.sourceRect?.width > 0 && props.sourceRect?.height > 0) {
    const point = pointFromRect(props.sourceRect, Math.min(118, Math.max(92, rootRect.width * .27)))
    return {
      ...point,
      x: Math.min(rootRect.width - 52, Math.max(52, point.x)),
      y: Math.min(rootRect.height - 92, Math.max(92, point.y)),
    }
  }
  return { x: rootRect.width * .5, y: rootRect.height * .43, size: Math.min(112, Math.max(88, rootRect.width * .25)) }
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
  cancelAnimations()
  clearInlineState()
  emit('complete', props.voice.id)
}

function finishImmediately() {
  sequenceID += 1
  finish()
}

async function runReturn() {
  const token = ++sequenceID
  await nextTick()
  if (disposed || token !== sequenceID) return

  hubScroll = document.querySelector('.hub-scroll')
  targetAvatar = document.querySelector(`[data-discovery-source="${props.voice.id}"]`)
  targetItem = document.querySelector(`[data-discovery-item="${props.voice.id}"]`)
  if (!root.value || !backdrop.value || !traveler.value || !hubScroll || !targetAvatar || !targetItem) {
    finishImmediately()
    return
  }

  targetItem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  if (reducedMotionQuery?.matches) {
    finishImmediately()
    return
  }

  const rootRect = root.value.getBoundingClientRect()
  const start = sourcePoint()
  const lift = {
    x: rootRect.width * .5,
    y: Math.max(112, rootRect.height * .27),
    size: Math.min(88, Math.max(70, rootRect.width * .2)),
  }
  const landing = pointFromRect(targetAvatar.getBoundingClientRect())

  hubScroll.style.opacity = '.14'
  hubScroll.style.filter = 'blur(13px)'
  hubScroll.style.transform = 'scale(.985)'
  targetItem.style.opacity = '.16'
  targetItem.style.filter = 'blur(9px) saturate(.62)'
  targetItem.style.transform = 'scale(.96)'
  targetAvatar.style.opacity = '.04'
  setTraveler(start, .72, 0)

  phase.value = 'extracting'
  await Promise.all([
    waitFor(traveler.value.animate([
      { left: `${start.x}px`, top: `${start.y}px`, width: `${start.size}px`, height: `${start.size}px`, transform: 'translate(-50%, -50%) scale(.72)', opacity: 0, filter: 'blur(7px)' },
      { left: `${start.x}px`, top: `${start.y - 18}px`, width: `${start.size}px`, height: `${start.size}px`, transform: 'translate(-50%, -50%) scale(1.04)', opacity: 1, filter: 'blur(0)', offset: .34 },
      { left: `${lift.x}px`, top: `${lift.y}px`, width: `${lift.size}px`, height: `${lift.size}px`, transform: 'translate(-50%, -50%) scale(1) rotate(-3deg)', opacity: 1, filter: 'blur(0)' },
    ], { duration: 460, easing: 'cubic-bezier(.18,.76,.2,1)', fill: 'forwards' })),
    waitFor(backdrop.value.animate([{ opacity: 1 }, { opacity: .5 }], { duration: 460, easing: 'ease', fill: 'forwards' })),
    waitFor(hubScroll.animate([
      { opacity: .14, filter: 'blur(13px)', transform: 'scale(.985)' },
      { opacity: .68, filter: 'blur(6px)', transform: 'scale(.994)' },
    ], { duration: 460, easing: 'ease', fill: 'forwards' })),
  ])
  if (disposed || token !== sequenceID) return

  setTraveler(lift, 1, 1)
  phase.value = 'falling'
  const dx = landing.x - lift.x
  const dy = landing.y - lift.y
  await Promise.all([
    waitFor(traveler.value.animate([
      { transform: 'translate(-50%, -50%) scale(1) rotate(-3deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * .38}px), calc(-50% + ${dy * .38 - 54}px)) scale(1.08) rotate(3deg)`, opacity: 1, offset: .42 },
      { transform: `translate(calc(-50% + ${dx * .82}px), calc(-50% + ${dy * .82 - 18}px)) scale(.96) rotate(-1deg)`, opacity: 1, offset: .8 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${landing.size / lift.size}) rotate(0)`, opacity: 1 },
    ], { duration: 620, easing: 'cubic-bezier(.2,.82,.22,1)', fill: 'forwards' })),
    waitFor(backdrop.value.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 560, easing: 'ease-out', fill: 'forwards' })),
    waitFor(hubScroll.animate([
      { opacity: .68, filter: 'blur(6px)', transform: 'scale(.994)' },
      { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
    ], { duration: 560, easing: 'ease-out', fill: 'forwards' })),
  ])
  if (disposed || token !== sequenceID) return

  phase.value = 'revealing-target'
  await Promise.all([
    waitFor(targetItem.animate([
      { opacity: .16, filter: 'blur(9px) saturate(.62)', transform: 'scale(.96)' },
      { opacity: 1, filter: 'blur(0) saturate(1)', transform: 'scale(1)' },
    ], { duration: 280, easing: 'cubic-bezier(.2,.8,.22,1)', fill: 'forwards' })),
    waitFor(targetAvatar.animate([{ opacity: .04 }, { opacity: 1 }], { duration: 240, easing: 'ease-out', fill: 'forwards' })),
    waitFor(traveler.value.animate([
      { transform: `translate(-50%, -50%) scale(${landing.size / lift.size})`, opacity: 1, filter: 'blur(0)' },
      { transform: `translate(-50%, -50%) scale(${landing.size / lift.size * .86})`, opacity: 0, filter: 'blur(2px)' },
    ], { duration: 240, easing: 'ease-out', fill: 'forwards' })),
  ])
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
  runReturn()
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
  clearInlineState()
})
</script>

<template>
  <section ref="root" class="voice-discovery-return-transition" :class="`is-${phase}`" aria-busy="true" aria-hidden="true">
    <div ref="backdrop" class="voice-discovery-return-backdrop" />
    <div ref="traveler" class="voice-discovery-return-traveler">
      <img :src="voice.avatarAsset" alt="">
      <span v-if="voice.flagAsset"><img :src="voice.flagAsset" alt=""></span>
    </div>
  </section>
</template>
