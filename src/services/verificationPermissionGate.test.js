import { describe, expect, it, vi } from 'vitest'
import { resolveVerificationPermissions } from './verificationPermissionGate'

function createBridge(statuses, requestResults = {}) {
  return {
    getPermissionStatus: vi.fn(async (permission) => ({ status: statuses[permission] })),
    requestPermission: vi.fn(async (permission) => requestResults[permission] || { granted: false, status: 'denied' }),
  }
}

describe('verification permission gate', () => {
  it('continues without requesting when both permissions are already authorized', async () => {
    const bridge = createBridge({ microphone: 'authorized', camera: 'authorized' })
    const result = await resolveVerificationPermissions(bridge, { pageInstanceID: 'page-1' })

    expect(result.granted).toBe(true)
    expect(result.missing).toEqual([])
    expect(bridge.requestPermission).not.toHaveBeenCalled()
  })

  it('requests untouched permissions serially in microphone then camera order', async () => {
    const bridge = createBridge(
      { microphone: 'notDetermined', camera: 'notDetermined' },
      { microphone: { granted: false, status: 'denied' }, camera: { granted: true, status: 'authorized' } },
    )
    const result = await resolveVerificationPermissions(bridge, { pageInstanceID: 'page-2' })

    expect(bridge.requestPermission.mock.calls.map(([permission]) => permission)).toEqual(['microphone', 'camera'])
    expect(result.granted).toBe(false)
    expect(result.missing).toEqual(['microphone'])
    expect(result.needsSettings).toBe(true)
  })

  it('does not re-request a permission that iOS has already denied', async () => {
    const bridge = createBridge({ microphone: 'denied', camera: 'notDetermined' })
    const result = await resolveVerificationPermissions(bridge)

    expect(result.granted).toBe(false)
    expect(result.missing).toEqual(['microphone', 'camera'])
    expect(result.needsSettings).toBe(true)
    expect(bridge.requestPermission).not.toHaveBeenCalled()
  })

  it('reports unsupported environments without claiming authorization', async () => {
    const bridge = createBridge({ microphone: 'unsupported', camera: 'unsupported' })
    const result = await resolveVerificationPermissions(bridge)

    expect(result.granted).toBe(false)
    expect(result.needsSettings).toBe(false)
  })
})
