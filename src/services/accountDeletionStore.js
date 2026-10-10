const ACCOUNT_SCOPED_PREFIXES = [
  'oivox.privacy.v1:',
  'oivox.supportTickets.v1:',
  'oivox.coinWallet.v1:',
  'oivox.socialState.v2:',
  'oivox.translationHistory.v1:',
  'oivox.voiceActivity.v1:',
  'oivox.voiceEarthAccess.v1:',
  'oivox.discoveryState.v1:',
  'oivox.accountUser.v1:',
]

export function clearAccountLocalData(accountID, storage = typeof localStorage === 'undefined' ? null : localStorage) {
  const id = String(accountID || '').trim()
  if (!storage || !id) return
  ACCOUNT_SCOPED_PREFIXES.forEach((prefix) => storage.removeItem(`${prefix}${id}`))
  try {
    const clips = JSON.parse(storage.getItem('oivox.localVoiceClips.v1') || '[]')
    if (Array.isArray(clips)) storage.setItem('oivox.localVoiceClips.v1', JSON.stringify(clips.filter((clip) => clip?.accountID !== id)))
  } catch { /* keep unrelated local data intact */ }
}
