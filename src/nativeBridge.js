const pending = new Map()
const eventListeners = new Set()
let sequence = 0
let browserPlayback = null
let browserPlaybackTimer = 0

function emitBrowserPlayback(type, state) {
  if (!browserPlayback) return
  eventListeners.forEach((listener) => listener({
    type,
    assetID: browserPlayback.assetID,
    state,
    currentTimeMs: Math.round(browserPlayback.currentTimeMs),
    durationMs: browserPlayback.durationMs,
    simulated: true,
  }))
}

function stopBrowserPlaybackTimer() {
  window.clearInterval(browserPlaybackTimer)
  browserPlaybackTimer = 0
}

function startBrowserPlayback(payload) {
  const durationMs = Math.max(1, Number(payload.durationMs) || 7000)
  if (!browserPlayback || browserPlayback.assetID !== payload.assetID) {
    stopBrowserPlaybackTimer()
    browserPlayback = { assetID: payload.assetID, durationMs, currentTimeMs: 0, lastTick: Date.now() }
  }
  browserPlayback.durationMs = durationMs
  browserPlayback.lastTick = Date.now()
  stopBrowserPlaybackTimer()
  browserPlaybackTimer = window.setInterval(() => {
    if (!browserPlayback) return
    const now = Date.now()
    browserPlayback.currentTimeMs = Math.min(browserPlayback.durationMs, browserPlayback.currentTimeMs + now - browserPlayback.lastTick)
    browserPlayback.lastTick = now
    if (browserPlayback.currentTimeMs >= browserPlayback.durationMs) {
      stopBrowserPlaybackTimer()
      browserPlayback.currentTimeMs = 0
      emitBrowserPlayback('voice.playbackEnded', 'ended')
      return
    }
    emitBrowserPlayback('voice.playbackProgress', 'playing')
  }, 100)
  return { assetID: browserPlayback.assetID, state: 'playing', currentTimeMs: browserPlayback.currentTimeMs, durationMs: browserPlayback.durationMs, simulated: true }
}

function pauseBrowserPlayback() {
  stopBrowserPlaybackTimer()
  emitBrowserPlayback('voice.playbackProgress', 'paused')
  return { assetID: browserPlayback?.assetID, state: 'paused', currentTimeMs: browserPlayback?.currentTimeMs || 0, durationMs: browserPlayback?.durationMs || 0, simulated: true }
}

function stopBrowserPlayback() {
  stopBrowserPlaybackTimer()
  const result = { assetID: browserPlayback?.assetID, state: 'stopped', currentTimeMs: 0, durationMs: browserPlayback?.durationMs || 0, simulated: true }
  emitBrowserPlayback('voice.playbackStopped', 'stopped')
  browserPlayback = null
  return result
}

function bridgeError(code, message, details = {}) {
  const error = new Error(message || code || 'Native request failed')
  error.code = code || 'NATIVE_REQUEST_FAILED'
  Object.assign(error, details)
  return error
}

function hasNativeHandler() {
  return Boolean(
    window.__OIVOX_NATIVE_BRIDGE__?.available === true
    && window.webkit?.messageHandlers?.oivox,
  )
}

function browserFallback(service, method, payload) {
  if (service === 'Permission' && method === 'openSettings') return { opened: false, status: 'unsupported', simulated: true }
  if (service === 'Permission') return { granted: false, status: 'unsupported', simulated: true }
  if (service === 'Liveness' && method === 'startFrontCapture') return { sessionID: `browser-liveness-${Date.now()}`, faceCount: 1, simulated: true }
  if (service === 'Liveness') return { released: true, simulated: true }
  if (service === 'VoiceRecorder' && method === 'start') return { assetID: `browser-voice-${Date.now()}`, started: true, simulated: true }
  if (service === 'VoiceRecorder' && method === 'stop') return { assetID: payload.assetID, durationMs: 7000, simulated: true }
  if (service === 'VoiceRecorder' && ['discard', 'publish'].includes(method)) return { assetID: payload.assetID, published: method === 'publish', simulated: true }
  if (service === 'VoicePlayback' && method === 'play') return startBrowserPlayback(payload)
  if (service === 'VoicePlayback' && method === 'pause') return pauseBrowserPlayback()
  if (service === 'VoicePlayback' && method === 'stop') return stopBrowserPlayback()
  if (service === 'Notification' && method === 'requestAuthorization') return { granted: false, status: 'denied', simulated: true }
  if (service === 'Notification') return { status: 'notDetermined', simulated: true }
  if (service === 'PhotoPicker') return { assetID: null, cancelled: true, simulated: true }
  if (service === 'AvatarPicker') return method === 'loadPreview' ? null : { cancelled: true, simulated: true }
  if (service === 'Safety' && method === 'reportUser') return { reported: true, simulated: true }
  if (service === 'Safety' && method === 'blockUser') return { blocked: true, simulated: true }
  if (service === 'Safety' && method === 'unblockUser') return { blocked: false, simulated: true }
  return null
}

