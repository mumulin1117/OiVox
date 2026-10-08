<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import globeIcon from '../assets/icons/globe.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import { EMPTY_VOICE_PLAYBACK_STATE, formatVoiceDuration, voicePlaybackProgress, voicePlaybackRemainingMs, voicePlaybackService } from '../services/voicePlaybackService'

const props = defineProps({
  voices: { type: Array, required: true },
  copy: { type: Object, required: true },
  emptyTitle: { type: String, default: '' },
  emptySubtitle: { type: String, default: '' },
  getMoreLabel: { type: String, default: '' },
})

const emit = defineEmits(['close', 'open-profile', 'get-more'])
const root = ref(null)
const earthPage = ref(null)
const globe = ref(null)
const phase = ref('idle')
const selectedVoiceID = ref('')
const selectedRegion = ref('all')
const playbackState = ref({ ...EMPTY_VOICE_PLAYBACK_STATE })
const playbackBusy = ref(false)
const playbackError = ref(false)

const animations = new Set()
const sourceTargets = []
let hubScroll = null
let sequenceID = 0
let disposed = false
let reducedMotionQuery = null
let resizeFrame = 0

const regionDefinitions = Object.freeze([
  { id: 'all', countries: [] },
  { id: 'middleEast', countries: ['EG', 'TR', 'IL'] },
  { id: 'europe', countries: ['GB', 'FR', 'DE'] },
  { id: 'eastAsia', countries: ['JP', 'KR'] },
])
const timeZones = Object.freeze({ EG: 'UTC+2', TR: 'UTC+3', IL: 'UTC+2', GB: 'UTC+0', FR: 'UTC+1', DE: 'UTC+1', JP: 'UTC+9', KR: 'UTC+9' })
const selectedVoice = computed(() => props.voices.find((voice) => voice.id === selectedVoiceID.value) || null)
const activeRegion = computed(() => regionDefinitions.find((region) => region.id === selectedRegion.value) || regionDefinitions[0])
const visibleVoiceCount = computed(() => activeRegion.value.id === 'all'
  ? props.voices.length
  : props.voices.filter((voice) => activeRegion.value.countries.includes(voice.countryCode)).length)
const isPlaying = computed(() => playbackState.value.id === selectedVoice.value?.voiceClip?.id && playbackState.value.status === 'playing')
const isPaused = computed(() => playbackState.value.id === selectedVoice.value?.voiceClip?.id && playbackState.value.status === 'paused')
const playbackProgress = computed(() => voicePlaybackProgress(playbackState.value, selectedVoice.value?.voiceClip))
const playbackRemaining = computed(() => voicePlaybackRemainingMs(playbackState.value, selectedVoice.value?.voiceClip))
const regionOptions = computed(() => regionDefinitions.map((region, index) => ({
  ...region,
  label: props.copy.voiceEarthRegions?.[index] || ['All', 'Middle East', 'Europe', 'East Asia'][index],
})))

const earthPoints = Object.freeze([
  { x: 24, y: 39, depth: 'front' },
  { x: 40, y: 31, depth: 'back' },
  { x: 61, y: 34, depth: 'front' },
  { x: 75, y: 43, depth: 'front' },
  { x: 67, y: 55, depth: 'back' },
  { x: 47, y: 60, depth: 'front' },
  { x: 30, y: 53, depth: 'front' },
  { x: 14, y: 44, depth: 'back' },
  { x: 86, y: 44, depth: 'front' },
  { x: 17, y: 58, depth: 'front' },
  { x: 83, y: 58, depth: 'back' },
  { x: 36, y: 64, depth: 'front' },
  { x: 62, y: 64, depth: 'front' },
  { x: 14, y: 31, depth: 'back' },
  { x: 86, y: 31, depth: 'front' },
  { x: 31, y: 44, depth: 'front' },
  { x: 50, y: 36, depth: 'back' },
  { x: 69, y: 45, depth: 'front' },
  { x: 40, y: 54, depth: 'front' },
  { x: 60, y: 56, depth: 'back' },
])

