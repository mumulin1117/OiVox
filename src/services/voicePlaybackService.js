export function createVoicePlaybackService({ audioFactory = () => new Audio() } = {}) {
  let audio = null
  let currentID = null
  let listener = null
  let currentStatus = 'idle'

  function emit(status) {
    currentStatus = status
    listener?.({ id: currentID, status, currentTimeMs: Math.round((audio?.currentTime || 0) * 1000), durationMs: Math.round((audio?.duration || 0) * 1000) })
  }

  function release() {
    if (!audio) return
    audio.pause()
    audio.removeAttribute?.('src')
    audio.load?.()
    audio = null
    currentID = null
    currentStatus = 'idle'
  }

  async function play({ id, asset }, onState) {
    if (!id || !asset) throw new Error('VOICE_ASSET_REQUIRED')
    if (currentID === id && audio) {
      listener = onState
      if (!audio.paused) {
        audio.pause()
        emit('paused')
        return
      }
      if (currentStatus === 'ended' || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration)) audio.currentTime = 0
      try {
        await audio.play()
        emit('playing')
        return
      } catch (error) {
        emit('error')
        release()
        throw error
      }
    }
    release()
    listener = onState
    currentID = id
    audio = audioFactory()
    audio.preload = 'metadata'
    audio.src = asset
    const activeAudio = audio
    audio.addEventListener?.('timeupdate', () => {
      if (audio !== activeAudio) return
      emit(activeAudio.paused ? currentStatus : 'playing')
    })
    audio.addEventListener?.('ended', () => { if (audio === activeAudio) emit('ended') })
    audio.addEventListener?.('error', () => { if (audio === activeAudio) emit('error') })
    try {
      await audio.play()
      emit('playing')
    } catch (error) {
      emit('error')
      release()
      throw error
    }
  }

  return {
    play,
    stop() {
      if (audio) emit('stopped')
      release()
    },
    dispose() {
      release()
      listener = null
    },
    getCurrentID: () => currentID,
  }
}

export const voicePlaybackService = createVoicePlaybackService()
