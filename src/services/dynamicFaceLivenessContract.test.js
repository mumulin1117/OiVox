import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const native = read('ios/OiVox/NativeBridge.swift')
const registration = read('src/components/RegistrationFlow.vue')
const server = read('server/src/app.js')

describe('dynamic-face registration verification', () => {
  it('uses consecutive Vision landmarks without recording a verification movie', () => {
    expect(native).toContain('VNDetectFaceLandmarksRequest')
    expect(native).toContain('liveness.dynamicFaceChanged')
    expect(native).toContain('score >= 0.006')
    expect(native).not.toContain('AVCaptureMovieFileOutput')
    expect(native).not.toContain('AVCaptureFileOutputRecordingDelegate')
  })

  it('requires one moving face and does not resolve production results from a fixture', () => {
    expect(registration).toContain('faceCount.value === 1 && dynamicFaceDetected.value')
    expect(registration).toContain("outcomeSource: 'native-dynamic-face'")
    expect(registration).toContain("method: 'local-dynamic-face'")
    expect(registration).not.toContain('resolveLivenessFixture')
  })

  it('accepts and preserves the stable dynamic-face verification method', () => {
    expect(server).toContain("'local-dynamic-face'")
    expect(server).toContain('verificationMethod: body.verification.method')
  })

  it('renders the localized REC badge above the native camera preview layer', () => {
    expect(registration).toContain('recordingLabel: copy.value.recording')
    expect(registration).toContain('v-show="!usesNativeLivenessPreview"')
    expect(native).toContain('cameraSurface.layer.insertSublayer(layer, at: 0)')
    expect(native).toContain('view.addSubview(recordingBadge)')
    expect(native.indexOf('cameraSurface.layer.insertSublayer(layer, at: 0)')).toBeLessThan(native.indexOf('view.addSubview(recordingBadge)'))
    expect(native).toContain('"usesNativePreview": true')
  })
})
