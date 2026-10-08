import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { socialContent, socialContentKeys, socialLocales } from '../data/socialContent'

describe('messages and friends Blue Lake flow contract', () => {
  const social = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
  const hub = readFileSync(resolve(process.cwd(), 'src/components/MainHub.vue'), 'utf8')
  const coinDialog = readFileSync(resolve(process.cwd(), 'src/components/CoinSpendDialog.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('routes the home message action to the sticker messages screen', () => {
    expect(hub).toContain('@click="openSocial(\'messages\')"')
    expect(hub).toContain('@open-discovery="openDiscoveryFromSocial"')
    expect(hub).toContain(':discovery-user-ids="availableDiscoveryUserIDs"')
    expect(social).toContain('props.discoveryUserIds')
    expect(social).not.toContain('oivoxTestFixtures.messageHighlight')
  })

  it('matches the latest H5 message controls and keeps the related social routes live', () => {
    expect(social).not.toContain("messageTab = 'groups'")
    expect(social).not.toContain('{{ copy.groups }}')
    expect(social).toContain('@click="screen = \'friends\'">{{ copy.friends }}')
    expect(social).toContain('@click="screen = \'requests\'"')
    expect(social).toContain("props.entry === 'messages' && ['friends', 'requests'].includes(screen.value)")
    expect(social).toContain('@click="openChat(item.id)"')
    expect(social).toContain('@click="openVideo(item.id)"')
    expect(social).toContain('@click="openSafety(item.id)"')
    expect(social).toContain('@click="openProfile(item.id)"')
  })

  it('uses store-backed conversations, local cut assets, audio cleanup and no TabBar', () => {
    expect(social).toContain('snapshot.value.threads.filter')
    expect(social).toContain('snapshot.value.relationshipsByUserID')
    expect(social).toContain("hub-chat.svg")
    expect(social).toContain("video-call.svg")
    expect(social).toContain("discovery-more.svg")
    expect(social).toContain('voicePlaybackService.stop()')
    expect(social).not.toMatch(/tab-?bar/i)
  })

  it('requires coin confirmation for chat translation and routes insufficient balance to StoreKit', () => {
    expect(social).toContain('<CoinSpendDialog')
    expect(social).toContain("chatCoinDialog.value = localCoinBalance.value < 5 ? 'insufficient' : 'confirm'")
    expect(social).toContain("reason: 'chat_translation'")
    expect(social).toContain("nativeBridge.translateText(source.text")
    expect(social).toContain("@get-coins=\"openCoinStore('chat')\"")
    expect(social).toContain("coinStoreReturnScreen.value === 'chat'")
    expect(coinDialog).toContain('class="voice-discovery-coin-drag-zone"')
    expect(coinDialog).toContain('@pointerdown="beginDrag"')
    expect(coinDialog).toContain('@pointercancel="finishDrag($event, true)"')
    expect(coinDialog).toContain('@lostpointercapture="finishDrag($event, true)"')
    expect(coinDialog).toContain("'--coin-sheet-drag-offset': `${dragOffset}px`")
    expect(css).toContain('.voice-discovery-coin-dialog.is-confirm { height: min(387px')
    expect(css).toContain('.voice-discovery-coin-dialog.is-insufficient { height: min(379px')
    expect(css).toContain('font-family: "Figtree","PingFang SC","Microsoft YaHei","Hiragino Sans GB",sans-serif')
    expect(css).toContain('background: rgba(27,28,46,.42)')
  })

  it('keeps Blue Lake surfaces responsive, safe-area aware and RTL mirrored', () => {
    expect(css).toContain('.messages-hero')
    expect(css).toContain('.message-controls')
    expect(css).toContain('.thread-avatar .thread-flag')
    expect(css).toContain('.friend-card-main')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('[dir="rtl"] .friend-avatar .friend-flag')
  })

  it('keeps the received-request decisions inline while the non-action content opens details', () => {
    expect(social).toContain('class="request-card-open"')
    expect(social).toContain('@click="openRequest(request.id)"')
    expect(social).toContain('@click.stop="resolveRequest(\'decline\', request.id)"')
    expect(social).toContain('@click.stop="resolveRequest(\'accept\', request.id)"')
    expect(social).toContain("store.acceptRequest(requestID, operationID('accept-request'))")
    expect(social).toContain("store.declineRequest(requestID, operationID('decline-request'))")
    expect(social).not.toContain("const requestTab = ref('incoming')")
  })

  it('renders request detail and friends from stable store-backed people instead of design-copy data', () => {
    expect(social).toContain('function requestUser(request)')
    expect(social).toContain('class="request-profile-avatar"')
    expect(social).toContain('class="request-voice-row"')
    expect(social).toContain('@click="openSafety(requestUser(pendingRequest).id)"')
    expect(social).toContain("relationship(item.id)?.friendshipStatus === 'friends'")
    expect(social).toContain("relationship(item.id)?.blockStatus === 'none'")
    expect(css).toContain('background: linear-gradient(172deg,#fde4ec 0%,#fbdde4 46%,#faf3e0 100%)')
    expect(css).toContain('.request-card-actions button')
    expect(css).toContain('.friend-actions { display: grid; grid-template-columns: 1fr 1fr')
  })

  it('keeps the H5 reference proportions for the message page', () => {
    expect(social).not.toContain("search.svg")
    expect(social).not.toContain('message-filter')
    expect(social).toContain('messages-title-line')
    expect(social).toContain('new-voices-card')
    expect(css).toContain('linear-gradient(172deg,#fde4ec 0%,#fbdde4 46%,#faf3e0 100%)')
    expect(css).toContain('font: 800 31px/31px "Figtree",sans-serif')
    expect(css).toContain('grid-template-columns: 50px minmax(0,1fr) auto')
    expect(css).toContain('border-radius: 20px')
    expect(css).toContain('@media (max-width: 340px)')
  })

  it.each(socialLocales)('provides every message/friends string for %s', (locale) => {
    const content = socialContent(locale)
    for (const key of socialContentKeys) expect(content[key], key).toBeTruthy()
    expect(content.newVoicesDetail).toContain('{count}')
  })
})
