import { beforeEach, describe, expect, it } from 'vitest'
import { loadPublishedVoiceClip, localBusinessKeys, saveLocalSupportTicket, saveNotificationPreference, savePublishedVoiceClip } from './localBusinessStore'

beforeEach(() => localStorage.clear())

describe('local post-registration data boundaries', () => {
  it('marks support tickets and voice publication as local simulation data', () => {
    const ticket = saveLocalSupportTicket({ category: 'bug', details: '  Camera closed  ', attachmentAssetIDs: [], includeDiagnostics: true })
    const clip = savePublishedVoiceClip({ id: 'clip-1', localAssetID: 'asset-1', durationMs: 9000 })
    expect(ticket).toMatchObject({ details: 'Camera closed', status: 'saved_local', isSimulated: true })
    expect(clip).toMatchObject({ durationMs: 7000, localAssetID: 'asset-1', nativeAssetID: 'asset-1', status: 'published_local', isSimulatedPublication: true })
    expect(JSON.parse(localStorage.getItem(localBusinessKeys.TICKET_KEY))).toHaveLength(1)
  })

  it('persists notification refusal without requesting permission', () => {
    const value = saveNotificationPreference({ onboardingChoice: 'not_now', systemStatus: 'notDetermined' })
    expect(value).toMatchObject({ onboardingChoice: 'not_now', systemStatus: 'notDetermined', source: 'post-first-clip' })
  })

  it('keeps one current self-recorded voice clip per account when a user re-records', () => {
    savePublishedVoiceClip({ id: 'clip-a1', localAssetID: 'asset-a1', durationMs: 6500 }, { accountID: 'account-a' })
    savePublishedVoiceClip({ id: 'clip-b1', localAssetID: 'asset-b1', durationMs: 6200 }, { accountID: 'account-b' })
    const updated = savePublishedVoiceClip({ id: 'clip-a2', localAssetID: 'asset-a2', durationMs: 7000 }, { accountID: 'account-a' })

    expect(updated).toMatchObject({ id: 'clip-a2', accountID: 'account-a', localAssetID: 'asset-a2' })
    expect(loadPublishedVoiceClip('account-a')).toMatchObject({ id: 'clip-a2', localAssetID: 'asset-a2', nativeAssetID: 'asset-a2' })
    expect(loadPublishedVoiceClip('account-b')).toMatchObject({ id: 'clip-b1', localAssetID: 'asset-b1' })
    expect(JSON.parse(localStorage.getItem(localBusinessKeys.CLIP_KEY))).toHaveLength(2)
  })

  it('upgrades an existing localAssetID-only recording into a playable native clip', () => {
    localStorage.setItem(localBusinessKeys.CLIP_KEY, JSON.stringify([{
      id: 'clip-legacy', accountID: 'account-legacy', localAssetID: 'profile_voice_legacy1', durationMs: 6100, status: 'published_local',
    }]))

    expect(loadPublishedVoiceClip('account-legacy')).toMatchObject({
      id: 'clip-legacy',
      localAssetID: 'profile_voice_legacy1',
      nativeAssetID: 'profile_voice_legacy1',
    })
  })
})
