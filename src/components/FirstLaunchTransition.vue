<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { discoveryPeople, firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'
import { launchTransitionContent } from '../data/launchTransitionContent'
import { useI18n } from '../i18n'

const emit = defineEmits(['complete'])
const { locale } = useI18n()
const copy = computed(() => launchTransitionContent(locale.value))
const phase = ref('idle')
const bridgeVoices = Object.freeze(firstDayFreeDiscoveryIDs.slice(0, 2).map((userID) => discoveryPeople[userID]).filter(Boolean))
const countries = Object.freeze(['FR', 'KR', 'TR', 'IL', 'JP', 'DE', 'EG', 'GB'])
const animationDurationMs = 6200
let completionTimer = 0
let completionFrame = 0
let completed = false

function clearScheduledCompletion() {
  window.clearTimeout(completionTimer)
  window.cancelAnimationFrame(completionFrame)
  completionTimer = 0
  completionFrame = 0
}

function removeLifecycleListeners() {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('pagehide', handlePageHide)
}

function complete() {
  if (completed) return
  completed = true
  phase.value = 'complete'
  clearScheduledCompletion()
  removeLifecycleListeners()
  emit('complete')
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') complete()
}

function handlePageHide() {
  complete()
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    completionFrame = window.requestAnimationFrame(complete)
    return
  }

  phase.value = 'playing'
  completionTimer = window.setTimeout(complete, animationDurationMs)
})

onBeforeUnmount(() => {
  clearScheduledCompletion()
  removeLifecycleListeners()
  if (!completed) phase.value = 'cancelled'
})
</script>

<template>
  <section
    class="launch-transition"
    :class="`launch-transition--${phase}`"
    role="dialog"
    aria-modal="true"
    :aria-label="copy.label"
  >
    <div class="launch-atmosphere" aria-hidden="true">
      <span class="launch-orb launch-orb-lavender" />
      <span class="launch-orb launch-orb-peach" />
      <span class="launch-orb-blue" />
    </div>

    <div class="launch-brand" aria-hidden="true">
      <strong>OiVox</strong>
      <span>{{ copy.tagline }}</span>
    </div>

    <div class="launch-voice-core" aria-hidden="true">
      <span class="launch-voice-ring" />
      <span class="launch-voice-wave">
        <i v-for="bar in 7" :key="bar" />
      </span>
      <b>7</b>
    </div>

    <div class="launch-world" aria-hidden="true">
      <span class="launch-latitude launch-latitude-one" />
      <span class="launch-latitude launch-latitude-two" />
      <span class="launch-meridian launch-meridian-one" />
      <span class="launch-meridian launch-meridian-two" />
      <i v-for="(country, index) in countries" :key="country" :class="`launch-country launch-country-${index + 1}`">{{ country }}</i>
    </div>

    <div class="launch-voice-cards" aria-hidden="true">
      <article v-for="(voice, index) in bridgeVoices" :key="voice.id" :class="`launch-voice-card launch-voice-card-${index + 1}`">
        <img :src="voice.avatarAsset" alt="">
        <span class="launch-card-wave"><i v-for="bar in 7" :key="bar" /></span>
        <small>0:07</small>
      </article>
    </div>

    <button class="launch-skip" type="button" @click="complete">{{ copy.skip }}</button>
  </section>
</template>

