import { createOpaqueID } from './livenessFlow'

const TICKET_KEY = 'oivox.localSupportTickets.v1'
const CLIP_KEY = 'oivox.localVoiceClips.v1'
const NOTIFICATION_KEY = 'oivox.notificationPreference.v1'

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeList(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function saveLocalSupportTicket(ticket) {
  const now = new Date().toISOString()
  const value = {
    id: ticket.id || createOpaqueID('ticket_local'),
    source: 'liveness-failure',
    category: ticket.category,
    details: ticket.details.trim(),
    attachmentAssetIDs: [...(ticket.attachmentAssetIDs || [])],
    includeDiagnostics: ticket.includeDiagnostics === true,
    status: 'saved_local',
    isSimulated: true,
    createdAt: ticket.createdAt || now,
    updatedAt: now,
  }
  const tickets = readList(TICKET_KEY)
  const index = tickets.findIndex((item) => item.id === value.id)
  if (index >= 0) tickets[index] = value
  else tickets.unshift(value)
  writeList(TICKET_KEY, tickets.slice(0, 20))
  return value
}

export function savePublishedVoiceClip(clip) {
  const now = new Date().toISOString()
  const value = {
    id: clip.id || createOpaqueID('clip'),
    localAssetID: clip.localAssetID,
    durationMs: Math.min(7000, Math.max(0, Number(clip.durationMs) || 0)),
    status: 'published_local',
    isSimulatedPublication: true,
    createdAt: clip.createdAt || now,
    publishedAt: now,
  }
  const clips = readList(CLIP_KEY).filter((item) => item.id !== value.id)
  writeList(CLIP_KEY, [value, ...clips].slice(0, 50))
  return value
}

export function saveNotificationPreference(preference) {
  const value = {
    onboardingChoice: preference.onboardingChoice,
    systemStatus: preference.systemStatus || 'notDetermined',
    source: 'post-first-clip',
    requestedAt: preference.requestedAt || null,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  }
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(value))
  return value
}

export const localBusinessKeys = { TICKET_KEY, CLIP_KEY, NOTIFICATION_KEY }
