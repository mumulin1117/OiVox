import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installKeyboardViewport, isKeyboardEditable } from './keyboardViewport'

function createViewport({ height = 500, offsetTop = 0 } = {}) {
  const listeners = new Map()
  return {
    height,
    offsetTop,
    addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    removeEventListener: vi.fn((type) => listeners.delete(type)),
    dispatch(type) { listeners.get(type)?.() },
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-keyboard-visible')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('keyboard viewport', () => {
  it('recognizes keyboard-editable controls without treating buttons or radio inputs as editors', () => {
    document.body.innerHTML = '<input id="text"><textarea id="area"></textarea><div id="editor" contenteditable="true"></div><input id="radio" type="radio"><button id="button"></button>'
    expect(isKeyboardEditable(document.querySelector('#text'))).toBe(true)
    expect(isKeyboardEditable(document.querySelector('#area'))).toBe(true)
    expect(isKeyboardEditable(document.querySelector('#editor'))).toBe(true)
    expect(isKeyboardEditable(document.querySelector('#radio'))).toBe(false)
    expect(isKeyboardEditable(document.querySelector('#button'))).toBe(false)
  })

  it('tracks visualViewport height and offset on resize and scroll', () => {
    const viewport = createViewport({ height: 500, offsetTop: 12 })
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callback(); return 1 })

    const remove = installKeyboardViewport(window, document)
    expect(document.documentElement.style.getPropertyValue('--app-height')).toBe('500px')
    expect(document.documentElement.style.getPropertyValue('--viewport-offset-top')).toBe('12px')

    viewport.height = 420
    viewport.offsetTop = 24
    viewport.dispatch('resize')
    expect(document.documentElement.style.getPropertyValue('--app-height')).toBe('420px')
    expect(document.documentElement.style.getPropertyValue('--viewport-offset-top')).toBe('24px')

    viewport.offsetTop = 30
    viewport.dispatch('scroll')
    expect(document.documentElement.style.getPropertyValue('--viewport-offset-top')).toBe('30px')
    remove()
  })

  it('keeps keyboard state when WKWebView shrinks innerHeight together with visualViewport', () => {
    document.body.innerHTML = '<input id="field">'
    const input = document.querySelector('#field')
    const viewport = createViewport({ height: 500 })
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
    vi.stubGlobal('innerHeight', 500)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callback(); return 1 })
    const remove = installKeyboardViewport(window, document)

    input.focus()
    window.innerHeight = 300
    viewport.height = 300
    viewport.dispatch('resize')
    expect(document.documentElement.hasAttribute('data-keyboard-visible')).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--app-height')).toBe('300px')

    window.innerHeight = 500
    viewport.height = 500
    viewport.dispatch('resize')
    expect(document.documentElement.hasAttribute('data-keyboard-visible')).toBe(false)
    remove()
  })

  it('anchors the auth submit area to the visual keyboard edge', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')
    expect(css).toContain(':root[data-keyboard-visible] .auth-submit-area')
    expect(css).toContain('position: sticky; z-index: 3; bottom: 0; padding-block: 8px;')
  })

  it('keeps the focused editor visible and dismisses it only from a blank area', () => {
    document.body.innerHTML = '<main><input id="field"><button id="send">Send</button><p id="blank">Blank</p></main>'
    const input = document.querySelector('#field')
    const send = document.querySelector('#send')
    const blank = document.querySelector('#blank')
    const viewport = createViewport({ height: 300 })
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callback(); return 1 })
    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({ top: 340, bottom: 384 })
    const scrollIntoView = vi.fn()
    input.scrollIntoView = scrollIntoView
    const blur = vi.spyOn(input, 'blur')
    const remove = installKeyboardViewport(window, document)

    input.focus()
    expect(scrollIntoView).toHaveBeenCalled()
    send.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(blur).not.toHaveBeenCalled()
    blank.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(blur).toHaveBeenCalledTimes(1)
    remove()
  })

  it('removes every installed listener during teardown', () => {
    const viewport = createViewport()
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
    const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
    const removeWindowListener = vi.spyOn(window, 'removeEventListener')
    const remove = installKeyboardViewport(window, document)
    remove()
    expect(viewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(viewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeWindowListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeDocumentListener).toHaveBeenCalledWith('pointerdown', expect.any(Function), true)
  })
})
