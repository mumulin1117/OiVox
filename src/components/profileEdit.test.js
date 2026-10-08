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
    expect(component).toContain("emit('saved', mergedUser)")
  })

  it('uses the existing avatar bridge with deduplication and keeps country read-only', () => {
    expect(component).toContain('nativeBridge.chooseAvatar')
    expect(component).toContain('if (avatarBusy.value || busy.value) return')
    expect(component).toContain('class="profile-edit-camera-button"')
    expect(component).toContain('@click="changePhoto"')
    expect(component).toContain('@click="openFrames">{{ copy.changeFrame }}</button>')
    expect(component).not.toContain('button class="secondary"')
    expect(css).toContain('.profile-edit-camera-button { position: absolute; z-index: 3; inset-inline-end: -3px; bottom: -3px; width: 30px; height: 30px;')
    expect(component).not.toContain('Math.random')
    expect(component).toContain('profile-edit-readonly-row')
    const countryRow = component.slice(component.indexOf('class="profile-edit-readonly-row country-row"'), component.indexOf('</div>', component.indexOf('class="profile-edit-readonly-row country-row"')))
    expect(countryRow).not.toContain('profileChevronIcon')
    expect(css).toContain('.profile-edit-readonly-row.country-row { grid-template-columns: minmax(0,1fr) auto; }')
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
