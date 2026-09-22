import { afterEach, describe, expect, it } from 'vitest'
import { installContentInteractionGuard, isEditableTarget } from './contentInteractionGuard'

afterEach(() => { document.body.innerHTML = '' })

function dispatch(target, type) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

describe('content interaction guard', () => {
  it('blocks selection, menus, and image dragging outside editable controls', () => {
    document.body.innerHTML = '<p><span>Ordinary text</span></p><button>Continue</button><img alt="">'
    const remove = installContentInteractionGuard(document)

    expect(dispatch(document.querySelector('span'), 'selectstart').defaultPrevented).toBe(true)
    expect(dispatch(document.querySelector('button'), 'contextmenu').defaultPrevented).toBe(true)
    expect(dispatch(document.querySelector('img'), 'dragstart').defaultPrevented).toBe(true)
    remove()
  })

  it('preserves selection and editing menus for inputs, textareas, and editable regions', () => {
    document.body.innerHTML = '<input type="text"><textarea></textarea><div contenteditable="true"><span>Edit me</span></div>'
    const remove = installContentInteractionGuard(document)

    for (const target of document.querySelectorAll('input, textarea, [contenteditable] span')) {
      expect(isEditableTarget(target)).toBe(true)
      expect(dispatch(target, 'selectstart').defaultPrevented).toBe(false)
      expect(dispatch(target, 'contextmenu').defaultPrevented).toBe(false)
      expect(dispatch(target, 'dragstart').defaultPrevented).toBe(false)
      expect(dispatch(target, 'copy').defaultPrevented).toBe(false)
      expect(dispatch(target, 'paste').defaultPrevented).toBe(false)
    }
    remove()
  })

  it('still blocks product images and explicitly non-editable islands inside an editor', () => {
    document.body.innerHTML = '<div contenteditable="true"><img alt=""><span contenteditable="false">Locked</span></div>'
    const remove = installContentInteractionGuard(document)
    expect(dispatch(document.querySelector('img'), 'contextmenu').defaultPrevented).toBe(true)
    expect(dispatch(document.querySelector('span'), 'selectstart').defaultPrevented).toBe(true)
    remove()
  })

  it('removes all listeners during app teardown', () => {
    document.body.innerHTML = '<p>Ordinary text</p>'
    const remove = installContentInteractionGuard(document)
    remove()
    expect(dispatch(document.querySelector('p'), 'contextmenu').defaultPrevented).toBe(false)
  })
})
