import { describe, expect, it } from 'vitest'
import { createVoicePlaybackService } from './voicePlaybackService'

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
})
