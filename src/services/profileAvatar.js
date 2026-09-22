import { nativeBridge } from '../nativeBridge'

const STABLE_AVATAR_ID = /^avatar_[A-Za-z0-9_-]{8,100}$/

export async function attachProfileAvatarPreview(user) {
  const localAssetID = user?.profile?.localAssetID
  if (!nativeBridge.isNative || !STABLE_AVATAR_ID.test(localAssetID || '')) return user
  try {
    const result = await nativeBridge.loadAvatarPreview(localAssetID)
    const previewDataURL = String(result?.previewDataURL || '')
    if (!previewDataURL.startsWith('data:image/')) return user
    return { ...user, profile: { ...user.profile, clientAvatarPreview: previewDataURL } }
  } catch {
    return user
  }
}
