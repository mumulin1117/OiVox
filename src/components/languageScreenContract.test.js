import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const component = readFileSync(resolve(process.cwd(), 'src/components/LanguageScreen.vue'), 'utf8')
const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

describe('language screen contract', () => {
  it('uses local design assets instead of emoji or a text checkmark', () => {
    expect(component).toContain("import checkIcon from '../assets/icons/check-large.svg'")
    expect(component).toContain("ar: './assets/discovery/flags/flag-ae.svg'")
    expect(component).not.toContain('>✓<')
    expect(component).not.toContain('option.flag')
  })

  it('keeps selection separate from the persisted save action', () => {
    expect(component).toContain('@click="selectLanguage(option.code)"')
    expect(component).toContain('await setLocale(selected.value)')
    expect(component).toContain(':aria-pressed="selected === option.code"')
    expect(component).toContain(':disabled="saving"')
  })

  it('matches the 375 point Lanhu measurements and remains scrollable on short phones', () => {
    expect(css).toContain('.language-option { width: 100%; height: 58px;')
    expect(css).toContain('.translate-card { width: 100%; height: 58px;')
    expect(css).toContain('.language-save-button { width: 100%; height: 51px;')
    expect(css).toContain('.language-scroll { flex: 1; min-height: 0;')
    expect(css).toContain('overflow-y: auto;')
  })
})
