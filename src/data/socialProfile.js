export function toPublicSocialProfile(person) {
  if (!person) return null
  const output = {
    id: person.id,
    displayName: person.displayName,
    avatarAsset: person.avatarAsset,
    relationship: person.relationship,
    isFixture: person.isFixture,
  }
  if (person.privacy?.country) Object.assign(output, { countryCode: person.countryCode, flagAsset: person.flagAsset })
  if (person.privacy?.voiceClip) output.voiceClip = person.voiceClip
  if (person.privacy?.aboutMe) output.aboutMe = person.aboutMe
  if (person.privacy?.languages) output.languages = person.languages
  if (person.privacy?.interests) output.interests = person.interests
  if (person.privacy?.likesCount) output.likesCount = person.likesCount
  return Object.freeze(output)
}
