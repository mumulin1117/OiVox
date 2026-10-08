<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  avatar: { type: String, required: true },
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
  for (const target of [hubScroll, targetAvatar]) {
    target?.getAnimations().forEach((animation) => animation.cancel())
    if (!target) continue
    target.style.removeProperty('clip-path')
    target.style.removeProperty('opacity')
    target.style.removeProperty('filter')
    target.style.removeProperty('transform')
    target.style.removeProperty('visibility')
  }
}

function pointFromRect(rect, containerRect, preferredSize) {
  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
    size: preferredSize || Math.max(40, Math.min(76, Math.min(rect.width, rect.height))),
  }
}

function sourcePoint(rootRect) {
  if (props.sourceRect?.width > 0 && props.sourceRect?.height > 0) {
    const point = pointFromRect(props.sourceRect, rootRect, Math.min(104, Math.max(84, rootRect.width * .25)))
    return {
      ...point,
      x: Math.min(rootRect.width - 48, Math.max(48, point.x)),
      y: Math.min(rootRect.height - 78, Math.max(78, point.y)),
    }
  }
  return { x: rootRect.width * .38, y: rootRect.height * .31, size: Math.min(104, Math.max(84, rootRect.width * .25)) }
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
  emit('complete')
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
  targetAvatar = document.querySelector('[data-profile-center-source]')
  if (!root.value || !backdrop.value || !traveler.value || !hubScroll || !targetAvatar || reducedMotionQuery?.matches) {
    finishImmediately()
    return
  }

  const rootRect = root.value.getBoundingClientRect()
  const hubRect = hubScroll.getBoundingClientRect()
  const targetRect = targetAvatar.getBoundingClientRect()
  const start = sourcePoint(rootRect)
  const landing = pointFromRect(targetRect, rootRect)
  const revealOrigin = pointFromRect(targetRect, hubRect)
  const revealRadius = Math.hypot(
    Math.max(revealOrigin.x, hubRect.width - revealOrigin.x),
    Math.max(revealOrigin.y, hubRect.height - revealOrigin.y),
  )

  hubScroll.style.clipPath = `circle(0px at ${revealOrigin.x}px ${revealOrigin.y}px)`
  hubScroll.style.opacity = '.35'
  hubScroll.style.filter = 'blur(8px)'
  hubScroll.style.transform = 'scale(.985)'
  targetAvatar.style.opacity = '0'
  setTraveler(start, .92, 1)

  phase.value = 'returning-avatar'
  const control = {
    x: start.x + (landing.x - start.x) * .56,
    y: Math.min(start.y, landing.y) - 34,
    size: Math.max(landing.size, start.size * .72),
  }
  await waitFor(traveler.value.animate([
    { left: `${start.x}px`, top: `${start.y}px`, width: `${start.size}px`, height: `${start.size}px`, transform: 'translate(-50%, -50%) scale(.92)', opacity: 1, filter: 'blur(0)' },
    { left: `${control.x}px`, top: `${control.y}px`, width: `${control.size}px`, height: `${control.size}px`, transform: 'translate(-50%, -50%) scale(1.05) rotate(3deg)', opacity: 1, filter: 'blur(0)', offset: .52 },
    { left: `${landing.x}px`, top: `${landing.y}px`, width: `${landing.size}px`, height: `${landing.size}px`, transform: 'translate(-50%, -50%) scale(1) rotate(0)', opacity: 1, filter: 'blur(0)' },
  ], { duration: 320, easing: 'cubic-bezier(.2,.78,.22,1)', fill: 'forwards' }))
  if (disposed || token !== sequenceID) return

  setTraveler(landing, 1, 1)
  phase.value = 'revealing-hub'
  await Promise.all([
    waitFor(hubScroll.animate([
      { clipPath: `circle(0px at ${revealOrigin.x}px ${revealOrigin.y}px)`, opacity: .35, filter: 'blur(8px)', transform: 'scale(.985)' },
      { clipPath: `circle(${revealRadius}px at ${revealOrigin.x}px ${revealOrigin.y}px)`, opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
    ], { duration: 240, easing: 'cubic-bezier(.18,.78,.22,1)', fill: 'forwards' })),
    waitFor(backdrop.value.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' })),
    waitFor(targetAvatar.animate([{ opacity: 0 }, { opacity: 1 }], { delay: 70, duration: 150, easing: 'ease-out', fill: 'forwards' })),
    waitFor(traveler.value.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, filter: 'blur(0)' },
      { transform: 'translate(-50%, -50%) scale(.82)', opacity: 0, filter: 'blur(2px)' },
    ], { duration: 150, easing: 'ease-out', fill: 'forwards' })),
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
  <section ref="root" class="user-profile-return-transition" :class="`is-${phase}`" aria-busy="true" aria-hidden="true">
    <div ref="backdrop" class="user-profile-return-backdrop" />
    <div ref="traveler" class="user-profile-return-traveler"><img :src="avatar" alt=""></div>
  </section>
</template>
