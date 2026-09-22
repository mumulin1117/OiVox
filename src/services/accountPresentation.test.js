import { describe, expect, it } from 'vitest'
import portrait03 from '../assets/portraits/portrait-03.png'
import portrait09 from '../assets/portraits/portrait-09.png'
import { resolveAccountAvatar, resolveAccountCoinBalance } from './accountPresentation'

describe('account presentation model', () => {
  it('uses the authenticated profile avatar and never a discovery-user image', () => {
    expect(resolveAccountAvatar({ profile: { avatarKey: 'portrait-03' } })).toBe(portrait03)
    expect(resolveAccountAvatar({ profile: { clientAvatarPreview: 'data:image/png;base64,abc' } })).toBe('data:image/png;base64,abc')
    expect(resolveAccountAvatar({ profile: {} })).toBe(portrait09)
  })

  it('reads only a valid account wallet balance', () => {
    expect(resolveAccountCoinBalance({ wallet: { coinBalance: 120 } })).toBe(120)
    expect(resolveAccountCoinBalance({ wallet: { coinBalance: -1 } })).toBe(0)
    expect(resolveAccountCoinBalance({ wallet: { coinBalance: '120' } })).toBe(0)
    expect(resolveAccountCoinBalance(null)).toBe(0)
  })
})

