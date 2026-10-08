const EDITABLE_SELECTOR = [
  'textarea',
  'input:not([type])',
  'input[type="text"]',
  'input[type="email"]',
  'input[type="password"]',
  'input[type="search"]',
  'input[type="url"]',
  'input[type="tel"]',
  'input[type="number"]',
  'input[type="date"]',
  'input[type="time"]',
  'input[type="datetime-local"]',
  'input[type="month"]',
  'input[type="week"]',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
].join(',')

const INTERACTIVE_SELECTOR = [
  EDITABLE_SELECTOR,
  'button',
  'a[href]',
  'label',
  'select',
  'option',
  '[role="button"]',
].join(',')

function asElement(target) {
  if (!target) return null
  return target.nodeType === 1 ? target : target.parentElement
}

export function isKeyboardEditable(target) {
  const element = asElement(target)
  if (!element) return false
  const editable = element.closest(EDITABLE_SELECTOR)
  if (!editable || editable.disabled || editable.readOnly) return false

  const explicitDisabledEditor = element.closest('[contenteditable="false"]')
  return !explicitDisabledEditor || !editable.contains(explicitDisabledEditor)
}

export function installKeyboardViewport(win = window, doc = document) {
  const root = doc.documentElement
  const viewport = win.visualViewport
  let frameID = 0
  let focusFrameID = 0
  let layoutViewportHeight = Math.max(1, win.innerHeight || root.clientHeight || viewport?.height || 1)

  const requestFrame = win.requestAnimationFrame?.bind(win) || ((callback) => win.setTimeout(callback, 0))
  const cancelFrame = win.cancelAnimationFrame?.bind(win) || win.clearTimeout.bind(win)

  function viewportMetrics() {
    return {
      height: Math.max(1, viewport?.height || win.innerHeight || root.clientHeight || 1),
      offsetTop: Math.max(0, viewport?.offsetTop || 0),
    }
  }

  function updateViewport() {
    frameID = 0
    const { height, offsetTop } = viewportMetrics()
    const activeElement = doc.activeElement
    const editorFocused = isKeyboardEditable(activeElement)
    const currentLayoutHeight = Math.max(1, win.innerHeight || root.clientHeight || height)
    const visibleBottom = height + offsetTop
    if (!editorFocused) layoutViewportHeight = Math.max(currentLayoutHeight, visibleBottom)
    else layoutViewportHeight = Math.max(layoutViewportHeight, currentLayoutHeight)
    root.style.setProperty('--app-height', `${Math.round(height)}px`)
    root.style.setProperty('--viewport-offset-top', `${Math.round(offsetTop)}px`)
    root.toggleAttribute('data-keyboard-visible', editorFocused && visibleBottom < layoutViewportHeight - 1)
    ensureFocusedVisible()
  }

  function scheduleViewportUpdate() {
    if (frameID) cancelFrame(frameID)
    frameID = requestFrame(updateViewport)
  }

  function ensureFocusedVisible() {
    const activeElement = doc.activeElement
    if (!isKeyboardEditable(activeElement) || typeof activeElement.getBoundingClientRect !== 'function') return

    const { height, offsetTop } = viewportMetrics()
    const bounds = activeElement.getBoundingClientRect()
    const margin = 12
    const visibleTop = offsetTop + margin
    const visibleBottom = offsetTop + height - margin
    if (bounds.top < visibleTop || bounds.bottom > visibleBottom) {
      activeElement.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
    }
  }

  function scheduleFocusedVisibility() {
    if (focusFrameID) cancelFrame(focusFrameID)
    focusFrameID = requestFrame(() => {
      focusFrameID = 0
      ensureFocusedVisible()
    })
  }

  function handleFocusIn(event) {
    if (!isKeyboardEditable(event.target)) return
    scheduleViewportUpdate()
    scheduleFocusedVisibility()
  }

  function handleFocusOut() {
    scheduleViewportUpdate()
  }

  function dismissKeyboardFromBlankArea(event) {
    const activeElement = doc.activeElement
    const target = asElement(event.target)
    if (!isKeyboardEditable(activeElement) || !target || target.closest(INTERACTIVE_SELECTOR)) return
    activeElement.blur()
  }

  updateViewport()
  viewport?.addEventListener('resize', scheduleViewportUpdate, { passive: true })
  viewport?.addEventListener('scroll', scheduleViewportUpdate, { passive: true })
  win.addEventListener('resize', scheduleViewportUpdate, { passive: true })
  doc.addEventListener('focusin', handleFocusIn)
  doc.addEventListener('focusout', handleFocusOut)
  doc.addEventListener('pointerdown', dismissKeyboardFromBlankArea, true)

  return () => {
    if (frameID) cancelFrame(frameID)
    if (focusFrameID) cancelFrame(focusFrameID)
    viewport?.removeEventListener('resize', scheduleViewportUpdate)
    viewport?.removeEventListener('scroll', scheduleViewportUpdate)
    win.removeEventListener('resize', scheduleViewportUpdate)
    doc.removeEventListener('focusin', handleFocusIn)
    doc.removeEventListener('focusout', handleFocusOut)
    doc.removeEventListener('pointerdown', dismissKeyboardFromBlankArea, true)
    root.removeAttribute('data-keyboard-visible')
  }
}
