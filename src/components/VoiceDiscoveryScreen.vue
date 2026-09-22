<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import chevronRightIcon from '../assets/icons/hub-chevron-right.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import { discoveryPeople, firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { socialContent } from '../data/socialContent'
import { toPublicSocialProfile } from '../data/socialProfile'
import { useI18n } from '../i18n'
import { voicePlaybackService } from '../services/voicePlaybackService'

const props = defineProps({ initialUserId: { type: String, required: true } })
const emit = defineEmits(['close'])
const { locale } = useI18n()
const copy = computed(() => postRegistrationContent(locale.value))
const socialCopy = computed(() => socialContent(locale.value))
const profiles = Object.freeze(firstDayFreeDiscoveryIDs.map((id) => toPublicSocialProfile(discoveryPeople[id])))
const initialIndex = Math.max(0, profiles.findIndex((profile) => profile.id === props.initialUserId))
const currentIndex = ref(initialIndex)
const audioState = ref({ id: null, status: 'idle', currentTimeMs: 0, durationMs: 0 })
const audioBusy = ref(false)
const audioError = ref(false)
const dragX = ref(0)
const dragging = ref(false)
let pointerID = null
let pointerStartX = 0
let pointerStartY = 0
let pointerIntent = 'unknown'

const currentProfile = computed(() => profiles[currentIndex.value])
const nextProfile = computed(() => profiles[(currentIndex.value + 1) % profiles.length])
const isPlaying = computed(() => audioState.value.id === currentProfile.value.voiceClip?.id && audioState.value.status === 'playing')
const clipDuration = computed(() => currentProfile.value.voiceClip?.durationMs || 0)
const clipProgress = computed(() => Math.min(1, Math.max(0, (audioState.value.currentTimeMs || 0) / Math.max(1, clipDuration.value))))
const remainingTime = computed(() => Math.max(0, clipDuration.value - (audioState.value.id === currentProfile.value.voiceClip?.id ? audioState.value.currentTimeMs : 0)))
const cardStyle = computed(() => ({ '--discovery-drag-x': `${dragX.value}px`, '--discovery-drag-rotate': `${dragX.value / 30}deg`, '--discovery-drag-progress': Math.min(1, Math.abs(dragX.value) / 120) }))

function formatDuration(durationMs) {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function stopVoice() {
  voicePlaybackService.stop()
  audioState.value = { id: null, status: 'idle', currentTimeMs: 0, durationMs: 0 }
}

function showProfile(index) {
  stopVoice()
  audioError.value = false
  currentIndex.value = (index + profiles.length) % profiles.length
  dragX.value = 0
}

async function toggleVoice() {
  const clip = currentProfile.value.voiceClip
  if (!clip || audioBusy.value) return
  audioBusy.value = true
  audioError.value = false
  try {
    await voicePlaybackService.play(clip, (state) => {
      audioState.value = { ...audioState.value, ...state, durationMs: state.durationMs || clip.durationMs }
    })
  } catch {
    audioError.value = true
  } finally {
    audioBusy.value = false
  }
}

function beginDrag(event) {
  if (event.target.closest('button')) return
  pointerID = event.pointerId
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pointerIntent = 'unknown'
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveDrag(event) {
  if (!dragging.value || event.pointerId !== pointerID) return
  const deltaX = event.clientX - pointerStartX
  const deltaY = event.clientY - pointerStartY
  if (pointerIntent === 'unknown' && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8) pointerIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.2 ? 'horizontal' : 'vertical'
  if (pointerIntent !== 'horizontal') return
  event.preventDefault()
  dragX.value = Math.max(-150, Math.min(150, deltaX))
}

function endDrag(event) {
  if (!dragging.value || event.pointerId !== pointerID) return
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  const completed = pointerIntent === 'horizontal' && Math.abs(dragX.value) >= 54
  const direction = dragX.value < 0 ? 1 : -1
  dragging.value = false
  pointerID = null
  pointerIntent = 'unknown'
  if (completed) showProfile(currentIndex.value + direction)
  else dragX.value = 0
}

function cancelDrag() {
  dragging.value = false
  pointerID = null
  pointerIntent = 'unknown'
  dragX.value = 0
}

function close() {
  stopVoice()
  emit('close')
}

function stopHiddenAudio() {
  if (document.visibilityState === 'hidden') stopVoice()
}

document.addEventListener('visibilitychange', stopHiddenAudio)
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', stopHiddenAudio)
  stopVoice()
})
</script>

