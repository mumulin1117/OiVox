import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { avatarFrameCatalog, avatarFrameContent, resolveAvatarFrameID } from '../data/avatarFrameCatalog'

describe('avatar frame selection contract', () => {
  const framePanel = readFileSync(resolve(process.cwd(), 'src/components/AvatarFramePanel.vue'), 'utf8')
  const editor = readFileSync(resolve(process.cwd(), 'src/components/EditProfilePanel.vue'), 'utf8')

  it('matches the nine HTML-reference frames and localizes every frame name', () => {
    expect(avatarFrameCatalog.map((item) => item.price)).toEqual([0, 30, 30, 50, 50, 50, 80, 80, 100])
    for (const locale of ['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko']) {
      expect(avatarFrameContent(locale).names).toHaveLength(9)
    }
    expect(resolveAvatarFrameID({ avatarFrameLabel: 'UAE' })).toBe('uae')
  })

  it('uses the existing account wallet and guards duplicate unlock taps', () => {
    expect(framePanel).toContain("createCoinWalletStore({ accountID: props.accountId")
    expect(framePanel).toContain("reason: 'avatar_frame_unlock'")
    expect(framePanel).toContain('if (busy.value || isCurrent.value) return')
    expect(framePanel).toContain("error.code === 'INSUFFICIENT_BALANCE'")
    expect(framePanel).not.toContain('Math.random')
    expect(framePanel).toContain("coinDialog.value = 'insufficient'")
    expect(framePanel).toContain("coinDialog.value = 'confirm'")
    expect(framePanel).toContain('<CoinSpendDialog')
    expect(framePanel.indexOf("coinDialog.value = 'confirm'")).toBeLessThan(framePanel.indexOf("reason: 'avatar_frame_unlock'"))
  })

  it('opens from the edit profile Change control and keeps selection local until Save', () => {
    expect(editor).toContain('@click="openFrames">{{ copy.changeFrame }}')
    expect(editor).toContain('<AvatarFramePanel')
    expect(editor).toContain('updateLocalAccountProfile(updatedUser')
    expect(editor).toContain('@open-store="openFrameStore"')
    expect(editor).toContain(':initial-selection-id="pendingFrameSelectionID"')
  })
})
