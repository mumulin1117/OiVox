<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  voices: { type: Array, required: true },
  titleWords: { type: Array, required: true },
  previewMode: { type: Boolean, default: false },
})

const emit = defineEmits(['ready', 'complete'])
const overlay = ref(null)
const phase = ref('idle')
const animations = new Set()
let cancelled = false
let completed = false
let reducedMotionQuery = null

const earthPoints = Object.freeze([
  { x: 34, y: 35, depth: 'front' },
  { x: 55, y: 28, depth: 'back' },
  { x: 67, y: 40, depth: 'front' },
  { x: 35, y: 49, depth: 'front' },
  { x: 59, y: 52, depth: 'back' },
  { x: 43, y: 62, depth: 'front' },
  { x: 66, y: 61, depth: 'front' },
])

const greetingByCountry = Object.freeze({
  FR: 'Bonjour',
  KR: '안녕',
  GB: 'Hi',
  TR: 'Merhaba',
  IL: 'שלום',
  EG: 'مرحباً',
  DE: 'Hallo',
})

const wordLandingOrder = Object.freeze([0, 2, 3, 1])

function tracked(animation) {
  animations.add(animation)
  animation.finished.catch(() => {}).finally(() => animations.delete(animation))
  return animation
}

function marker(duration) {
  return tracked(overlay.value.animate([{ opacity: 1 }, { opacity: 1 }], { duration })).finished.catch(() => {})
}

function targetForVoice(voice) {
  return document.querySelector(`[data-intro-user="${voice.id}"]`)
}