function stagingPoints() {
  return props.voices.map((_, index) => {
    const target = earthPoint(index)
    const angle = (index * 137.5 - 90) * Math.PI / 180
    const radius = 3.2 + (index % 4) * 1.15
    return {
      x: Math.min(91, Math.max(9, target.x + Math.cos(angle) * radius)),
      y: Math.min(72, Math.max(27, target.y + Math.sin(angle) * radius * .72)),
    }
  })
}

function earthPoint(index) {
  return earthPoints[index] || { x: 50, y: 50, depth: 'front' }
}

const voiceEarthTransitionTiming = Object.freeze({
  enter: Object.freeze({
    source: Object.freeze({ duration: 250, stagger: 50 }),
    extract: Object.freeze({ duration: 480, stagger: 35 }),
    reveal: Object.freeze({ pageDuration: 220, globeDuration: 300 }),
    settle: Object.freeze({ duration: 330, stagger: 20 }),
  }),
  exit: Object.freeze({
    lift: Object.freeze({ duration: 300, stagger: 15 }),
    reveal: Object.freeze({ pageDuration: 190, globeDuration: 260 }),
    source: Object.freeze({ duration: 184, stagger: 30 }),
    return: Object.freeze({ duration: 304, stagger: 15 }),
  }),
})

function isReducedMotion() {
  return reducedMotionQuery?.matches === true
}

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
  sourceTargets.forEach((target) => {
    target?.getAnimations().forEach((animation) => animation.cancel())
    if (!target) return
    target.style.removeProperty('opacity')
    target.style.removeProperty('filter')
    target.style.removeProperty('transform')
  })
  if (hubScroll) {
    hubScroll.getAnimations().forEach((animation) => animation.cancel())
    hubScroll.style.removeProperty('opacity')
    hubScroll.style.removeProperty('filter')
    hubScroll.style.removeProperty('transform')
    hubScroll.style.removeProperty('visibility')
  }
}

function travelerNodes() {
  return root.value ? [...root.value.querySelectorAll('[data-voice-earth-traveler]')] : []
}

function anchorNodes() {
  return root.value ? [...root.value.querySelectorAll('[data-voice-earth-anchor]')] : []
}

function relativePoint(rect) {
  const rootRect = root.value.getBoundingClientRect()
  const edge = 29
  const safeTop = Math.max(76, rootRect.height * .1)
  const safeBottom = rootRect.height - Math.max(76, rootRect.height * .09)
  return {
    x: Math.min(rootRect.width - edge, Math.max(edge, rect.left + rect.width / 2 - rootRect.left)),
    y: Math.min(safeBottom, Math.max(safeTop, rect.top + rect.height / 2 - rootRect.top)),
  }
}

function percentagePoint(point) {
  const rect = root.value.getBoundingClientRect()
  return { x: rect.width * point.x / 100, y: rect.height * point.y / 100 }
}

function collectSourceTargets() {
  sourceTargets.length = 0
  props.voices.forEach((voice) => {
    sourceTargets.push(document.querySelector(`[data-earth-source="${voice.id}"]`))
  })
  hubScroll = document.querySelector('.hub-scroll')
}

function sourcePoints() {
  const fallback = root.value.getBoundingClientRect()
  return sourceTargets.map((target, index) => {
    if (target) return relativePoint(target.getBoundingClientRect())
    return {
      x: fallback.width * (.16 + (index % 4) * .23),
      y: fallback.height * (.24 + (Math.floor(index / 4) % 4) * .14),
    }
  })
}

function targetPoints() {
  const anchors = anchorNodes()
  return props.voices.map((_, index) => {
    const anchor = anchors[index]
    return anchor ? relativePoint(anchor.getBoundingClientRect()) : percentagePoint(earthPoint(index))
  })
}

function setTravelerPoint(node, point, scale = .86, opacity = 1) {
  node.style.left = `${point.x}px`
  node.style.top = `${point.y}px`
  node.style.transform = `translate(-50%, -50%) scale(${scale})`
  node.style.opacity = String(opacity)
}

function setEarthVisibility(visible) {
  if (!earthPage.value || !globe.value) return
  earthPage.value.style.opacity = visible ? '1' : '0'
  globe.value.style.opacity = visible ? '1' : '0'
  globe.value.style.transform = visible
    ? 'translate(-50%, -50%) rotateX(-7deg) rotateZ(-2deg) scale(1)'
    : 'translate(-50%, -50%) rotateX(-10deg) rotateZ(-4deg) scale(.68)'
}

