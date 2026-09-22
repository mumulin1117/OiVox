import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { firstDayFreeDiscoveryIDs } from '../data/discoveryFixtures'

describe('Blue Lake main hub contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/MainHub.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('uses the stable seven-person fixture deck without a TabBar', () => {
    expect(firstDayFreeDiscoveryIDs).toHaveLength(7)
    expect(component).toContain('firstDayFreeDiscoveryIDs')
    expect(component).not.toMatch(/tab-?bar/i)
  })

  it('binds three distinct fixture records and routes cards into voice discovery', () => {
    expect(component).toContain('voicePlaybackService')
    expect(component).toContain('const heroPrimaryVoice = Object.freeze(dailyVoices[0])')
    expect(component).toContain('const heroSecondaryVoice = Object.freeze(dailyVoices[1])')
    expect(component).toContain('const featuredVoice = Object.freeze(dailyVoices[2])')
    expect(component).toContain(':src="heroPrimaryVoice.avatarAsset"')
    expect(component).toContain(':src="heroSecondaryVoice.avatarAsset"')
    expect(component).toContain(':src="featuredVoice.avatarAsset"')
    expect(component).toContain('@click="openDiscovery(featuredVoice.id)"')
    expect(component).toContain('class="hub-player-open"')
    expect(component).toContain('class="hub-player-toggle"')
    expect(component).toContain('@click="toggleFeaturedVoice"')
    expect(component).toContain('formatVoiceDuration(playerRemaining)')
    expect(component).toContain('voicePlaybackRemainingMs(audioState.value, featuredVoice.voiceClip)')
    expect(component).toContain('VoiceDiscoveryScreen')
    expect(component).toContain(':initial-user-id="selectedUserID"')
    expect(component).toContain('@click="openProfileCenter"')
    expect(component).toContain("@click=\"openSocial('messages')\"")
    expect(component).not.toContain('menuOpen')
  })

  it('uses the authenticated account avatar and wallet instead of a shared display fixture', () => {
    expect(component).toContain('resolveAccountAvatar(props.user)')
    expect(component).toContain('resolveAccountCoinBalance(props.user)')
    expect(component).toContain('createSocialStore({ accountID })')
    expect(component).not.toContain('oivoxTestFixtures.profileSummary.coinBalance')
    expect(component).toContain('../assets/coin.png')
    expect(component).toContain('hub-chat.svg')
  })

  it('uses the remaining four unique users in New voices and moves the selection outline', () => {
    expect(component).toContain('const newVoices = Object.freeze(dailyVoices.slice(3))')
    expect(component).toContain('const selectedDailyVoiceID = ref(newVoices[0].id)')
    expect(component).toContain('selectedDailyVoiceID.value = userID')
    expect(component).toContain('v-for="voice in newVoices"')
    expect(component).toContain(':class="{ selected: voice.id === selectedDailyVoiceID }"')
    expect(component).toContain(':aria-current="voice.id === selectedDailyVoiceID ? \'true\' : undefined"')
    expect(component).toContain('@click="openDailyVoice(voice.id)"')
    expect(css).toContain('.hub-voice-card.selected')
  })

  it('opens the unlocked Voice Earth from See all while preserving direct card discovery', () => {
    expect(component).toContain("import VoiceEarthScreen from './VoiceEarthScreen.vue'")
    expect(component).toContain('const voiceEarthActive = ref(false)')
    expect(component).toContain('@click="openVoiceEarth"')
    expect(component).toContain('<VoiceEarthScreen v-if="voiceEarthActive"')
    expect(component).toContain(':voices="dailyVoices"')
    expect(component).toContain('@open-profile="openDiscoveryFromEarth"')
    expect(component).toContain(':data-earth-source="heroPrimaryVoice.id"')
    expect(component).toContain(':data-earth-source="featuredVoice.id"')
    expect(component).toContain(':data-earth-source="voice.id"')
    expect(component).toContain('@click="openDailyVoice(voice.id)"')
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
    expect(component).toContain(':inert="introActive || voiceEarthActive || Boolean(discoveryTransitionUserID) || Boolean(discoveryReturnState) || profileTransitionActive"')
    expect(component).toContain(':aria-hidden="introActive || voiceEarthActive || discoveryTransitionUserID || discoveryReturnState || profileTransitionActive ? \'true\' : undefined"')
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