function arcFrames(source, target, index) {
  const dx = target.left + target.width / 2 - (source.left + source.width / 2)
  const dy = target.top + target.height / 2 - (source.top + source.height / 2)
  const direction = dx >= 0 ? 1 : -1
  return [
    { transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
    { transform: `translate(-50%, -50%) translate(${dx * .2}px, ${dy * .08 - 48}px) rotate(${direction * 7}deg) scale(1.03)`, opacity: 1, offset: .25 },
    { transform: `translate(-50%, -50%) translate(${dx * .72}px, ${dy * .58 - 30}px) rotate(${direction * -4}deg) scale(.9)`, opacity: 1, offset: .72 },
    { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(0deg) scale(${index < 3 ? .72 : .78})`, opacity: 0 },
  ]
}

function revealTarget(target, delay) {
  if (!target) return
  tracked(target.animate([
    { opacity: 0, filter: 'blur(3px) saturate(.76)' },
    { opacity: .48, filter: 'blur(.6px) saturate(.92)', offset: .34 },
    { opacity: 1, filter: 'blur(0) saturate(1.08)', offset: .72 },
    { opacity: 1, filter: 'none' },
  ], {
    delay,
    duration: 390,
    easing: 'cubic-bezier(.18,.86,.22,1.16)',
    fill: 'forwards',
  }))
}

function animateShell() {
  const shell = [
    document.querySelector('.hub-header'),
    document.querySelector('.hub-intro p'),
    document.querySelector('.hub-section-heading'),
  ].filter(Boolean)
  const delays = [4100, 4460, 5020]
  shell.forEach((element, index) => {
    tracked(element.animate([
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      delay: delays[index],
      duration: 420,
      easing: 'cubic-bezier(.2,.78,.22,1)',
      fill: 'forwards',
    }))
  })
}

function animateTitleWords() {
  const root = overlay.value
  const flyingWords = [...root.querySelectorAll('[data-intro-title-word]')]
  const homeWords = [...document.querySelectorAll('[data-hub-title-word]')]
  const targets = new Map(homeWords.map((element) => [element.dataset.hubTitleWord, element.getBoundingClientRect()]))

  flyingWords.forEach((word, index) => {
    const wobble = index % 2 === 0 ? -1 : 1
    tracked(word.animate([
      { opacity: 0, transform: 'translateY(14px) scale(.76)', filter: 'blur(2px)' },
      { opacity: 1, transform: `translateY(${-8 * wobble}px) rotate(${3 * wobble}deg) scale(1.07)`, filter: 'blur(0)', offset: .2 },
      { opacity: 1, transform: `translateY(${6 * wobble}px) rotate(${-2 * wobble}deg) scale(.98)`, filter: 'blur(0)', offset: .4 },
      { opacity: 1, transform: `translateY(${-7 * wobble}px) rotate(${2 * wobble}deg) scale(1.04)`, filter: 'blur(0)', offset: .6 },
      { opacity: 1, transform: `translateY(${4 * wobble}px) rotate(${-1.2 * wobble}deg) scale(1)`, filter: 'blur(0)', offset: .8 },
      { opacity: 1, transform: 'translateY(0) rotate(0) scale(1)', filter: 'blur(0)' },
    ], {
      delay: 760 + index * 80,
      duration: 2020,
      easing: 'cubic-bezier(.2,.72,.22,1)',
      fill: 'forwards',
    }))

    const source = word.getBoundingClientRect()
    const target = targets.get(String(index))
    if (!target) return
    const dx = target.left + target.width / 2 - (source.left + source.width / 2)
    const dy = target.top + target.height / 2 - (source.top + source.height / 2)
    const stagger = wordLandingOrder[index] ?? index
    const flightDelay = 3000 + stagger * 90
    const finalTransform = `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`

    tracked(word.animate([
      { opacity: 1, transform: 'translate(0, 0) rotate(0deg) scale(1)', filter: 'blur(0)' },
      { opacity: 1, transform: `translate(${dx * .22}px, ${dy * .08 - 34}px) rotate(${7 * wobble}deg) scale(1.04)`, filter: 'blur(0)', offset: .28 },
      { opacity: 1, transform: `translate(${dx * .7}px, ${dy * .56 - 24}px) rotate(${-4 * wobble}deg) scale(.9)`, filter: 'blur(0)', offset: .7 },
      { opacity: 1, transform: finalTransform, filter: 'blur(0)' },
    ], {
      delay: flightDelay,
      duration: 1750,
      easing: 'cubic-bezier(.28,.72,.24,1)',
      fill: 'forwards',
    }))

    tracked(word.animate([
      { opacity: 1, transform: finalTransform },
      { opacity: 0, transform: finalTransform },
    ], { delay: 6500, duration: 90, easing: 'linear', fill: 'forwards' }))

    const destination = homeWords[index]
    tracked(destination.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], { delay: 6500, duration: 90, easing: 'linear', fill: 'forwards' }))
  })
}

function animatePeople() {
  const pins = [...overlay.value.querySelectorAll('[data-intro-person]')]
  pins.forEach((pin, index) => {
    const bubble = pin.querySelector('.hub-earth-greeting')
    const target = targetForVoice(props.voices[index])
    tracked(pin.animate([
      { opacity: 0, transform: 'translate(-50%, -50%) scale(.12)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1.13)', offset: .64 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
    ], {
      delay: 630 + index * 145,
      duration: 720,
      easing: 'cubic-bezier(.18,.9,.25,1.22)',
      fill: 'forwards',
    }))
    tracked(bubble.animate([
      { opacity: 0, transform: 'translateY(6px) scale(.8)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: .28 },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: .72 },
      { opacity: 0, transform: 'translateY(-5px) scale(.92)' },
    ], {
      delay: 1320 + index * 115,
      duration: 1350,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards',
    }))
    if (!target) return
    const flightDelay = 2980 + index * 95
    const landingTime = flightDelay + 2150
    tracked(pin.animate(arcFrames(pin.getBoundingClientRect(), target.getBoundingClientRect(), index), {
      delay: flightDelay,
      duration: 2150,
      easing: 'cubic-bezier(.28,.7,.24,1)',
      fill: 'forwards',
    }))
    revealTarget(target, landingTime)
  })
}

function animateGlobe() {
  const root = overlay.value
  const wrap = root.querySelector('.hub-earth-wrap')
  const earth = root.querySelector('.hub-earth-sphere')
  const surface = root.querySelector('.hub-earth-surface')
  const backdrop = root.querySelector('.hub-earth-backdrop')
  const brand = root.querySelector('.hub-earth-brand')

  tracked(earth.animate([
    { transform: 'rotateX(-4deg) rotateY(-18deg) scale(.76)', filter: 'saturate(.72)', opacity: .25 },
    { transform: 'rotateX(-2deg) rotateY(0deg) scale(1)', filter: 'saturate(1)', opacity: 1, offset: .28 },
    { transform: 'rotateX(2deg) rotateY(14deg) scale(1.02)', filter: 'saturate(1.06)', opacity: 1, offset: .72 },
    { transform: 'rotateX(5deg) rotateY(28deg) scale(.76)', filter: 'saturate(.8)', opacity: 0 },
  ], { duration: 5100, easing: 'cubic-bezier(.2,.72,.22,1)', fill: 'forwards' }))
  tracked(surface.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-18%)', offset: .42 },
    { transform: 'translateX(-48%)' },
  ], { duration: 5100, easing: 'linear', fill: 'forwards' }))
  tracked(wrap.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) rotateX(-7deg) rotateZ(-2deg) scale(.78)' },
    { opacity: 1, transform: 'translate(-50%,-50%) rotateX(-7deg) rotateZ(-2deg) scale(1)', offset: .18 },
    { opacity: 1, transform: 'translate(-50%,-50%) rotateX(-7deg) rotateZ(1deg) scale(1)', offset: .76 },
    { opacity: 0, transform: 'translate(-50%,-58%) rotateX(-7deg) rotateZ(3deg) scale(.72)' },
  ], { duration: 5200, easing: 'cubic-bezier(.2,.75,.24,1)', fill: 'forwards' }))
  tracked(backdrop.animate([
    { opacity: 1 },
    { opacity: .58, offset: .42 },
    { opacity: 0 },
  ], { delay: 3880, duration: 1080, easing: 'cubic-bezier(.24,.72,.25,1)', fill: 'forwards' }))
  tracked(brand.animate([
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(-7px)' },
  ], { delay: 3740, duration: 520, easing: 'ease-out', fill: 'forwards' }))
}

function cancelAnimations() {
  cancelled = true
  animations.forEach((animation) => animation.cancel())
  animations.clear()
}

function finish() {
  if (completed) return
  completed = true
  cancelAnimations()
  phase.value = 'complete'
  emit('complete')
}

async function play() {
  if (!overlay.value || cancelled) return
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (reducedMotionQuery.matches) {
    finish()
    return
  }
  await nextTick()
  if (cancelled || !overlay.value) return
  document.querySelector('.hub-scroll')?.scrollTo({ top: 0, behavior: 'auto' })
  phase.value = 'entering'
  animateGlobe()
  animateShell()
  animateTitleWords()
  animatePeople()
  await marker(2950)
  if (cancelled) return
  phase.value = 'flying'
  await marker(2700)
  if (cancelled) return
  phase.value = 'landing'
  await marker(1150)
  if (!cancelled) finish()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden' && !props.previewMode) finish()
}

function handleMotionPreference(event) {
  if (event.matches) finish()
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (query.addEventListener) query.addEventListener('change', handleMotionPreference)
  else query.addListener(handleMotionPreference)
  reducedMotionQuery = query
  emit('ready')
  play()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (reducedMotionQuery?.removeEventListener) reducedMotionQuery.removeEventListener('change', handleMotionPreference)
  else reducedMotionQuery?.removeListener(handleMotionPreference)
  cancelAnimations()
})
</script>

<template>
  <div ref="overlay" class="hub-earth-intro" :data-phase="phase" aria-hidden="true">
    <div class="hub-earth-backdrop" />
    <strong class="hub-earth-brand">OiVox</strong>

    <div class="hub-earth-title">
      <span
        v-for="(word, index) in titleWords"
        :key="`${word}-${index}`"
        :data-intro-title-word="index"
      >{{ word }}</span>
    </div>

    <div class="hub-earth-wrap">
      <span class="hub-earth-orbit hub-earth-orbit-one" />
      <span class="hub-earth-orbit hub-earth-orbit-two" />
      <div class="hub-earth-sphere">
        <div class="hub-earth-surface">
          <span v-for="index in 6" :key="index" :class="`hub-earth-land hub-earth-land-${index}`" />
        </div>
        <span class="hub-earth-latitude hub-earth-latitude-one" />
        <span class="hub-earth-latitude hub-earth-latitude-two" />
        <span class="hub-earth-latitude hub-earth-latitude-three" />
        <span class="hub-earth-longitude hub-earth-longitude-one" />
        <span class="hub-earth-longitude hub-earth-longitude-two" />
        <span class="hub-earth-terminator" />
        <span class="hub-earth-glow" />
      </div>
      <span class="hub-earth-atmosphere" />
    </div>

    <div
      v-for="(voice, index) in voices"
      :key="voice.id"
      class="hub-earth-person"
      :class="{ 'is-back': earthPoints[index]?.depth === 'back' }"
      :style="{ '--earth-person-x': `${earthPoints[index]?.x || 50}%`, '--earth-person-y': `${earthPoints[index]?.y || 50}%` }"
      :data-intro-person="voice.id"
    >
      <span class="hub-earth-greeting" :dir="['IL', 'EG'].includes(voice.countryCode) ? 'rtl' : 'ltr'">{{ greetingByCountry[voice.countryCode] || 'Hi' }}</span>
      <span class="hub-earth-portrait"><img :src="voice.avatarAsset" alt=""></span>
      <span class="hub-earth-flag"><img :src="voice.flagAsset" alt=""></span>
    </div>
  </div>
</template>
