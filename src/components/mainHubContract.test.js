import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'

describe('Blue Lake main hub contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/MainHub.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('uses the stable seven-person fixture deck without a TabBar', () => {
    expect(firstDayFreeDiscoveryIDs).toHaveLength(7)
    expect(component).toContain('createDiscoveryStore')
    expect(component).toContain('discoverySnapshot.value.allocatedUserIDs')
    expect(component).toContain('discoverySnapshot.value.allocatedUserIDs.filter')
    expect(component).toContain('discoveryStore.reload')
    expect(component).not.toContain('firstDayFreeDiscoveryIDs.map')
    expect(component).not.toMatch(/tab-?bar/i)
  })

  it('binds three distinct fixture records and routes cards into voice discovery', () => {
    expect(component).toContain('voicePlaybackService')
    expect(component).toContain('const heroPrimaryVoice = computed(() => dailyVoices.value[0])')
    expect(component).toContain('const heroSecondaryVoice = computed(() => dailyVoices.value[1])')
    expect(component).toContain('const featuredVoice = computed(() => dailyVoices.value[2])')
    expect(component).toContain(':src="heroPrimaryVoice.avatarAsset"')
    expect(component).toContain(':src="heroSecondaryVoice.avatarAsset"')
    expect(component).toContain(':src="featuredVoice.avatarAsset"')
    expect(component).toContain('@click="openDiscovery(featuredVoice.id)"')
    expect(component).toContain('class="hub-player-profile"')
    expect(component).toContain('class="hub-player-audio"')
    expect(component).toContain('class="hub-player-toggle"')
    expect(component.match(/@click="toggleFeaturedVoice"/g)).toHaveLength(2)
    expect(component).toContain('formatVoiceDuration(playerRemaining)')
    expect(component).toContain('voicePlaybackRemainingMs(audioState.value, featuredVoice.value?.voiceClip)')
    expect(component).toContain('VoiceDiscoveryScreen')
    expect(component).toContain(':initial-user-id="selectedUserID"')
    expect(component).toContain('@click="openProfileCenter"')
    expect(component).toContain("@click=\"openSocial('messages')\"")
    expect(component).toContain("@click=\"openSocial('coin-store')\"")
    expect(component).not.toContain('menuOpen')
  })

  it('uses the authenticated account avatar and wallet instead of a shared display fixture', () => {
    expect(component).toContain('resolveAccountAvatar(props.user)')
    expect(component).toContain('resolveAccountCoinBalance(props.user)')
    expect(component).toContain('createSocialStore({ accountID })')
    expect(component).toContain(':discovery-user-ids="availableDiscoveryUserIDs"')
    expect(component).not.toContain('oivoxTestFixtures.profileSummary.coinBalance')
    expect(component).toContain('../assets/coin.png')
    expect(component).toContain('hub-chat.svg')
    expect(component).toContain('hub-conversation-action')
    expect(component).toContain("import CoinStoreScreen from './CoinStoreScreen.vue'")
    expect(component).toContain("v-else-if=\"activeSocial === 'coin-store'\"")
    expect(component).toContain('@balance-changed="updateCoinBalance"')
    expect(css).toContain('.hub-header .hub-coin { width: 78px; min-width: 78px;')
    expect(css).toContain('.hub-coin-visual { width: 78px; height: 36px;')
  })

  it('uses the remaining four unique users in New voices and moves the selection outline', () => {
    expect(component).toContain('const newVoices = computed(() => dailyVoices.value.slice(3))')
    expect(component).toContain('const selectedDailyVoiceID = ref(newVoices.value[0]?.id')
    expect(component).toContain('selectedDailyVoiceID.value = userID')
    expect(component).toContain('v-for="voice in newVoices"')
    expect(component).toContain(':class="{ selected: voice.id === selectedDailyVoiceID }"')
    expect(component).toContain(':aria-current="voice.id === selectedDailyVoiceID ? \'true\' : undefined"')
    expect(component).toContain('@pointerdown="beginNewVoicePointer($event, voice.id)"')
    expect(component).toContain('@pointermove="moveNewVoicePointer"')
    expect(component).toContain('@pointerup="finishNewVoicePointer($event, voice.id)"')
    expect(component).toContain('@pointercancel="cancelNewVoicePointer"')
    expect(component).toContain('@lostpointercapture="cancelNewVoicePointer"')
    expect(component).toContain('@click="handleNewVoiceClick($event, voice.id)"')
    expect(component).toContain('Math.hypot(movedX, movedY) > NEW_VOICE_TAP_DISTANCE')
    expect(css).toContain('touch-action: pan-x pan-y')
    expect(css).toContain('.hub-voice-card.selected')
  })

  it('opens the unlocked Voice Earth from See all while preserving direct card discovery', () => {
    expect(component).toContain("import VoiceEarthScreen from './VoiceEarthScreen.vue'")
    expect(component).toContain('const voiceEarthActive = ref(false)')
    expect(component).toContain('@click="openVoiceEarth"')
    expect(component).toContain('<VoiceEarthScreen v-if="voiceEarthActive"')
    expect(component).toContain(':voices="earthVoices"')
    expect(component).toContain('discoverySnapshot.value.earthUserIDs.map')
    expect(component).not.toContain('availableDiscoveryUserIDs.value.slice(0, 7)')
    expect(component).toContain('VoiceEarthLockedScreen')
    expect(component).toContain('isVoiceEarthUnlocked')
    expect(component).toContain('@open-profile="openDiscoveryFromEarth"')
    expect(component).toContain(':data-earth-source="heroPrimaryVoice.id"')
    expect(component).toContain(':data-earth-source="featuredVoice.id"')
    expect(component).toContain(':data-earth-source="voice.id"')
    expect(component).toContain('@click="handleNewVoiceClick($event, voice.id)"')
  })

  it('guides each account to See all once after the main hub introduction', () => {
    expect(component).toContain("const SEE_ALL_GUIDE_KEY = 'oivox.mainHubSeeAllGuide.v1'")
    expect(component).toContain('`${SEE_ALL_GUIDE_KEY}:${accountID}`')
    expect(component).toContain("localStorage.setItem(seeAllGuideStorageKey, 'seen')")
    expect(component).toContain('showSeeAllGuideIfNeeded()')
    expect(component).toContain('ref="seeAllButton"')
    expect(component).toContain('class="hub-see-all-guide"')
    expect(component).toContain('class="hub-see-all-guide-skip"')
    expect(component).toContain('class="hub-see-all-guide-focus"')
    expect(component).toContain('class="hub-see-all-guide-card"')
    expect(component).toContain('@click="openVoiceEarth"')
    expect(css).toContain('.hub-see-all-guide-scrim')
    expect(css).toContain('.hub-see-all-guide-focus')
    expect(css).toContain('background: #edff70')
    for (const locale of ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']) {
      expect(component).toContain(`${locale}: { skip:`)
    }
  })

  it('keeps an allocated processed card as the discovery return target after opening its profile', () => {
    expect(component).toContain('const selectedIsAllocated = discoverySnapshot.value.allocatedUserIDs.includes(selectedDailyVoiceID.value)')
    expect(component).toContain('selectedDailyVoiceID.value = userID')
    expect(component).toContain('openDiscovery(selectedIsAllocated ? selectedDailyVoiceID.value')
  })

  it('extracts the selected live avatar before opening the matching discovery card', () => {
    expect(component).toContain("import VoiceDiscoveryEntryTransition from './VoiceDiscoveryEntryTransition.vue'")
    expect(component).toContain('const discoveryTransitionUserID = ref(\'\')')
    expect(component).toContain('discoveryTransitionUserID.value = userID')
    expect(component).toContain('<VoiceDiscoveryEntryTransition')
    expect(component).toContain('@complete="completeDiscoveryTransition"')
    expect(component).toContain(':animate-entry="discoveryEntryAnimated"')
    expect(component).toContain(':data-discovery-source="heroPrimaryVoice.id"')
    expect(component).toContain(':data-discovery-source="heroSecondaryVoice.id"')
    expect(component).toContain(':data-discovery-source="featuredVoice.id"')
    expect(component).toContain(':data-discovery-source="voice.id"')
  })

  it('packages the annotated typography and product icons locally', () => {
    for (const asset of [
      'src/assets/fonts/figtree-400.ttf',
      'src/assets/fonts/figtree-500.ttf',
      'src/assets/fonts/figtree-800.ttf',
      'src/assets/fonts/OFL.txt',
      'src/assets/coin.png',
      'src/assets/icons/hub-chat.svg',
      'src/assets/icons/hub-play.svg',
      'src/assets/icons/hub-pause.svg',
      'src/assets/icons/hub-voice.svg',
    ]) expect(existsSync(resolve(process.cwd(), asset))).toBe(true)
    expect(css).toContain('font-family: "Figtree"')
    expect(css).toContain('font-size: 31px')
    expect(css).toContain('letter-spacing: -1.09px')
    expect(css).toContain('.hub-header .hub-conversation-action::before')
    expect(css).toContain('width: 36px; height: 36px;')
    expect(css).toContain('.hub-conversation-action > img { width: 18px; height: 18px;')
    expect(css).toContain('.hub-avatar-button > img { width: 40px; height: 40px;')
  })

  it('keeps safe-area, RTL, small-screen and reduced-motion safeguards', () => {
    expect(css).toContain('env(safe-area-inset-top)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('[dir="rtl"] .hub-photo-card-large')
    expect(css).toContain('@media (max-width: 340px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('mounts the confirmed Voice Earth intro without changing discovery actions', () => {
    expect(component).toContain("import MainHubIntro from './MainHubIntro.vue'")
    expect(component).toContain(':voices="dailyVoices"')
    expect(component).toContain(':data-intro-user="heroPrimaryVoice.id"')
    expect(component).toContain(':data-intro-user="featuredVoice.id"')
    expect(component).toContain(':data-hub-title-word="index"')
    expect(component).toContain(':inert="introActive || voiceEarthActive || voiceEarthLockedActive || Boolean(discoveryTransitionUserID) || Boolean(discoveryReturnState) || profileTransitionActive || Boolean(profileReturnState)"')
    expect(component).toContain(':aria-hidden="introActive || voiceEarthActive || voiceEarthLockedActive || discoveryTransitionUserID || discoveryReturnState || profileTransitionActive || profileReturnState ? \'true\' : undefined"')
    expect(component).toContain('playIntro: { type: Boolean, default: false }')
    expect(component).toContain("'hub-intro-pending': introActive && !introReady")
    expect(component).toContain('@ready="markIntroReady"')
    expect(component).toContain("emit('intro-complete')")
    expect(component).not.toContain('sessionStorage')
    expect(css).toContain('.hub-earth-sphere')
    expect(css).toContain('.hub-earth-person')
    expect(css).toContain('.hub-intro-pending .hub-scroll { visibility: hidden; }')
    expect(css).toContain('.hub-intro-active [data-intro-user]')
  })
})
