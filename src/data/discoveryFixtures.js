import { discoveryMediaPairs } from './discoveryMediaManifest'
import { discoveryVoiceTranslationsByPairingID } from './discoveryVoiceTranslations'

const discoveryAsset = (folder, fileName) => `./assets/discovery/${folder}/${fileName}`

export const discoveryFlagAssets = Object.freeze({
  EG: discoveryAsset('flags', 'flag-eg.svg'),
  TR: discoveryAsset('flags', 'flag-tr.svg'),
  IL: discoveryAsset('flags', 'flag-il.svg'),
  GB: discoveryAsset('flags', 'flag-gb.svg'),
  FR: discoveryAsset('flags', 'flag-fr.svg'),
  DE: discoveryAsset('flags', 'flag-de.svg'),
  JP: discoveryAsset('flags', 'flag-jp.svg'),
  KR: discoveryAsset('flags', 'flag-kr.svg'),
})

const countryTimezones = Object.freeze({
  EG: 'UTC+2', TR: 'UTC+3', IL: 'UTC+3', GB: 'UTC+1', FR: 'UTC+2', DE: 'UTC+2', JP: 'UTC+9', KR: 'UTC+9',
})

const profiles = [
  ['Layla', ['ar', 'en'], ['poetry', 'design', 'travel'], 'I turn everyday moments into short stories.', 6, { viewerFollows: false, followsViewer: true, friendshipStatus: 'none', blockStatus: 'none' }, ['interests']],
  ['Mariam', ['ar', 'fr'], ['calligraphy', 'poetry', 'cooking'], 'I share recipes, poems, and family traditions.', 7, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }, ['likesCount']],
  ['Nour', ['ar', 'en'], ['books', 'architecture', 'coffee'], 'Small details make the best conversations.', 2, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Emre', ['tr', 'en'], ['football', 'history', 'street_food'], 'Ask me about Istanbul’s hidden streets.', 3, { viewerFollows: true, followsViewer: true, friendshipStatus: 'friends', blockStatus: 'none' }],
  ['Mert', ['tr', 'de'], ['photography', 'motorcycles', 'music'], 'Engines, cameras, and new conversations.', 1, { viewerFollows: true, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Kerem', ['tr', 'en'], ['architecture', 'coffee', 'city_walks'], 'I notice a new corner of the city every day.', 2, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Ari', ['he', 'en'], ['travel', 'books', 'technology'], 'Curious about how everyday life sounds elsewhere.', 4, { viewerFollows: false, followsViewer: true, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Noam', ['he', 'en'], ['seaside', 'music', 'photography'], 'Sea air, music, and imperfect photographs.', 1, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }, ['interests']],
  ['Eitan', ['he', 'en'], ['history', 'food', 'hiking'], 'A short voice can start a long story.', 2, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }, ['aboutMe']],
  ['Sophie', ['en', 'fr'], ['baking', 'books', 'travel'], 'Collecting small moments from rainy afternoons.', 8, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Oliver', ['en', 'de'], ['podcasts', 'cycling', 'cooking'], 'Always ready to exchange a new story.', 3, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Isla', ['en', 'fr'], ['art', 'gardening', 'movies'], 'Quiet gardens and very loud cinema.', 5, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'blocked_by_viewer' }, ['likesCount']],
  ['Julien', ['fr', 'en'], ['street_food', 'photography', 'travel'], 'I collect little sounds from Paris cafés.', 4, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Amélie', ['fr', 'en'], ['fashion', 'art', 'coffee'], 'Color, texture, and voices from Marseille.', 6, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Lukas', ['de', 'en'], ['cycling', 'technology', 'coffee'], 'Usually outside with a bicycle and a recorder.', 2, { viewerFollows: true, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Felix', ['de', 'en'], ['hiking', 'baking', 'vinyl'], 'I like quiet forests and very loud records.', 3, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'blocked_by_viewer' }, ['likesCount']],
  ['Haruto', ['ja', 'en'], ['markets', 'illustration', 'cooking'], 'Recording small joys from Tokyo.', 7, { viewerFollows: true, followsViewer: true, friendshipStatus: 'friends', blockStatus: 'none' }],
  ['Ren', ['ja', 'ko'], ['animation', 'desserts', 'travel'], 'Sending seven seconds from Kyoto.', 5, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Minjun', ['ko', 'en'], ['coffee', 'movies', 'city_walks'], 'Seoul at night is my favorite soundtrack.', 4, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Junho', ['ko', 'ja'], ['food', 'games', 'music'], 'Let’s trade favorite songs and snack stories.', 6, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
]

export const discoveryPeople = Object.freeze(Object.fromEntries(discoveryMediaPairs.map((media, index) => {
  const [displayName, spokenLanguages, interests, aboutMe, likesCount, relationship, hiddenFields = []] = profiles[index]
  const hidden = new Set(hiddenFields)
  const id = `user-${media.pairingID}`
  return [id, Object.freeze({
    id,
    mediaPairID: media.pairingID,
    displayName,
    countryCode: media.countryCode,
    countryLabel: media.countryLabel,
    timezone: countryTimezones[media.countryCode] || 'UTC',
    flagAsset: discoveryFlagAssets[media.countryCode],
    languages: spokenLanguages,
    spokenLanguages,
    preferredLanguage: spokenLanguages[0],
    interests,
    aboutMe,
    likesCount,
    heardCount: 28 + likesCount,
    onlineNow: index % 3 !== 2,
    verified: true,
    relationship,
    privacy: {
      country: true,
      voiceClip: true,
      aboutMe: !hidden.has('aboutMe'),
      languages: true,
      interests: !hidden.has('interests'),
      likesCount: !hidden.has('likesCount'),
    },
    voiceClip: Object.freeze({
      id: `voice-${media.pairingID}`,
      asset: media.voiceAsset,
      nativeAssetID: media.nativeVoiceAssetID,
      durationMs: media.durationMs,
      transcript: media.transcript,
      transcriptLanguage: media.languageCode,
      translations: discoveryVoiceTranslationsByPairingID[media.pairingID].translations,
      source: 'local-dataset-fixture',
      mediaPairID: media.pairingID,
    }),
    avatarAsset: media.avatarAsset,
    moderationStatus: 'visible',
    isFixture: true,
  })]
})))

export const discoveryDatasetSummary = Object.freeze({
  voiceCount: Object.keys(discoveryPeople).length,
  countryCount: new Set(Object.values(discoveryPeople).map((person) => person.countryCode).filter(Boolean)).size,
})

export const firstDayFreeDiscoveryIDs = Object.freeze([
  'user-media-14-france-2',
  'user-media-19-korea-1',
  'user-media-10-uk-1',
  'user-media-05-turkey-2',
  'user-media-08-israel-2',
  'user-media-02-arabic-2',
  'user-media-15-germany-1',
])
