<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import coinIcon from '../assets/coin.png'
import chevronRightIcon from '../assets/icons/hub-chevron-right.svg'
import chatIcon from '../assets/icons/hub-chat.svg'
import pauseIcon from '../assets/icons/hub-pause.svg'
import playIcon from '../assets/icons/hub-play.svg'
import { discoveryPeople, firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'
import { OIVOX_TEST_USER_ID } from '../data/oivoxTestFixtures'
import { postRegistrationContent } from '../data/postRegistrationContent'
import { socialContent } from '../data/socialContent'
import { useI18n } from '../i18n'
import { resolveAccountAvatar, resolveAccountCoinBalance } from '../services/accountPresentation'
import { createSocialStore } from '../services/socialStore'
import { voicePlaybackService } from '../services/voicePlaybackService'
import SocialModule from './SocialModule.vue'
import MainHubIntro from './MainHubIntro.vue'
import VoiceDiscoveryScreen from './VoiceDiscoveryScreen.vue'

const props = defineProps({ user: { type: Object, default: null } })
const emit = defineEmits(['open-language', 'logout', 'profile-updated'])
const { locale } = useI18n()
const copy = computed(() => postRegistrationContent(locale.value))
const socialCopy = computed(() => socialContent(locale.value))

const activeSocial = ref('')
const selectedUserID = ref('')
const discoveryUserID = ref('')
const audioState = ref({ id: null, status: 'idle', currentTimeMs: 0, durationMs: 0 })
const audioError = ref(false)
const audioBusy = ref(false)

const dailyVoices = Object.freeze(firstDayFreeDiscoveryIDs.map((id) => discoveryPeople[id]))
const heroPrimaryVoice = Object.freeze(dailyVoices[0])
const heroSecondaryVoice = Object.freeze(dailyVoices[1])
const featuredVoice = Object.freeze(dailyVoices[2])
const newVoices = Object.freeze(dailyVoices.slice(3))
const selectedDailyVoiceID = ref(newVoices[0].id)
const accountID = props.user?.id || props.user?.userID || OIVOX_TEST_USER_ID
const introStorageKey = `oivox.mainHubIntro.v1.${accountID}`
const introPreviewMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'hub-intro'
const titleWords = computed(() => copy.value.mainTitle.trim().split(/\s+/).filter(Boolean))
const introActive = ref(shouldPlayIntro())
const readSocialSnapshot = () => createSocialStore({ accountID }).getSnapshot()
const socialSnapshot = ref(readSocialSnapshot())
const unreadMessageCount = computed(() => socialSnapshot.value.threads.reduce((total, thread) => total + thread.unreadCount, 0))
const coinBalance = computed(() => resolveAccountCoinBalance(props.user))
const ownAvatar = computed(() => resolveAccountAvatar(props.user))
const isPlaying = computed(() => audioState.value.id === featuredVoice.voiceClip.id && audioState.value.status === 'playing')
const playerDuration = computed(() => featuredVoice.voiceClip.durationMs)
const playerProgress = computed(() => Math.min(1, Math.max(0, audioState.value.currentTimeMs / playerDuration.value)))
const playerRemaining = computed(() => Math.max(0, playerDuration.value - (audioState.value.id === featuredVoice.voiceClip.id ? audioState.value.currentTimeMs : 0)))

function shouldPlayIntro() {
  if (introPreviewMode) return true
  try {
    return window.sessionStorage.getItem(introStorageKey) !== 'complete'
  } catch {
    return true
  }
}

function completeIntro() {
  introActive.value = false
  try {
    window.sessionStorage.setItem(introStorageKey, 'complete')
  } catch {
    // A denied session store only means the animation can replay after remounting.
  }
}

function openSocial(screen, userID = '') {
  voicePlaybackService.stop()
  selectedUserID.value = userID
  activeSocial.value = screen
}

function closeSocial() {
  selectedUserID.value = ''
  activeSocial.value = ''
  socialSnapshot.value = readSocialSnapshot()
}

function openDiscovery(userID) {
  if (!userID || discoveryUserID.value) return
  voicePlaybackService.stop()
  audioState.value = { id: null, status: 'idle', currentTimeMs: 0, durationMs: 0 }
  discoveryUserID.value = userID
}

function closeDiscovery() {
  discoveryUserID.value = ''
}

function openDailyVoice(userID) {
  selectedDailyVoiceID.value = userID
  openDiscovery(userID)
}

async function toggleFeaturedVoice() {
  if (audioBusy.value) return
  audioBusy.value = true
  audioError.value = false
  try {
    await voicePlaybackService.play(featuredVoice.voiceClip, (state) => {
      audioState.value = { ...audioState.value, ...state, durationMs: state.durationMs || featuredVoice.voiceClip.durationMs }
    })
  } catch {
    audioError.value = true
  } finally {
    audioBusy.value = false
  }
}

function formatDuration(durationMs) {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function stopHiddenAudio() {
  if (document.visibilityState === 'hidden') voicePlaybackService.stop()
}

document.addEventListener('visibilitychange', stopHiddenAudio)
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', stopHiddenAudio)
  voicePlaybackService.dispose()
})
</script>