<style scoped>
.launch-transition {
  position: fixed;
  z-index: 100;
  inset: 0;
  isolation: isolate;
  overflow: hidden;
  color: #1d1b1a;
  background: linear-gradient(165deg, #f3edfb 0%, #f6f1f8 48%, #faf0e9 100%);
  font-family: "Figtree", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
}

.launch-transition--playing { animation: launch-overlay-reveal 6.2s ease both; }
.launch-atmosphere { position: absolute; inset: 0; pointer-events: none; }
.launch-orb, .launch-orb-blue { position: absolute; display: block; border-radius: 50%; }
.launch-orb-lavender { width: 68vw; max-width: 340px; aspect-ratio: 1; inset-inline-end: -28vw; top: 16%; background: rgba(226, 216, 248, .74); }
.launch-orb-peach { width: 58vw; max-width: 290px; aspect-ratio: 1; inset-inline-start: -30vw; bottom: 12%; background: rgba(248, 222, 210, .74); }
.launch-orb-blue { width: 48vw; max-width: 240px; aspect-ratio: 1; inset-inline-start: 18%; top: 42%; background: rgba(219, 234, 250, .62); opacity: 0; }

.launch-brand {
  position: absolute;
  z-index: 10;
  left: 50%;
  top: 18%;
  display: grid;
  gap: 8px;
  transform: translate(-50%, -50%);
  text-align: center;
  white-space: nowrap;
}
.launch-brand strong { font-size: clamp(31px, 10vw, 42px); line-height: 1; font-weight: 800; letter-spacing: -.04em; }
.launch-brand span { color: #5c6384; font-size: clamp(8px, 2.6vw, 11px); line-height: 1.2; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; opacity: 0; }

.launch-voice-core {
  position: absolute;
  z-index: 6;
  left: 50%;
  top: 47%;
  width: min(34vw, 146px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 253, 249, .96);
  box-shadow: 0 20px 44px rgba(96, 91, 121, .2);
  transform: translate(-50%, -50%) scale(.25);
  opacity: 0;
}
.launch-voice-ring { position: absolute; inset: -10%; border: 2px solid rgba(195, 71, 120, .42); border-radius: 50%; }
.launch-voice-core b { position: absolute; bottom: 15%; color: #605b79; font-size: 13px; font-weight: 800; }
.launch-voice-wave, .launch-card-wave { display: flex; align-items: center; gap: 3px; }
.launch-voice-wave { transform: translateY(-10px); }
.launch-voice-wave i, .launch-card-wave i { width: 3px; display: block; border-radius: 99px; background: #a93a63; }
.launch-voice-wave i:nth-child(1), .launch-voice-wave i:nth-child(7) { height: 16px; }
.launch-voice-wave i:nth-child(2), .launch-voice-wave i:nth-child(6) { height: 27px; }
.launch-voice-wave i:nth-child(3), .launch-voice-wave i:nth-child(5) { height: 37px; }
.launch-voice-wave i:nth-child(4) { height: 47px; }

.launch-world {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 47%;
  width: min(58vw, 250px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, rgba(255,255,255,.96), rgba(226,216,248,.96));
  box-shadow: 0 22px 48px rgba(96, 91, 121, .18);
  transform: translate(-50%, -50%) scale(.35) rotate(-12deg);
  opacity: 0;
}
.launch-latitude, .launch-meridian { position: absolute; border: 1px solid rgba(96, 91, 121, .27); border-radius: 50%; }
.launch-latitude-one { inset: 22% 4%; }
.launch-latitude-two { inset: 39% 1%; }
.launch-meridian-one { inset: 3% 26%; }
.launch-meridian-two { inset: 3% 40%; }
.launch-country {
  position: absolute;
  width: clamp(29px, 9vw, 38px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fffdf9;
  box-shadow: 0 7px 16px rgba(96, 91, 121, .22);
  font-size: clamp(8px, 2.7vw, 11px);
  font-style: normal;
  font-weight: 800;
  transform: scale(0);
}
.launch-country-1 { left: 4%; top: 8%; }
.launch-country-2 { right: 2%; top: 17%; }
.launch-country-3 { left: -5%; top: 46%; }
.launch-country-4 { right: -5%; top: 50%; }
.launch-country-5 { left: 13%; bottom: 2%; }
.launch-country-6 { right: 14%; bottom: -2%; }
.launch-country-7 { left: 42%; top: -8%; }
.launch-country-8 { left: 42%; bottom: -8%; }

.launch-voice-cards { position: absolute; inset: 0; pointer-events: none; }
.launch-voice-card {
  position: absolute;
  z-index: 8;
  bottom: 17%;
  width: min(39vw, 168px);
  padding: 7px 7px 28px;
  overflow: hidden;
  border-radius: 14px;
  background: #fffdf9;
  box-shadow: 0 16px 34px rgba(96, 91, 121, .22);
  opacity: 0;
}
.launch-voice-card-1 { left: 8%; transform: translate(-70%, 20%) rotate(-16deg); }
.launch-voice-card-2 { right: 8%; transform: translate(70%, 28%) rotate(16deg); }
.launch-voice-card img { width: 100%; aspect-ratio: .92; display: block; border-radius: 9px; object-fit: cover; }
.launch-card-wave { position: absolute; left: 11px; bottom: 9px; gap: 2px; }
.launch-card-wave i { width: 2px; height: 8px; }
.launch-card-wave i:nth-child(2), .launch-card-wave i:nth-child(6) { height: 12px; }
.launch-card-wave i:nth-child(3), .launch-card-wave i:nth-child(5) { height: 16px; }
.launch-card-wave i:nth-child(4) { height: 20px; }
.launch-voice-card small { position: absolute; right: 10px; bottom: 8px; color: #6c6560; font-size: 10px; font-weight: 700; }

.launch-skip {
  position: absolute;
  z-index: 20;
  top: calc(env(safe-area-inset-top) + 12px);
  inset-inline-end: 14px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  color: #5c5870;
  background: rgba(255, 255, 255, .66);
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.launch-transition--playing .launch-brand { animation: launch-logo-journey 6.2s cubic-bezier(.22,.82,.24,1) both; }
.launch-transition--playing .launch-brand span { animation: launch-tagline 6.2s ease both; }
.launch-transition--playing .launch-voice-core { animation: launch-voice-seed 5.45s cubic-bezier(.2,.82,.24,1) both; }
.launch-transition--playing .launch-voice-ring { animation: launch-ripple 1.05s ease-out 1.3s 3; }
.launch-transition--playing .launch-voice-wave i { animation: launch-wave .54s ease-in-out 1.05s 5 alternate; }
.launch-transition--playing .launch-voice-wave i:nth-child(2), .launch-transition--playing .launch-voice-wave i:nth-child(6) { animation-delay: 1.12s; }
.launch-transition--playing .launch-voice-wave i:nth-child(3), .launch-transition--playing .launch-voice-wave i:nth-child(5) { animation-delay: 1.19s; }
.launch-transition--playing .launch-voice-wave i:nth-child(4) { animation-delay: 1.26s; }
.launch-transition--playing .launch-world { animation: launch-world-arrives 3.3s cubic-bezier(.2,.82,.24,1) 1.8s both; }
.launch-transition--playing .launch-country { animation: launch-country-pop .42s cubic-bezier(.2,1.4,.4,1) both; }
.launch-transition--playing .launch-country-1 { animation-delay: 2.32s; }
.launch-transition--playing .launch-country-2 { animation-delay: 2.46s; }
.launch-transition--playing .launch-country-3 { animation-delay: 2.60s; }
.launch-transition--playing .launch-country-4 { animation-delay: 2.74s; }
.launch-transition--playing .launch-country-5 { animation-delay: 2.88s; }
.launch-transition--playing .launch-country-6 { animation-delay: 3.02s; }
.launch-transition--playing .launch-country-7 { animation-delay: 3.16s; }
.launch-transition--playing .launch-country-8 { animation-delay: 3.30s; }
.launch-transition--playing .launch-voice-card-1 { animation: launch-card-one 2.45s cubic-bezier(.2,.82,.24,1) 3.35s both; }
.launch-transition--playing .launch-voice-card-2 { animation: launch-card-two 2.45s cubic-bezier(.2,.82,.24,1) 3.5s both; }
.launch-transition--playing .launch-orb-blue { animation: launch-orb-blue 1.3s ease 4.95s both; }
.launch-transition--playing .launch-skip { animation: launch-skip-button 5.45s ease both; }

@keyframes launch-overlay-reveal { 0%, 82% { opacity: 1; } 100% { opacity: 0; } }
@keyframes launch-logo-journey {
  0% { opacity: 0; transform: translate(-50%,-38%) scale(.82); }
  10%, 68% { opacity: 1; left: 50%; top: 18%; transform: translate(-50%,-50%) scale(1); text-align: center; }
  82%, 100% { opacity: 1; left: 22px; top: calc(env(safe-area-inset-top) + 18px); transform: scale(.64); transform-origin: top left; text-align: start; }
}
@keyframes launch-tagline { 0%, 13% { opacity: 0; } 22%, 68% { opacity: 1; } 78%, 100% { opacity: 0; } }
@keyframes launch-voice-seed { 0%, 10% { opacity: 0; transform: translate(-50%,-50%) scale(.25); } 22%, 65% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 82% { opacity: .9; transform: translate(-50%,-50%) scale(1.08); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(6); } }
@keyframes launch-ripple { 0% { opacity: .75; transform: scale(.8); } 100% { opacity: 0; transform: scale(1.75); } }
@keyframes launch-wave { from { transform: scaleY(.52); } to { transform: scaleY(1.08); } }
@keyframes launch-world-arrives { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.35) rotate(-12deg); } 22%, 72% { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(0); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.22) rotate(8deg); } }
@keyframes launch-country-pop { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
@keyframes launch-card-one { 0% { opacity: 0; transform: translate(-70%,20%) rotate(-16deg); } 38%, 72% { opacity: 1; transform: translate(0,0) rotate(-4deg); } 100% { opacity: 0; transform: translate(-3%,-18%) rotate(-3deg); } }
@keyframes launch-card-two { 0% { opacity: 0; transform: translate(70%,28%) rotate(16deg); } 38%, 72% { opacity: 1; transform: translate(0,0) rotate(5deg); } 100% { opacity: 0; transform: translate(2%,-15%) rotate(5deg); } }
@keyframes launch-orb-blue { from { opacity: 0; transform: scale(.6); } to { opacity: .7; transform: scale(1); } }
@keyframes launch-skip-button { 0%, 12% { opacity: 0; } 20%, 82% { opacity: 1; } 100% { opacity: 0; } }

[dir="rtl"] .launch-transition--playing .launch-brand { animation-name: launch-logo-journey-rtl; }
[dir="rtl"] .launch-card-wave { right: 11px; left: auto; }
[dir="rtl"] .launch-voice-card small { right: auto; left: 10px; }
@keyframes launch-logo-journey-rtl {
  0% { opacity: 0; transform: translate(-50%,-38%) scale(.82); }
  10%, 68% { opacity: 1; left: 50%; right: auto; top: 18%; transform: translate(-50%,-50%) scale(1); text-align: center; }
  82%, 100% { opacity: 1; left: auto; right: 22px; top: calc(env(safe-area-inset-top) + 18px); transform: scale(.64); transform-origin: top right; text-align: start; }
}

@media (max-height: 667px) {
  .launch-voice-core, .launch-world { top: 44%; }
  .launch-voice-card { bottom: 10%; width: min(35vw, 150px); }
}

@media (max-width: 340px) {
  .launch-brand span { letter-spacing: .1em; }
  .launch-country { width: 28px; }
  .launch-voice-card { width: 37vw; }
}

@media (prefers-reduced-motion: reduce) {
  .launch-transition, .launch-transition * { animation: none !important; }
}
</style>
