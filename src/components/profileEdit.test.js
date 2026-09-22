import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Blue Lake profile editor contract', () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/EditProfilePanel.vue'), 'utf8')
  const socialModule = readFileSync(resolve(process.cwd(), 'src/components/SocialModule.vue'), 'utf8')
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

  it('routes the profile edit button to a real editor and propagates successful profile data', () => {
    expect(socialModule).toContain("screen.value = 'edit-profile'")
    expect(socialModule).toContain("emit('profile-updated', user)")
    expect(component).toContain('oivoxAccountApi.updateProfile(patch)')
    expect(component).toContain("emit('saved', updatedUser)")
  })

  it('uses the existing avatar bridge with deduplication and keeps country read-only', () => {
    expect(component).toContain('nativeBridge.chooseAvatar')
    expect(component).toContain('if (avatarBusy.value || busy.value) return')
    expect(component).not.toContain('Math.random')
    expect(component).toContain('profile-edit-readonly-row')
  })

  it('keeps a single scroll container, safe areas, RTL mirroring, and no TabBar', () => {
    expect(css).toContain('Blue Lake “Edit profile”, Version 1')
    expect(css).toContain('.profile-edit-scroll')
    expect(css).toContain('env(safe-area-inset-top)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('[dir="rtl"] .profile-edit-readonly-row > img')
    expect(component).not.toMatch(/tab-?bar/i)
  })
})
