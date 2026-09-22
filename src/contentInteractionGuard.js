const TEXT_INPUT_SELECTOR = [
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
].join(',')

function targetElement(target) {
  if (target instanceof Element) return target
  return target?.parentElement || null
}

export function isEditableTarget(target) {
  const element = targetElement(target)
  if (!element) return false
  const contentEditable = element.closest('[contenteditable]')
  if (contentEditable) return contentEditable.getAttribute('contenteditable') !== 'false'
  return Boolean(element.closest(TEXT_INPUT_SELECTOR))
}

export function installContentInteractionGuard(root = document) {
  const preventOutsideEditable = (event) => {
    const element = targetElement(event.target)
    if (element?.closest('img, svg, button') || !isEditableTarget(element)) event.preventDefault()
  }
  const preventProductDrag = (event) => {
    const element = targetElement(event.target)
    if (!isEditableTarget(element) || element?.closest('img, svg, button')) event.preventDefault()
  }

  root.addEventListener('contextmenu', preventOutsideEditable)
  root.addEventListener('selectstart', preventOutsideEditable)
  root.addEventListener('dragstart', preventProductDrag)

  return () => {
    root.removeEventListener('contextmenu', preventOutsideEditable)
    root.removeEventListener('selectstart', preventOutsideEditable)
    root.removeEventListener('dragstart', preventProductDrag)
  }
}