async function animateTravelers(from, to, options, token) {
  const nodes = travelerNodes()
  const duration = options.duration
  const stagger = options.stagger
  const finished = nodes.map((node, index) => {
    node.classList.remove('is-floating')
    node.classList.toggle('is-staged', options.staged === true)
    setTravelerPoint(node, from[index], options.scaleFrom, options.reveal ? 0 : 1)
    const dx = to[index].x - from[index].x
    const dy = to[index].y - from[index].y
    const arc = -options.arcHeight * (.74 + (index % 3) * .14)
    return waitFor(node.animate([
      {
        transform: `translate(-50%, -50%) scale(${options.scaleFrom})`,
        opacity: options.reveal ? 0 : 1,
        filter: options.reveal ? 'blur(5px)' : 'blur(0)',
      },
      {
        transform: `translate(calc(-50% + ${dx * .2}px), calc(-50% + ${dy * .2 + arc * .58}px)) scale(${Math.max(options.scaleFrom, options.scaleTo) + .18})`,
        opacity: 1,
        filter: 'blur(0)',
        offset: .32,
      },
      {
        transform: `translate(calc(-50% + ${dx * .72}px), calc(-50% + ${dy * .72 + arc * .24}px)) scale(${options.scaleTo + .07})`,
        opacity: 1,
        filter: 'blur(0)',
        offset: .74,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${options.scaleTo})`,
        opacity: options.hide ? 0 : 1,
        filter: options.hide ? 'blur(3px)' : 'blur(0)',
      },
    ], {
      delay: index * stagger,
      duration,
      easing: 'cubic-bezier(.18,.74,.2,1)',
      fill: 'forwards',
    }))
  })

  await Promise.all(finished)
  if (disposed || token !== sequenceID) return false
  nodes.forEach((node, index) => {
    node.getAnimations().forEach((animation) => animation.cancel())
    setTravelerPoint(node, to[index], options.scaleTo, options.hide ? 0 : 1)
    node.classList.toggle('is-staged', options.staged === true)
    if (options.float) node.classList.add('is-floating')
  })
  return true
}

function animateSources(hidden, timing) {
  sourceTargets.forEach((target, index) => {
    if (!target) return
    tracked(target.animate(hidden ? [
      { opacity: 1, filter: 'blur(0) saturate(1)', transform: 'scale(1)' },
      { opacity: .06, filter: 'blur(3px) saturate(.55)', transform: 'scale(.88)' },
    ] : [
      { opacity: .06, filter: 'blur(3px) saturate(.55)', transform: 'scale(.88)' },
      { opacity: 1, filter: 'blur(0) saturate(1)', transform: 'scale(1)' },
    ], {
      delay: index * timing.stagger,
      duration: timing.duration,
      easing: 'cubic-bezier(.2,.78,.22,1)',
      fill: 'forwards',
    }))
  })
}

async function revealEarth(visible, token) {
  const timing = visible ? voiceEarthTransitionTiming.enter.reveal : voiceEarthTransitionTiming.exit.reveal
  const hubFrames = visible ? [
    { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
    { opacity: 0, filter: 'blur(9px)', transform: 'scale(.99)' },
  ] : [
    { opacity: 0, filter: 'blur(9px)', transform: 'scale(.99)' },
    { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
  ]
  const pageFrames = visible ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }]
  const globeFrames = visible ? [
    { opacity: 0, transform: 'translate(-50%, -50%) rotateX(-10deg) rotateZ(-4deg) scale(.68)' },
    { opacity: 1, transform: 'translate(-50%, -50%) rotateX(-7deg) rotateZ(-2deg) scale(1)' },
  ] : [
    { opacity: 1, transform: 'translate(-50%, -50%) rotateX(-7deg) rotateZ(-2deg) scale(1)' },
    { opacity: 0, transform: 'translate(-50%, -50%) rotateX(-10deg) rotateZ(-4deg) scale(.68)' },
  ]

  const jobs = [
    waitFor(earthPage.value.animate(pageFrames, { duration: timing.pageDuration, easing: 'ease', fill: 'forwards' })),
    waitFor(globe.value.animate(globeFrames, { duration: timing.globeDuration, easing: 'cubic-bezier(.18,.74,.2,1)', fill: 'forwards' })),
  ]
  if (hubScroll) jobs.push(waitFor(hubScroll.animate(hubFrames, { duration: timing.pageDuration, easing: 'ease', fill: 'forwards' })))
  await Promise.all(jobs)
  if (disposed || token !== sequenceID) return false
  setEarthVisibility(visible)
  return true
}

function showEarthImmediately() {
  sequenceID += 1
  cancelAnimations()
  collectSourceTargets()
  setEarthVisibility(true)
  if (hubScroll) {
    hubScroll.style.opacity = '0'
    hubScroll.style.visibility = 'hidden'
  }
  const targets = targetPoints()
  travelerNodes().forEach((node, index) => setTravelerPoint(node, targets[index], .86, 1))
  phase.value = 'earth'
}

async function enterEarth() {
  const token = ++sequenceID
  await nextTick()
  if (disposed || token !== sequenceID) return
  collectSourceTargets()
  const sources = sourcePoints()
  const staged = stagingPoints().map(percentagePoint)
  const targets = targetPoints()

  if (isReducedMotion()) {
    showEarthImmediately()
    return
  }

  phase.value = 'extracting'
  animateSources(true, voiceEarthTransitionTiming.enter.source)
  if (!await animateTravelers(sources, staged, {
    duration: voiceEarthTransitionTiming.enter.extract.duration,
    stagger: voiceEarthTransitionTiming.enter.extract.stagger,
    reveal: true,
    scaleFrom: .46,
    scaleTo: .94,
    arcHeight: 58,
    staged: true,
  }, token)) return

  phase.value = 'revealing-earth'
  if (!await revealEarth(true, token)) return

  phase.value = 'settling'
  if (!await animateTravelers(staged, targets, {
    duration: voiceEarthTransitionTiming.enter.settle.duration,
    stagger: voiceEarthTransitionTiming.enter.settle.stagger,
    scaleFrom: .94,
    scaleTo: .86,
    arcHeight: 24,
    float: true,
  }, token)) return

  phase.value = 'earth'
}

async function closeEarth() {
  if (phase.value !== 'earth') return
  stopVoicePlayback()
  if (isReducedMotion()) {
    clearInlineState()
    emit('close')
    return
  }

  const token = ++sequenceID
  const targets = targetPoints()
  const staged = stagingPoints().map(percentagePoint)
  const sources = sourcePoints()

  phase.value = 'lifting'
  if (!await animateTravelers(targets, staged, {
    duration: voiceEarthTransitionTiming.exit.lift.duration,
    stagger: voiceEarthTransitionTiming.exit.lift.stagger,
    scaleFrom: .86,
    scaleTo: .94,
    arcHeight: 22,
    staged: true,
  }, token)) return

  phase.value = 'revealing-hub'
  if (!await revealEarth(false, token)) return

  phase.value = 'returning'
  animateSources(false, voiceEarthTransitionTiming.exit.source)
  if (!await animateTravelers(staged, sources, {
    duration: voiceEarthTransitionTiming.exit.return.duration,
    stagger: voiceEarthTransitionTiming.exit.return.stagger,
    scaleFrom: .94,
    scaleTo: .48,
    arcHeight: 42,
    hide: true,
  }, token)) return

  clearInlineState()
  phase.value = 'complete'
  emit('close')
}

function isVoiceInActiveRegion(voice) {
  return activeRegion.value.id === 'all' || activeRegion.value.countries.includes(voice.countryCode)
}

function stopVoicePlayback() {
  voicePlaybackService.stop()
  playbackState.value = { ...EMPTY_VOICE_PLAYBACK_STATE }
  playbackBusy.value = false
}

function selectVoice(voiceID) {
  if (phase.value !== 'earth') return
  const voice = props.voices.find((item) => item.id === voiceID)
  if (!voice || !isVoiceInActiveRegion(voice)) return
  if (selectedVoiceID.value !== voiceID) stopVoicePlayback()
  selectedVoiceID.value = voiceID
  playbackError.value = false
}

function selectRegion(regionID) {
  if (phase.value !== 'earth' || selectedRegion.value === regionID) return
  selectedRegion.value = regionID
  if (selectedVoice.value && !isVoiceInActiveRegion(selectedVoice.value)) {
    stopVoicePlayback()
    selectedVoiceID.value = ''
  }
}

async function toggleSelectedVoice(event) {
  event?.stopPropagation()
  const voice = selectedVoice.value
  if (!voice?.voiceClip || phase.value !== 'earth' || playbackBusy.value) return
  playbackBusy.value = true
  playbackError.value = false
  try {
    await voicePlaybackService.play(voice.voiceClip, (state) => {
      if (selectedVoiceID.value !== voice.id) return
      playbackState.value = { ...playbackState.value, ...state, durationMs: state.durationMs || voice.voiceClip.durationMs }
    })
  } catch {
    playbackError.value = true
  } finally {
    playbackBusy.value = false
  }
}

function openSelectedProfile() {
  if (phase.value !== 'earth' || !selectedVoice.value) return
  const voiceID = selectedVoice.value.id
  stopVoicePlayback()
  emit('open-profile', voiceID)
}

function handleVisibilityChange() {
  if (document.visibilityState !== 'hidden') return
  stopVoicePlayback()
  if (!['earth', 'complete'].includes(phase.value)) showEarthImmediately()
}

function handleMotionPreference(event) {
  if (event.matches && !['earth', 'complete'].includes(phase.value)) showEarthImmediately()
}

function handleViewportResize() {
  window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    if (disposed || phase.value === 'complete') return
    if (phase.value !== 'earth') {
      showEarthImmediately()
      return
    }
    const targets = targetPoints()
    travelerNodes().forEach((node, index) => setTravelerPoint(node, targets[index], .86, 1))
  })
}

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('resize', handleViewportResize)
  window.visualViewport?.addEventListener('resize', handleViewportResize)
  if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', handleMotionPreference)
  else reducedMotionQuery.addListener(handleMotionPreference)
  enterEarth()
})

onBeforeUnmount(() => {
  disposed = true
  sequenceID += 1
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', handleViewportResize)
  window.visualViewport?.removeEventListener('resize', handleViewportResize)
  window.cancelAnimationFrame(resizeFrame)
  if (reducedMotionQuery?.removeEventListener) reducedMotionQuery.removeEventListener('change', handleMotionPreference)
  else reducedMotionQuery?.removeListener(handleMotionPreference)
  cancelAnimations()
  clearInlineState()
  stopVoicePlayback()
})
</script>

<template>
  <section ref="root" class="voice-earth-transition" :class="[`is-${phase}`, { 'is-crowded': voices.length > 7, 'is-dense': voices.length > 12 }]" :aria-busy="phase !== 'earth' ? 'true' : undefined">
    <div ref="earthPage" class="voice-earth-unlocked-screen">
      <div class="voice-earth-unlocked-atmosphere voice-earth-unlocked-atmosphere-one" aria-hidden="true" />
      <div class="voice-earth-unlocked-atmosphere voice-earth-unlocked-atmosphere-two" aria-hidden="true" />

      <header class="voice-earth-unlocked-nav">
        <button type="button" :aria-label="copy.voiceEarthBack" :disabled="phase !== 'earth'" @click="closeEarth">
          <img :src="arrowLeftIcon" alt="">
        </button>
        <span class="voice-earth-live-count"><img :src="globeIcon" alt=""><b>{{ visibleVoiceCount }}</b> {{ copy.voiceEarthLive }}</span>
      </header>

      <div class="voice-earth-unlocked-copy">
        <h1>{{ copy.voiceEarthTitle }}</h1>
        <p>{{ copy.voiceEarthHint }}</p>
        <div class="voice-earth-region-list" role="group" :aria-label="copy.voiceEarthRegionsLabel">
          <button
            v-for="region in regionOptions"
            :key="region.id"
            type="button"
            :class="{ active: selectedRegion === region.id }"
            :aria-pressed="selectedRegion === region.id"
            :disabled="phase !== 'earth'"
            @click="selectRegion(region.id)"
          >{{ region.label }}</button>
        </div>
      </div>

      <div ref="globe" class="voice-earth-unlocked-globe" aria-hidden="true">
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

      <span
        v-for="(voice, index) in voices"
        :key="`anchor-${voice.id}`"
        class="voice-earth-anchor"
        :style="{ '--voice-earth-x': `${earthPoint(index).x}%`, '--voice-earth-y': `${earthPoint(index).y}%` }"
        :data-voice-earth-anchor="voice.id"
        aria-hidden="true"
      />

      <div
        v-if="selectedVoice"
        class="voice-earth-preview"
        :class="{ active: isPlaying || isPaused, playing: isPlaying, paused: isPaused }"
      >
        <button
          class="voice-earth-preview-profile"
          type="button"
          :aria-label="`${selectedVoice.displayName}, ${copy.openProfile}`"
          :disabled="phase !== 'earth'"
          @click="openSelectedProfile"
        >
          <img class="voice-earth-preview-avatar" :src="selectedVoice.avatarAsset" alt="">
          <span class="voice-earth-preview-identity">
            <strong>{{ selectedVoice.displayName }}</strong>
            <span><img :src="selectedVoice.flagAsset" alt="">{{ selectedVoice.countryLabel || selectedVoice.countryCode }} · {{ timeZones[selectedVoice.countryCode] }}</span>
          </span>
        </button>
        <button
          class="voice-earth-preview-audio"
          type="button"
          :aria-label="isPlaying ? copy.pause : copy.play"
          :aria-busy="playbackBusy"
          :disabled="playbackBusy || phase !== 'earth'"
          @click="toggleSelectedVoice"
        >
          <span
            class="voice-earth-preview-wave audio-progress-wave"
            :style="{ '--voice-progress': playbackProgress }"
            aria-hidden="true"
          ><i v-for="bar in 18" :key="bar" /></span>
          <b>{{ formatVoiceDuration(playbackRemaining) }}</b>
        </button>
        <button
          class="voice-earth-preview-play"
          type="button"
          :aria-label="isPlaying ? copy.pause : copy.play"
          :disabled="playbackBusy || phase !== 'earth'"
          @click="toggleSelectedVoice"
        ><img :src="isPlaying ? pauseIcon : playIcon" alt=""></button>
        <small v-if="playbackError" class="voice-earth-preview-error" role="alert">{{ copy.voiceUnavailable }}</small>
      </div>

      <p v-else-if="voices.length" class="voice-earth-unlocked-hint">{{ copy.voiceEarthHint }}</p>
      <section v-if="phase === 'earth' && !voices.length" class="voice-earth-empty" role="status">
        <strong>{{ emptyTitle }}</strong>
        <span>{{ emptySubtitle }}</span>
        <button type="button" @click="emit('get-more')">{{ getMoreLabel }}</button>
      </section>
      <p class="voice-earth-privacy"><img :src="globeIcon" alt=""><span>{{ copy.voiceEarthPrivacy }}</span></p>
    </div>

    <button
      v-for="(voice, index) in voices"
      :key="voice.id"
      class="voice-earth-traveler"
      :class="{
        'is-back': earthPoint(index).depth === 'back',
        'is-selected': selectedVoiceID === voice.id,
        'is-region-muted': !isVoiceInActiveRegion(voice),
      }"
      type="button"
      :disabled="phase !== 'earth' || !isVoiceInActiveRegion(voice)"
      :aria-label="`${voice.displayName}, ${voice.countryLabel || voice.countryCode}`"
      :aria-pressed="selectedVoiceID === voice.id"
      :data-voice-earth-traveler="voice.id"
      @click="selectVoice(voice.id)"
    >
      <span class="voice-earth-traveler-portrait"><img :src="voice.avatarAsset" alt=""></span>
      <span class="voice-earth-traveler-flag"><img :src="voice.flagAsset" alt=""></span>
      <span v-if="index % 3 !== 2" class="voice-earth-traveler-online" aria-hidden="true" />
    </button>
  </section>
</template>