function callNative(service, method, payload = {}, { timeout = 15000, pageInstanceID = '' } = {}) {
  const handler = window.webkit?.messageHandlers?.oivox
  if (!handler) return Promise.resolve(browserFallback(service, method, payload))
  const id = `oivox-${Date.now()}-${++sequence}`
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (!pending.has(id)) return
      pending.delete(id)
      reject(bridgeError('TIMEOUT', `Native bridge timeout: ${service}.${method}`, { recoverable: true }))
    }, timeout)
    pending.set(id, { resolve, reject, timer, pageInstanceID })
    handler.postMessage({ id, protocolVersion: 1, service, method, payload, pageInstanceID })
  })
}

window.OiVoxNative = {
  resolve(id, result) {
    const item = pending.get(id)
    if (!item) return
    pending.delete(id)
    window.clearTimeout(item.timer)
    item.resolve(result)
  },
  reject(id, nativeError) {
    const item = pending.get(id)
    if (!item) return
    pending.delete(id)
    window.clearTimeout(item.timer)
    const value = typeof nativeError === 'object' && nativeError ? nativeError : { message: nativeError }
    item.reject(bridgeError(value.code, value.message, value))
  },
  emit(event) {
    eventListeners.forEach((listener) => listener(event))
  },
  languageChanged(locale) {
    window.dispatchEvent(new CustomEvent('oivox:native-language', { detail: locale }))
  },
}

export const nativeBridge = {
  get isNative() {
    return hasNativeHandler()
  },
  call: callNative,
  getLanguage: (options) => callNative('Language', 'get', {}, options),
  setLanguage: (language) => callNative('Language', 'set', { language }),
  // System permission sheets can keep the WebView suspended while the user
  // decides. Keep this request alive longer than the general bridge timeout so
  // the chat composer does not surface a timeout (or leave the page in a
  // broken state) when the microphone prompt is shown for the first time.
  requestPermission: (permission, options = {}) => callNative(
    'Permission',
    'request',
    { permission },
    { ...options, timeout: options.timeout ?? 60_000 },
  ),
  getPermissionStatus: (permission, options) => callNative('Permission', 'getStatus', { permission }, options),
  openAppSettings: (options) => callNative('Permission', 'openSettings', {}, options),
  startLiveness: (payload, options) => callNative('Liveness', 'startFrontCapture', payload, options),
  stopLiveness: (sessionID, options) => callNative('Liveness', 'stopCapture', { sessionID }, options),
  releaseLiveness: (sessionID, options) => callNative('Liveness', 'release', { sessionID }, options),
  startVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'start', { assetID, maxDurationMs: 7000 }, options),
  stopVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'stop', { assetID }, options),
  discardVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'discard', { assetID }, options),
  publishVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'publish', { assetID }, options),
  playVoice: (assetID, options = {}) => callNative('VoicePlayback', 'play', { assetID, durationMs: options.durationMs }, options),
  pauseVoice: (assetID, options) => callNative('VoicePlayback', 'pause', { assetID }, options),
  stopVoice: (assetID, options) => callNative('VoicePlayback', 'stop', { assetID }, options),
  requestNotifications: (options) => callNative('Notification', 'requestAuthorization', {}, options),
  getNotificationStatus: (options) => callNative('Notification', 'getAuthorizationStatus', {}, options),
  selectSupportScreenshot: (options) => callNative('PhotoPicker', 'selectSupportScreenshot', {}, options),
  chooseAvatar: (labels, options) => callNative('AvatarPicker', 'choose', labels, options),
  loadAvatarPreview: (localAssetID, options) => callNative('AvatarPicker', 'loadPreview', { localAssetID }, options),
  purchase: (productID, options) => callNative('Store', 'purchase', { productID }, options),
  listProducts: (productIDs, options) => callNative('Store', 'listProducts', { productIDs }, options),
  restorePurchases: () => callNative('Store', 'restorePurchases'),
  translateText: (text, sourceLanguage, targetLanguage, options) => callNative('Translation', 'translateText', { text, sourceLanguage, targetLanguage }, options),
  reportUser: (userID, reason, context = {}, options) => callNative('Safety', 'reportUser', { ...context, userID, reason }, options),
  blockUser: (userID, operationID = '', options) => callNative('Safety', 'blockUser', { userID, ...(operationID ? { operationID } : {}) }, options),
  unblockUser: (userID, operationID = '', options) => callNative('Safety', 'unblockUser', { userID, ...(operationID ? { operationID } : {}) }, options),
  onEvent(listener) {
    eventListeners.add(listener)
    return () => eventListeners.delete(listener)
  },
  cancelPage(pageInstanceID) {
    for (const [id, item] of pending) {
      if (item.pageInstanceID !== pageInstanceID) continue
      pending.delete(id)
      window.clearTimeout(item.timer)
      item.reject(bridgeError('PAGE_DISPOSED', 'The page was closed.', { recoverable: false }))
    }
  },
}