<template>
  <VoiceDiscoveryScreen v-if="discoveryUserID" :initial-user-id="discoveryUserID" @close="closeDiscovery" />

  <SocialModule
    v-else-if="activeSocial"
    :entry="activeSocial"
    :initial-user-id="selectedUserID"
    :user="props.user"
    @close="closeSocial"
    @open-language="emit('open-language')"
    @logout="emit('logout')"
    @profile-updated="emit('profile-updated', $event)"
  />

  <main v-else class="main-hub app-screen" :class="{ 'hub-intro-active': introActive }" :aria-busy="introActive ? 'true' : undefined">
    <div class="hub-atmosphere hub-atmosphere-blue" aria-hidden="true" />
    <div class="hub-atmosphere hub-atmosphere-peach" aria-hidden="true" />
    <div class="hub-atmosphere hub-atmosphere-lavender" aria-hidden="true" />

    <div class="hub-scroll" :inert="introActive" :aria-hidden="introActive ? 'true' : undefined">
      <header class="hub-header">
        <div class="hub-brand" aria-label="OiVox — Speak Around the World">
          <strong>OiVox</strong>
          <small>{{ copy.mainTagline }}</small>
        </div>

        <nav class="hub-actions" :aria-label="copy.mainTitle">
          <button class="hub-coin" type="button" :aria-label="`${socialCopy.myCoins}, ${coinBalance}`" @click="openSocial('settings')">
            <img :src="coinIcon" alt="">
            <b>{{ coinBalance }}</b>
          </button>
          <button class="hub-round-action" type="button" :aria-label="socialCopy.messages" @click="openSocial('messages')">
            <img :src="chatIcon" alt="">
            <b v-if="unreadMessageCount" class="hub-badge">{{ unreadMessageCount }}</b>
          </button>
          <button class="hub-avatar-button" type="button" :aria-label="socialCopy.profile" @click="openSocial('profile')">
            <img :src="ownAvatar" alt="">
          </button>
        </nav>
      </header>

      <section class="hub-collage" :aria-label="copy.newVoices">
        <div class="hub-intro">
          <h1 id="hub-title" :aria-label="copy.mainTitle">
            <span v-for="(word, index) in titleWords" :key="`${word}-${index}`" :data-hub-title-word="index">{{ word }}</span>
          </h1>
          <p>{{ copy.mainSubtitle }}</p>
        </div>
        <button class="hub-photo-card hub-photo-card-large" type="button" :data-intro-user="heroPrimaryVoice.id" :aria-label="`${heroPrimaryVoice.displayName}, ${copy.openProfile}`" @click="openDiscovery(heroPrimaryVoice.id)">
          <img :src="heroPrimaryVoice.avatarAsset" alt="">
          <span class="hub-hand-note hub-hand-note-large" aria-hidden="true">Hear<br>Real<br>People</span>
        </button>
        <button class="hub-photo-card hub-photo-card-small" type="button" :data-intro-user="heroSecondaryVoice.id" :aria-label="`${heroSecondaryVoice.displayName}, ${copy.openProfile}`" @click="openDiscovery(heroSecondaryVoice.id)">
          <img :src="heroSecondaryVoice.avatarAsset" alt="">
          <span class="hub-hand-note hub-hand-note-small" aria-hidden="true">Just<br>a voice</span>
        </button>
      </section>

      <article class="hub-now-playing" :class="{ playing: isPlaying }" :data-intro-user="featuredVoice.id">
          <button class="hub-player-open" type="button" :aria-label="`${featuredVoice.displayName}, ${copy.openProfile}`" @click="openDiscovery(featuredVoice.id)">
            <img class="hub-player-avatar" :src="featuredVoice.avatarAsset" alt="">
            <span class="hub-player-copy">
              <small>{{ copy.nowPlaying }}</small>
              <strong>{{ featuredVoice.displayName }}</strong>
            </span>
            <span class="hub-wave" :style="{ '--voice-progress': playerProgress }" aria-hidden="true">
              <i v-for="(height, index) in [8, 15, 22, 11, 27, 18, 10, 24, 16, 8, 20, 13, 26, 16, 9]" :key="index" :style="{ height: `${height}px` }" />
            </span>
            <time>{{ formatDuration(playerRemaining) }}</time>
          </button>
          <button class="hub-player-toggle" type="button" :aria-label="isPlaying ? copy.pause : copy.play" :aria-busy="audioBusy" :disabled="audioBusy" @click="toggleFeaturedVoice">
            <img :src="isPlaying ? pauseIcon : playIcon" alt="">
          </button>
      </article>
      <p v-if="audioError" class="hub-audio-error" role="alert">{{ copy.voiceUnavailable }}</p>

      <section class="hub-new-voices" aria-labelledby="new-voices-title">
        <div class="hub-section-heading">
          <h2 id="new-voices-title">{{ copy.newVoices }}</h2>
          <button type="button" @click="openDailyVoice(selectedDailyVoiceID)">
            {{ copy.seeAll }}
            <img :src="chevronRightIcon" alt="">
          </button>
        </div>

        <div class="hub-voice-strip">
          <button
            v-for="voice in newVoices"
            :key="voice.id"
            class="hub-voice-card"
            :class="{ selected: voice.id === selectedDailyVoiceID }"
            type="button"
            :data-intro-user="voice.id"
            :aria-label="`${voice.displayName}, ${copy.openProfile}`"
            :aria-current="voice.id === selectedDailyVoiceID ? 'true' : undefined"
            @click="openDailyVoice(voice.id)"
          >
            <img class="hub-voice-photo" :src="voice.avatarAsset" alt="">
            <span class="hub-voice-flag"><img :src="voice.flagAsset" alt=""></span>
            <strong>{{ voice.displayName }}</strong>
          </button>
        </div>
      </section>
    </div>

    <MainHubIntro v-if="introActive" :voices="dailyVoices" :title-words="titleWords" :preview-mode="introPreviewMode" @complete="completeIntro" />

  </main>
</template>
