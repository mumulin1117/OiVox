import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('social module accessibility contracts', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')
  const component = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')

  it('keeps reduced-motion support and safe-area padding', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('env(safe-area-inset-top)')
  })

  it('uses the existing bridge and contains no TabBar implementation', () => {
    expect(component).toContain("from '../nativeBridge'")
    expect(component).not.toMatch(/tab-?bar/i)
  })

  it('implements the Version 1 sticker profile with local assets and RTL mirroring', () => {
    expect(component).toContain('own-profile-collage')
    expect(component).toContain("profile-star.svg")
    expect(component).toContain('oivoxTestFixtures.profileSummary')
    expect(css).toContain('Blue Lake “My profile · sticker style”, Version 1')
    expect(css).toContain('[dir="rtl"] .own-profile-polaroid')
    expect(css).toContain('.own-profile-menu > button')
  })
})
