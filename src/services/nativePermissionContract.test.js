import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { permissionContent, permissionLocales } from '../data/permissionContent'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const bridge = read('src/nativeBridge.js')
const native = read('ios/OiVox/NativeBridge.swift')
const registration = read('src/components/RegistrationFlow.vue')
const verificationGate = read('src/services/verificationPermissionGate.js')
const profileVoice = read('src/components/ProfileVoiceFlow.vue')
const social = read('src/components/SocialModule.vue')

describe('native permission gates', () => {
  it('never treats a browser fallback as a granted system permission', () => {
    expect(bridge).toContain("if (service === 'Permission') return { granted: false, status: 'unsupported', simulated: true }")
    expect(bridge).toContain('window.__OIVOX_NATIVE_BRIDGE__?.available === true')
    expect(bridge).toContain('get isNative()')
  })

  it('supports camera, microphone and photo-library status in the existing native bridge', () => {
    expect(native).toContain('PHPhotoLibrary.authorizationStatus(for: .readWrite)')
    expect(native).toContain('PHPhotoLibrary.requestAuthorization(for: .readWrite)')
    expect(native).toContain('AVCaptureDevice.requestAccess(for: mediaType)')
    expect(native).toContain('case ("Permission", "openSettings")')
    expect(native).toContain('UIApplication.openSettingsURLString')
    expect(native).toContain('Task { @MainActor in')
    expect(bridge).toContain("openAppSettings: (options) => callNative('Permission', 'openSettings', {}, options)")
    expect(native).toContain('[OiVox Permission] Requesting')
    expect(native).toContain('guard await requestPermission("microphone")')
    expect(native).toContain('guard await requestPermission("camera")')
    expect(native).toContain('guard !(session.availableInputs ?? []).isEmpty, !session.currentRoute.inputs.isEmpty')
    expect(native).toContain('recorder.delegate = nil')
    expect(native).toContain('audioRecorderEncodeErrorDidOccur')
  })

  it('gates every recording and verification entry before the protected action', () => {
    expect(registration).toContain('nativeBridge.requestPermission(permission, { pageInstanceID })')
    expect(registration).toContain('resolveVerificationPermissions(nativeBridge, { pageInstanceID })')
    expect(registration).toContain("stage === 'microphone' ? copy.notNow : copy.skipForNow")
    expect(verificationGate).toContain("Object.freeze(['microphone', 'camera'])")
    expect(verificationGate).toContain('bridge.getPermissionStatus(permission, options)')
    expect(verificationGate).toContain('bridge.requestPermission(permission, options)')
    expect(profileVoice).toContain("nativeBridge.requestPermission('microphone', { pageInstanceID })")
    expect(social).toContain("nativeBridge.requestPermission('microphone', { pageInstanceID: mediaPageInstanceID })")
    expect(social).toContain("nativeBridge.requestPermission('camera', { pageInstanceID: videoPageInstanceID })")
  })

  it('provides permission failure guidance in all supported locales', () => {
    expect(permissionLocales).toEqual(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
    permissionLocales.forEach((locale) => {
      expect(permissionContent(locale).nativeOnly).toBeTruthy()
      expect(permissionContent(locale).photoLibraryRequired).toBeTruthy()
      expect(permissionContent(locale).microphoneRequired).toBeTruthy()
      expect(permissionContent(locale).cameraRequired).toBeTruthy()
      expect(permissionContent(locale).settingsTitle).toBeTruthy()
      expect(permissionContent(locale).microphoneSettingsBody).toContain('OiVox')
      expect(permissionContent(locale).cameraSettingsBody).toContain('OiVox')
      expect(permissionContent(locale).bothSettingsBody).toContain('OiVox')
      expect(permissionContent(locale).openSettings).toBeTruthy()
      expect(permissionContent(locale).close).toBeTruthy()
      expect(permissionContent(locale).settingsOpenFailed).toBeTruthy()
    })
  })
})
