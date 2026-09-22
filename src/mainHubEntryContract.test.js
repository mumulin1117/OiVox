import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('main hub entry animation hand-off', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')

  it('keeps the app behind its loading surface until session restoration is resolved', () => {
    expect(component).toContain('const restoring = ref(true)')
    expect(component).toContain('finally {\n    restoring.value = false')
  })

  it('requests the intro for restored sessions and explicit authentication', () => {
    expect(component.match(/mainHubIntroRequested\.value = true/g)).toHaveLength(2)
    expect(component).toContain(':play-intro="mainHubIntroRequested"')
    expect(component).toContain('@intro-complete="completeMainHubIntro"')
  })

  it('does not replay the intro after returning from language settings', () => {
    expect(component).toContain('function completeMainHubIntro()')
    expect(component).toContain('mainHubIntroRequested.value = false')
    expect(component).toContain('@back="closeLanguage"')
  })
})
