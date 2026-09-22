import { beforeEach, describe, expect, it } from 'vitest'
import { localBusinessKeys, saveLocalSupportTicket, saveNotificationPreference, savePublishedVoiceClip } from './localBusinessStore'

beforeEach(() => localStorage.clear())

describe('local post-registration data boundaries', () => {
  it('marks support tickets and voice publication as local simulation data', () => {
    const ticket = saveLocalSupportTicket({ category: 'bug', details: '  Camera closed  ', attachmentAssetIDs: [], includeDiagnostics: true })
    const clip = savePublishedVoiceClip({ id: 'clip-1', localAssetID: 'asset-1', durationMs: 9000 })
    expect(ticket).toMatchObject({ details: 'Camera closed', status: 'saved_local', isSimulated: true })
    expect(clip).toMatchObject({ durationMs: 7000, status: 'published_local', isSimulatedPublication: true })
    expect(JSON.parse(localStorage.getItem(localBusinessKeys.TICKET_KEY))).toHaveLength(1)
  })

  it('persists notification refusal without requesting permission', () => {
    const value = saveNotificationPreference({ onboardingChoice: 'not_now', systemStatus: 'notDetermined' })
    expect(value).toMatchObject({ onboardingChoice: 'not_now', systemStatus: 'notDetermined', source: 'post-first-clip' })
  })
})
