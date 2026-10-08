export function toPublicSocialProfile(person) {
  if (!person) return null
  const output = {
    id: person.id,
    displayName: person.displayName,
    avatarAsset: person.avatarAsset,
    relationship: person.relationship,
    verified: person.verified === true,
    heardCount: Number.isFinite(person.heardCount) ? person.heardCount : 0,
    isFixture: person.isFixture,
  }
  if (person.privacy?.country) Object.assign(output, {
    countryCode: person.countryCode,
    countryLabel: person.countryLabel,
    timezone: person.timezone,
    flagAsset: person.flagAsset,
  })
  if (person.privacy?.voiceClip) output.voiceClip = person.voiceClip
  if (person.privacy?.aboutMe) output.aboutMe = person.aboutMe
  if (person.privacy?.languages) output.languages = person.languages
  if (person.privacy?.interests) output.interests = person.interests
  if (person.privacy?.likesCount) output.likesCount = person.likesCount
  return Object.freeze(output)
}
