import portrait02 from '../assets/portraits/portrait-02.png'
import portrait03 from '../assets/portraits/portrait-03.png'
import portrait04 from '../assets/portraits/portrait-04.png'
import portrait07 from '../assets/portraits/portrait-07.png'
import portrait09 from '../assets/portraits/portrait-09.png'

const presetAvatars = Object.freeze({
  'portrait-02': portrait02,
  'portrait-03': portrait03,
  'portrait-04': portrait04,
  'portrait-07': portrait07,
  'portrait-09': portrait09,
})

export function resolveAccountAvatar(user) {
  const preview = user?.profile?.clientAvatarPreview
  if (typeof preview === 'string' && preview.startsWith('data:image/')) return preview
  return presetAvatars[user?.profile?.avatarKey] || portrait09
}

export function resolveAccountCoinBalance(user) {
  const balance = user?.wallet?.coinBalance
  return Number.isSafeInteger(balance) && balance >= 0 ? balance : 0
}

