import { describe, expect, it } from 'vitest'
import { createVoicePlaybackService, voicePlaybackProgress, voicePlaybackRemainingMs } from './voicePlaybackService'

function fakeAudio(instances) {
  const listeners = {}
  const audio = {
    paused: true, currentTime: 0, duration: 3.2, src: '',
    addEventListener: (name, listener) => { listeners[name] = listener },
    play: async () => { audio.paused = false },
    pause: () => { audio.paused = true; audio.pauseCalls += 1 },
    load: () => { audio.loadCalls += 1 },
    removeAttribute: () => {},
    pauseCalls: 0, loadCalls: 0, listeners,
  }
  instances.push(audio)
  return audio
}

describe('voice playback service', () => {
  it('allows only one voice and releases the previous audio', async () => {
    const instances = []
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play({ id: 'one', asset: 'one.wav' }, () => {})
    await service.play({ id: 'two', asset: 'two.wav' }, () => {})
    expect(instances).toHaveLength(2)
    expect(instances[0].pauseCalls).toBe(1)
    expect(instances[0].loadCalls).toBe(1)
    expect(service.getCurrentID()).toBe('two')
    service.dispose()
    expect(service.getCurrentID()).toBe(null)
  })

  it('toggles the current playing clip to paused', async () => {
    const instances = []
    const states = []
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    expect(states).toContain('paused')
  })

  it('resumes a paused clip without creating a second audio instance', async () => {
    const instances = []
    const states = []
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    instances[0].currentTime = 1.4
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    expect(instances).toHaveLength(1)
    expect(instances[0].currentTime).toBe(1.4)
    expect(states.at(-1)).toBe('playing')
  })

  it('does not report playing when a delayed timeupdate arrives while paused', async () => {
    const instances = []
    const states = []
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    await service.play({ id: 'one', asset: 'one.wav' }, (state) => states.push(state.status))
    instances[0].listeners.timeupdate()
    expect(states.at(-1)).toBe('paused')
  })

  it('ignores media events that arrive after the audio instance is released', async () => {
    const instances = []
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play({ id: 'one', asset: 'one.wav' }, () => {})
    const releasedAudio = instances[0]
    service.stop()
    expect(() => releasedAudio.listeners.timeupdate()).not.toThrow()
    expect(() => releasedAudio.listeners.ended()).not.toThrow()
    expect(() => releasedAudio.listeners.error()).not.toThrow()
    expect(service.getCurrentID()).toBe(null)
  })

  it('freezes time and waveform progress while paused', async () => {
    const instances = []
    const states = []
    const clip = { id: 'one', asset: 'one.wav', durationMs: 3200 }
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play(clip, (state) => states.push(state))
    instances[0].currentTime = 1.25
    instances[0].listeners.timeupdate()
    await service.play(clip, (state) => states.push(state))
    instances[0].listeners.timeupdate()
    const paused = states.at(-1)
    expect(paused.status).toBe('paused')
    expect(paused.currentTimeMs).toBe(1250)
    expect(voicePlaybackProgress(paused, clip)).toBeCloseTo(1.25 / 3.2)
    expect(voicePlaybackRemainingMs(paused, clip)).toBe(1950)
  })

  it('returns ended clips to zero progress and displays the full duration', async () => {
    const instances = []
    const states = []
    const clip = { id: 'one', asset: 'one.wav', durationMs: 3200 }
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances) })
    await service.play(clip, (state) => states.push(state))
    instances[0].currentTime = 3.2
    instances[0].listeners.ended()
    const ended = states.at(-1)
    expect(ended).toMatchObject({ status: 'ended', currentTimeMs: 0, durationMs: 3200 })
    expect(voicePlaybackProgress(ended, clip)).toBe(0)
    expect(voicePlaybackRemainingMs(ended, clip)).toBe(3200)
  })

  it('uses the same pause and ended contract for native voice assets', async () => {
    let nativeListener = null
    const nativeAdapter = {
      isNative: true,
      onEvent(listener) { nativeListener = listener; return () => { nativeListener = null } },
      playVoice: async () => ({ currentTimeMs: 0, durationMs: 2800 }),
      pauseVoice: async () => ({ currentTimeMs: 900, durationMs: 2800 }),
      stopVoice: async () => ({ currentTimeMs: 0, durationMs: 2800 }),
    }
    const states = []
    const clip = { id: 'native-one', nativeAssetID: 'voice_native_one', durationMs: 2800 }
    const service = createVoicePlaybackService({ nativeAdapter })
    await service.play(clip, (state) => states.push(state))
    nativeListener({ type: 'voice.playbackProgress', assetID: 'voice_native_one', state: 'playing', currentTimeMs: 900, durationMs: 2800 })
    await service.play(clip, (state) => states.push(state))
    expect(states.at(-1)).toMatchObject({ status: 'paused', currentTimeMs: 900 })
    nativeListener({ type: 'voice.playbackEnded', assetID: 'voice_native_one', currentTimeMs: 2800, durationMs: 2800 })
    expect(states.at(-1)).toMatchObject({ status: 'ended', currentTimeMs: 0, durationMs: 2800 })
    expect(voicePlaybackRemainingMs(states.at(-1), clip)).toBe(2800)
  })

  it('plays legacy self-recordings that only persisted localAssetID', async () => {
    const nativeCalls = []
    const nativeAdapter = {
      isNative: true,
      onEvent: () => () => {},
      playVoice: async (assetID) => { nativeCalls.push(assetID); return { currentTimeMs: 0, durationMs: 6100 } },
      stopVoice: async () => ({}),
    }
    const service = createVoicePlaybackService({ nativeAdapter })

    await service.play({ id: 'clip-legacy', localAssetID: 'profile_voice_legacy1', durationMs: 6100 }, () => {})

    expect(nativeCalls).toEqual(['profile_voice_legacy1'])
    expect(service.getCurrentID()).toBe('clip-legacy')
  })

  it('prefers a bundled native asset in WKWebView while browsers keep the local URL', async () => {
    const instances = []
    const nativeCalls = []
    const nativeAdapter = {
      isNative: true,
      onEvent: () => () => {},
      playVoice: async (assetID) => { nativeCalls.push(assetID); return { currentTimeMs: 0, durationMs: 6900 } },
      stopVoice: async () => ({}),
    }
    const service = createVoicePlaybackService({ audioFactory: () => fakeAudio(instances), nativeAdapter })
    await service.play({ id: 'fixture-one', asset: './fixture.wav', nativeAssetID: 'voice-14-france-2', durationMs: 6900 }, () => {})
    expect(nativeCalls).toEqual(['voice-14-france-2'])
    expect(instances).toHaveLength(0)
  })
})
