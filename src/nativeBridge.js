const pending = new Map()
const eventListeners = new Set()
let sequence = 0

function bridgeError(code, message, details = {}) {
  const error = new Error(message || code || 'Native request failed')
  error.code = code || 'NATIVE_REQUEST_FAILED'
  Object.assign(error, details)
  return error
}

function browserFallback(service, method, payload) {
  if (service === 'Permission') return { granted: true, status: 'authorized', simulated: true }
  if (service === 'Liveness' && method === 'startFrontCapture') return { sessionID: `browser-liveness-${Date.now()}`, faceCount: 1, simulated: true }
  if (service === 'Liveness') return { released: true, simulated: true }
  if (service === 'VoiceRecorder' && method === 'start') return { assetID: `browser-voice-${Date.now()}`, started: true, simulated: true }
  if (service === 'VoiceRecorder' && method === 'stop') return { assetID: payload.assetID, durationMs: 7000, simulated: true }
  if (service === 'VoiceRecorder' && ['discard', 'publish'].includes(method)) return { assetID: payload.assetID, published: method === 'publish', simulated: true }
  if (service === 'VoicePlayback') return { state: method, simulated: true }
  if (service === 'Notification' && method === 'requestAuthorization') return { granted: false, status: 'denied', simulated: true }
  if (service === 'Notification') return { status: 'notDetermined', simulated: true }
  if (service === 'PhotoPicker') return { assetID: null, cancelled: true, simulated: true }
  if (service === 'AvatarPicker') return method === 'loadPreview' ? null : { cancelled: true, simulated: true }
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
  isNative: Boolean(window.webkit?.messageHandlers?.oivox),
  call: callNative,
  getLanguage: () => callNative('Language', 'get'),
  setLanguage: (language) => callNative('Language', 'set', { language }),
  requestPermission: (permission) => callNative('Permission', 'request', { permission }),
  getPermissionStatus: (permission) => callNative('Permission', 'getStatus', { permission }),
  startLiveness: (payload, options) => callNative('Liveness', 'startFrontCapture', payload, options),
  stopLiveness: (sessionID, options) => callNative('Liveness', 'stopCapture', { sessionID }, options),
  releaseLiveness: (sessionID, options) => callNative('Liveness', 'release', { sessionID }, options),
  startVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'start', { assetID, maxDurationMs: 7000 }, options),
  stopVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'stop', { assetID }, options),
  discardVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'discard', { assetID }, options),
  publishVoiceRecording: (assetID, options) => callNative('VoiceRecorder', 'publish', { assetID }, options),
  playVoice: (assetID, options) => callNative('VoicePlayback', 'play', { assetID }, options),
  pauseVoice: (assetID, options) => callNative('VoicePlayback', 'pause', { assetID }, options),
  requestNotifications: () => callNative('Notification', 'requestAuthorization'),
  getNotificationStatus: () => callNative('Notification', 'getAuthorizationStatus'),
  selectSupportScreenshot: () => callNative('PhotoPicker', 'selectSupportScreenshot'),
  chooseAvatar: (labels, options) => callNative('AvatarPicker', 'choose', labels, options),
  loadAvatarPreview: (localAssetID, options) => callNative('AvatarPicker', 'loadPreview', { localAssetID }, options),
  purchase: (productID) => callNative('Store', 'purchase', { productID }),
  restorePurchases: () => callNative('Store', 'restorePurchases'),
  reportUser: (userID, reason) => callNative('Safety', 'reportUser', { userID, reason }),
  blockUser: (userID) => callNative('Safety', 'blockUser', { userID }),
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
