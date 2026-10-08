<script setup>
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import checkGreenIcon from '../assets/icons/check-green.svg'
import microphoneIcon from '../assets/icons/mic.svg'
import shieldCheckIcon from '../assets/icons/shield-check.svg'

defineProps({
  voices: { type: Array, default: () => [] },
  copy: { type: Object, required: true },
})

const emit = defineEmits(['close', 'record'])
</script>

<template>
  <section class="voice-earth-locked-page app-screen flow-page">
    <div class="voice-earth-locked-scroll">
      <button class="voice-earth-locked-back" type="button" :aria-label="copy.back" @click="emit('close')"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ copy.voiceEarthTitle }}</h1>
      <div class="locked-earth-visual" aria-hidden="true">
        <div class="locked-earth-globe">
          <div class="locked-earth-surface"><span v-for="index in 6" :key="index" :class="`locked-earth-land locked-earth-land-${index}`" /></div>
          <span class="locked-earth-shade" />
          <span class="locked-earth-glint" />
        </div>
        <span v-for="(voice, index) in voices.slice(0, 6)" :key="voice.id" class="locked-earth-avatar" :class="`locked-earth-avatar-${index + 1}`"><img :src="voice.avatarAsset" alt=""></span>
        <div class="locked-earth-card">
          <span class="locked-earth-shield"><img :src="shieldCheckIcon" alt=""></span>
          <strong>{{ copy.recordToUnlock }}</strong>
          <p>{{ copy.voiceEarthLockedBody }}</p>
        </div>
      </div>
      <ul class="locked-earth-benefits"><li v-for="benefit in copy.micBenefits" :key="benefit"><img :src="checkGreenIcon" alt=""><span>{{ benefit }}</span></li></ul>
    </div>
    <footer class="flow-footer"><button class="flow-primary icon-primary" type="button" @click="emit('record')"><img :src="microphoneIcon" alt="">{{ copy.record7 }}</button></footer>
  </section>
</template>