<template>
  <main class="voice-discovery-screen app-screen">
    <header class="voice-discovery-nav">
      <button type="button" :aria-label="socialCopy.back" @click="close"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ copy.newVoices }}</h1>
      <span>{{ currentIndex + 1 }}/{{ profiles.length }}</span>
    </header>

    <div class="voice-discovery-scroll">
      <section class="voice-discovery-stack" :style="cardStyle">
        <article class="voice-discovery-card voice-discovery-card-next" aria-hidden="true">
          <img :src="nextProfile.avatarAsset" alt="">
        </article>

        <article
          class="voice-discovery-card voice-discovery-card-current"
          :class="{ dragging }"
          @pointerdown="beginDrag"
          @pointermove="moveDrag"
          @pointerup="endDrag"
          @pointercancel="cancelDrag"
          @lostpointercapture="cancelDrag"
        >
          <div class="voice-discovery-photo">
            <img :src="currentProfile.avatarAsset" :alt="currentProfile.displayName">
            <div class="voice-discovery-identity">
              <h2>{{ currentProfile.displayName }}</h2>
              <span v-if="currentProfile.flagAsset"><img :src="currentProfile.flagAsset" alt="">{{ currentProfile.countryCode }}</span>
            </div>
          </div>

          <button
            v-if="currentProfile.voiceClip"
            class="voice-discovery-player"
            :class="{ playing: isPlaying }"
            type="button"
            :aria-label="isPlaying ? copy.pause : copy.play"
            :aria-busy="audioBusy"
            :disabled="audioBusy"
            @click.stop="toggleVoice"
          >
            <span class="voice-discovery-play"><img :src="isPlaying ? pauseIcon : playIcon" alt=""></span>
            <span class="voice-discovery-wave" :style="{ '--voice-progress': clipProgress }" aria-hidden="true"><i v-for="(height, index) in [9, 19, 27, 15, 23, 12, 30, 17, 25, 11, 21, 14, 28, 18, 9]" :key="index" :style="{ height: `${height}px` }" /></span>
            <time>{{ formatDuration(remainingTime) }}</time>
          </button>
          <p v-if="audioError" class="voice-discovery-error" role="alert">{{ copy.voiceUnavailable }}</p>

          <div class="voice-discovery-details">
            <section v-if="currentProfile.aboutMe"><h3>{{ socialCopy.about }}</h3><p>{{ currentProfile.aboutMe }}</p></section>
            <section v-if="currentProfile.languages"><h3>{{ socialCopy.languages }}</h3><div><span v-for="language in currentProfile.languages" :key="language">{{ language.toUpperCase() }}</span></div></section>
            <section v-if="currentProfile.interests"><h3>{{ socialCopy.interests }}</h3><div><span v-for="interest in currentProfile.interests" :key="interest">{{ interest.replaceAll('_', ' ') }}</span></div></section>
          </div>
        </article>
      </section>

      <div class="voice-discovery-switcher" dir="ltr">
        <button type="button" :aria-label="profiles[(currentIndex - 1 + profiles.length) % profiles.length].displayName" @click="showProfile(currentIndex - 1)"><img :src="chevronRightIcon" alt=""></button>
        <span aria-hidden="true" />
        <button type="button" :aria-label="nextProfile.displayName" @click="showProfile(currentIndex + 1)"><img :src="chevronRightIcon" alt=""></button>
      </div>
    </div>
  </main>
</template>
