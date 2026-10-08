import { nativeBridge } from '../nativeBridge'

export const EMPTY_VOICE_PLAYBACK_STATE = Object.freeze({ id: null, status: 'idle', currentTimeMs: 0, durationMs: 0 })

function finiteMilliseconds(value, fallback = 0) {
  const milliseconds = Number(value)
  return Number.isFinite(milliseconds) && milliseconds > 0 ? Math.round(milliseconds) : fallback
}

export function voicePlaybackProgress(state, clip) {
  if (!clip?.id || state?.id !== clip.id) return 0
  const durationMs = finiteMilliseconds(state.durationMs, finiteMilliseconds(clip.durationMs))
  if (!durationMs || ['idle', 'stopped', 'ended', 'error'].includes(state.status)) return 0
  return Math.min(1, Math.max(0, Number(state.currentTimeMs || 0) / durationMs))
}

export function voicePlaybackRemainingMs(state, clip) {
  const durationMs = finiteMilliseconds(clip?.durationMs, finiteMilliseconds(state?.durationMs))
  if (!durationMs || state?.id !== clip?.id || ['idle', 'stopped', 'ended', 'error'].includes(state.status)) return durationMs
  return Math.max(0, durationMs - Math.min(durationMs, Math.max(0, Number(state.currentTimeMs || 0))))
}

export function formatVoiceDuration(durationMs) {
  const seconds = Math.max(0, Math.ceil(Number(durationMs || 0) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function createVoicePlaybackService({ audioFactory = () => new Audio(), nativeAdapter = nativeBridge } = {}) {
  let audio = null
  let currentID = null
  let nativeAssetID = null
  let listener = null
  let currentStatus = 'idle'
  let declaredDurationMs = 0
  let currentTimeMs = 0
  let removeNativeListener = null

  function resolvedDurationMs() {
    return finiteMilliseconds(audio?.duration ? audio.duration * 1000 : 0, declaredDurationMs)
  }

  function emit(status, overrides = {}) {
    currentStatus = status
    const durationMs = finiteMilliseconds(overrides.durationMs, resolvedDurationMs())
    const rawCurrentTimeMs = Number.isFinite(Number(overrides.currentTimeMs))
      ? Math.round(Number(overrides.currentTimeMs))
      : Math.round((audio?.currentTime || 0) * 1000)
    currentTimeMs = ['ended', 'stopped'].includes(status) ? 0 : Math.min(durationMs || rawCurrentTimeMs, Math.max(0, rawCurrentTimeMs))
    listener?.({ id: currentID, status, currentTimeMs, durationMs })
  }

  function ensureNativeEvents() {
    if (removeNativeListener || typeof nativeAdapter?.onEvent !== 'function') return
    removeNativeListener = nativeAdapter.onEvent((event) => {
      if (!nativeAssetID || event?.assetID !== nativeAssetID) return
      if (event.type === 'voice.playbackProgress') emit(event.state === 'paused' ? 'paused' : 'playing', event)
      else if (event.type === 'voice.playbackEnded') emit('ended', { ...event, currentTimeMs: 0 })
      else if (event.type === 'voice.playbackStopped') emit('stopped', { ...event, currentTimeMs: 0 })
    })
  }

  function release({ notify = false, stopNative = true } = {}) {
    if (audio) {
      audio.pause()
      audio.removeAttribute?.('src')
      audio.load?.()
    }
    if (stopNative && nativeAssetID) nativeAdapter?.stopVoice?.(nativeAssetID).catch?.(() => {})
    if (notify && currentID) emit('stopped', { currentTimeMs: 0, durationMs: declaredDurationMs })
    audio = null
    currentID = null
    nativeAssetID = null
    currentStatus = 'idle'
    declaredDurationMs = 0
    currentTimeMs = 0
  }

  async function playNative(clip) {
    ensureNativeEvents()
    if (currentID === clip.id && nativeAssetID === clip.nativeAssetID) {
      if (currentStatus === 'playing') {
        const result = await nativeAdapter.pauseVoice(nativeAssetID)
        emit('paused', { currentTimeMs: result?.currentTimeMs ?? currentTimeMs, durationMs: result?.durationMs ?? declaredDurationMs })
        return
      }
      if (currentStatus === 'ended') currentTimeMs = 0
      const result = await nativeAdapter.playVoice(nativeAssetID, { durationMs: declaredDurationMs })
      emit('playing', { currentTimeMs: result?.currentTimeMs ?? currentTimeMs, durationMs: result?.durationMs ?? declaredDurationMs })
      return
    }

    const previousNativeAssetID = nativeAssetID
    release({ notify: true, stopNative: false })
    if (previousNativeAssetID) await nativeAdapter.stopVoice(previousNativeAssetID).catch(() => {})
    currentID = clip.id
    nativeAssetID = clip.nativeAssetID
    declaredDurationMs = finiteMilliseconds(clip.durationMs)
    const result = await nativeAdapter.playVoice(nativeAssetID, { durationMs: declaredDurationMs })
    emit('playing', { currentTimeMs: result?.currentTimeMs ?? 0, durationMs: result?.durationMs ?? declaredDurationMs })
  }

  async function playBrowserAudio(clip) {
    if (currentID === clip.id && audio) {
      if (!audio.paused) {
        audio.pause()
        emit('paused', { currentTimeMs: audio.currentTime * 1000 })
        return
      }
      if (currentStatus === 'ended' || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration)) audio.currentTime = 0
      await audio.play()
      emit('playing')
      return
    }

    const previousNativeAssetID = nativeAssetID
    release({ notify: true, stopNative: false })
    if (previousNativeAssetID) await nativeAdapter.stopVoice(previousNativeAssetID).catch(() => {})
    currentID = clip.id
    declaredDurationMs = finiteMilliseconds(clip.durationMs)
    audio = audioFactory()
    audio.preload = 'metadata'
    audio.playsInline = true
    audio.src = typeof document === 'undefined' ? clip.asset : new URL(clip.asset, document.baseURI).href
    const activeAudio = audio
    audio.addEventListener?.('loadedmetadata', () => {
      if (audio === activeAudio) emit(currentStatus, { durationMs: activeAudio.duration * 1000 })
    })
    audio.addEventListener?.('timeupdate', () => {
      if (audio === activeAudio) emit(activeAudio.paused ? currentStatus : 'playing')
    })
    audio.addEventListener?.('ended', () => {
      if (audio !== activeAudio) return
      activeAudio.currentTime = 0
      emit('ended', { currentTimeMs: 0 })
    })
    audio.addEventListener?.('error', () => { if (audio === activeAudio) emit('error') })
    await audio.play()
    emit('playing')
  }

  async function play(clip, onState) {
    const playableClip = clip?.localAssetID && !clip.nativeAssetID
      ? { ...clip, nativeAssetID: clip.localAssetID }
      : clip
    if (!playableClip?.id || (!playableClip.asset && !playableClip.nativeAssetID)) throw new Error('VOICE_ASSET_REQUIRED')
    listener = onState
    try {
      if (playableClip.nativeAssetID && (!playableClip.asset || nativeAdapter?.isNative)) await playNative(playableClip)
      else await playBrowserAudio(playableClip)
    } catch (error) {
      emit('error')
      release()
      throw error
    }
  }

  return {
    play,
    stop() { release({ notify: true }) },
    dispose() {
      release()
      removeNativeListener?.()
      removeNativeListener = null
      listener = null
    },
    getCurrentID: () => currentID,
  }
}

export const voicePlaybackService = createVoicePlaybackService()
