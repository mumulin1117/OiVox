import { discoveryPeople, firstDayFreeDiscoveryIDs } from './discoveryFixtures'

export const OIVOX_TEST_USER_ID = '42618403-0000-4000-8000-000000000001'

const HARUTO_ID = 'user-media-17-japan-1'
const EMRE_ID = 'user-media-04-turkey-1'
const LAYLA_ID = 'user-media-01-arabic-1'
const LUKAS_ID = 'user-media-15-germany-1'
const NOAM_ID = 'user-media-08-israel-2'

export const oivoxTestFixtures = {
  profileListenerUserIDs: Object.freeze([LAYLA_ID, HARUTO_ID, EMRE_ID, NOAM_ID]),
  profileVoiceClip: Object.freeze({
    id: 'voice-mia-profile-local',
    asset: discoveryPeople['user-media-14-france-2'].voiceClip.asset,
    nativeAssetID: discoveryPeople['user-media-14-france-2'].voiceClip.nativeAssetID,
    durationMs: discoveryPeople['user-media-14-france-2'].voiceClip.durationMs,
    source: 'local-dataset-fixture',
    sourceMediaPairID: 'media-14-france-2',
    isSimulated: true,
  }),
  relationships: [
    { id: 'relationship-haruto', userID: HARUTO_ID, status: 'mutual' },
    { id: 'relationship-emre', userID: EMRE_ID, status: 'mutual' },
  ],
  people: discoveryPeople,
  discovery: {
    firstDayFreeUserIDs: firstDayFreeDiscoveryIDs,
    freeDailyLimit: 7,
    extraCardPack: { coinCost: 50, cardCount: 5 },
  },
  threads: [
    { id: 'thread-haruto', peerUserID: HARUTO_ID, unreadCount: 1, messages: [
      { id: 'message-haruto-text', senderID: HARUTO_ID, type: 'text', text: 'Your latest voice clip was lovely.', sentAt: '2026-09-20T10:24:00Z' },
      { id: 'message-haruto-voice', senderID: OIVOX_TEST_USER_ID, type: 'voice', localAssetKey: 'voice-mia-haruto-01', duration: 7, sentAt: '2026-09-20T10:25:00Z' },
    ] },
    { id: 'thread-emre', peerUserID: EMRE_ID, unreadCount: 0, messages: [
      { id: 'message-emre-text', senderID: OIVOX_TEST_USER_ID, type: 'text', text: 'Would you like to swap city stories?', sentAt: '2026-09-19T09:11:00Z' },
      { id: 'message-emre-voice', senderID: EMRE_ID, type: 'voice', localAssetKey: 'voice-emre-01', duration: 6.72, sentAt: '2026-09-19T09:12:00Z' },
    ] },
  ],
  friendRequests: [
    { id: 'request-layla', direction: 'incoming', fromUserID: LAYLA_ID, status: 'pending', note: 'I liked your seven-second voice.', createdAt: '2026-09-20T08:30:00Z' },
    { id: 'request-lukas', direction: 'outgoing', toUserID: LUKAS_ID, status: 'pending', note: 'Would you like to swap city stories?', createdAt: '2026-09-19T13:20:00Z' },
  ],
}
