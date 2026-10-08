export const verificationPermissions = Object.freeze(['microphone', 'camera'])

const authorizedStatuses = new Set(['authorized'])
const settingsStatuses = new Set(['denied', 'restricted'])

function normalizeStatus(result) {
  if (result?.granted === true) return 'authorized'
  return String(result?.status || 'unsupported')
}

function summarize(statuses) {
  const missing = verificationPermissions.filter((permission) => !authorizedStatuses.has(statuses[permission]))
  return {
    granted: missing.length === 0,
    statuses,
    missing,
    needsSettings: missing.some((permission) => settingsStatuses.has(statuses[permission])),
  }
}

export async function resolveVerificationPermissions(bridge, options = {}) {
  const statusResults = await Promise.all(verificationPermissions.map(async (permission) => [
    permission,
    normalizeStatus(await bridge.getPermissionStatus(permission, options)),
  ]))
  const statuses = Object.fromEntries(statusResults)

  // A denied/restricted permission cannot display the system prompt again.
  // Stop here so the UI can explain the exact Settings path instead.
  if (verificationPermissions.some((permission) => settingsStatuses.has(statuses[permission]))) return summarize(statuses)

  // iOS permission prompts must never overlap. Request untouched permissions
  // serially even though their initial status reads are safe to run together.
  for (const permission of verificationPermissions) {
    if (statuses[permission] !== 'notDetermined') continue
    statuses[permission] = normalizeStatus(await bridge.requestPermission(permission, options))
  }

  return summarize(statuses)
}
