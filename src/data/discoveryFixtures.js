import { discoveryMediaPairs } from './discoveryMediaManifest'

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

const profiles = [
  ['Layla', ['ar', 'en'], ['poetry', 'design', 'travel'], 'I turn everyday moments into short stories.', 612, { viewerFollows: false, followsViewer: true, friendshipStatus: 'none', blockStatus: 'none' }, ['interests']],
  ['Mariam', ['ar', 'fr'], ['calligraphy', 'poetry', 'cooking'], 'I share recipes, poems, and family traditions.', 728, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }, ['likesCount']],
  ['Nour', ['ar', 'en'], ['books', 'architecture', 'coffee'], 'Small details make the best conversations.', 244, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Emre', ['tr', 'en'], ['football', 'history', 'street_food'], 'Ask me about Istanbul’s hidden streets.', 389, { viewerFollows: true, followsViewer: true, friendshipStatus: 'friends', blockStatus: 'none' }],
  ['Mert', ['tr', 'de'], ['photography', 'motorcycles', 'music'], 'Engines, cameras, and new conversations.', 165, { viewerFollows: true, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Kerem', ['tr', 'en'], ['architecture', 'coffee', 'city_walks'], 'I notice a new corner of the city every day.', 213, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Ari', ['he', 'en'], ['travel', 'books', 'technology'], 'Curious about how everyday life sounds elsewhere.', 274, { viewerFollows: false, followsViewer: true, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Noam', ['he', 'en'], ['seaside', 'music', 'photography'], 'Sea air, music, and imperfect photographs.', 142, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }, ['interests']],
  ['Eitan', ['he', 'en'], ['history', 'food', 'hiking'], 'A short voice can start a long story.', 198, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }, ['aboutMe']],
  ['Sophie', ['en', 'fr'], ['baking', 'books', 'travel'], 'Collecting small moments from rainy afternoons.', 186, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Oliver', ['en', 'de'], ['podcasts', 'cycling', 'cooking'], 'Always ready to exchange a new story.', 128, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Isla', ['en', 'fr'], ['art', 'gardening', 'movies'], 'Quiet gardens and very loud cinema.', 337, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'blocked_by_viewer' }, ['likesCount']],
  ['Julien', ['fr', 'en'], ['street_food', 'photography', 'travel'], 'I collect little sounds from Paris cafés.', 184, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Amélie', ['fr', 'en'], ['fashion', 'art', 'coffee'], 'Color, texture, and voices from Marseille.', 291, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Lukas', ['de', 'en'], ['cycling', 'technology', 'coffee'], 'Usually outside with a bicycle and a recorder.', 177, { viewerFollows: true, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Felix', ['de', 'en'], ['hiking', 'baking', 'vinyl'], 'I like quiet forests and very loud records.', 203, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'blocked_by_viewer' }, ['likesCount']],
  ['Haruto', ['ja', 'en'], ['markets', 'illustration', 'cooking'], 'Recording small joys from Tokyo.', 536, { viewerFollows: true, followsViewer: true, friendshipStatus: 'friends', blockStatus: 'none' }],
  ['Ren', ['ja', 'ko'], ['animation', 'desserts', 'travel'], 'Sending seven seconds from Kyoto.', 443, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Minjun', ['ko', 'en'], ['coffee', 'movies', 'city_walks'], 'Seoul at night is my favorite soundtrack.', 267, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
  ['Junho', ['ko', 'ja'], ['food', 'games', 'music'], 'Let’s trade favorite songs and snack stories.', 355, { viewerFollows: false, followsViewer: false, friendshipStatus: 'none', blockStatus: 'none' }],
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
    flagAsset: discoveryFlagAssets[media.countryCode],
    languages: spokenLanguages,
    spokenLanguages,
    preferredLanguage: spokenLanguages[0],
    interests,
    aboutMe,
    likesCount,
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
      durationMs: media.durationMs,
      transcript: media.transcript,
      transcriptLanguage: media.languageCode,
      source: 'local-dataset-fixture',
      mediaPairID: media.pairingID,
    }),
    avatarAsset: media.avatarAsset,
    moderationStatus: 'visible',
    isFixture: true,
  })]
})))

export const firstDayFreeDiscoveryIDs = Object.freeze([
  'user-media-14-france-2',
  'user-media-19-korea-1',
  'user-media-10-uk-1',
  'user-media-05-turkey-2',
  'user-media-08-israel-2',
  'user-media-02-arabic-2',
  'user-media-15-germany-1',
])
