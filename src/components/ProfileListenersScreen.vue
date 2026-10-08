<script setup>
import { computed, ref } from 'vue'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import heartIcon from '../assets/icons/discovery-heart.svg'
import { discoveryPeople } from '../data/discoveryFixtures'
import { profileRouteContent } from '../data/profileRouteContent'
import { useI18n } from '../i18n'

const props = defineProps({
  count: { type: Number, default: 0 },
  userIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['back'])
const { locale } = useI18n()
const copy = computed(() => profileRouteContent(locale.value))
const people = computed(() => props.userIds.map((userID) => discoveryPeople[userID]).filter(Boolean))
const liked = ref(new Set())
const heading = computed(() => copy.value.listenersHeading.replace('{count}', String(props.count)))

function toggleLike(id) {
  const next = new Set(liked.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  liked.value = next
}
</script>

<template>
  <main class="profile-listeners-screen app-screen">
    <header class="profile-listeners-nav">
      <button type="button" :aria-label="copy.listeners" @click="emit('back')"><img :src="arrowLeftIcon" alt=""></button>
      <h1>{{ copy.listeners }}</h1>
      <span />
    </header>
    <section class="profile-listeners-scroll">
      <h2>{{ heading }}</h2>
      <div class="profile-listeners-list">
        <article v-for="person in people" :key="person.id">
          <span class="profile-listener-avatar"><img :src="person.avatarAsset" alt=""><img :src="person.flagAsset" alt=""></span>
          <span><strong>{{ person.displayName }}</strong><small>{{ person.countryLabel }} · {{ copy.likedClip }}</small></span>
          <button type="button" :class="{ active: liked.has(person.id) }" :aria-pressed="liked.has(person.id)" :aria-label="person.displayName" @click="toggleLike(person.id)"><img :src="heartIcon" alt=""></button>
        </article>
      </div>
      <p class="profile-listeners-local">{{ copy.localListeners }}</p>
      <p class="profile-listeners-note">{{ copy.listenersNote }}</p>
    </section>
  </main>
</template>
