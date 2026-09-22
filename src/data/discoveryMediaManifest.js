const discoveryAsset = (folder, fileName) => `./assets/discovery/${folder}/${fileName}`

export const DISCOVERY_MEDIA_VERSION = 'avatar-audio-v3'

const rows = [
  ['media-01-arabic-1', 'EG', 'Egypt', 'ar', 'female', 'jpg', 5860, 'وقالت الشرطة إن الجثة بدت وكأنها كانت هناك منذ يوم تقريباً.', 'google/fleurs', 'ar_eg', 'validation', 14],
  ['media-02-arabic-2', 'EG', 'Egypt', 'ar', 'female', 'jpg', 6960, 'في البداية، أثرت الثقافة البيزنطية في الشرق على الملابس تأثيرًا شديدًا.', 'google/fleurs', 'ar_eg', 'validation', 29],
  ['media-03-arabic-3', 'EG', 'Egypt', 'ar', 'female', 'jpg', 6400, 'رحّب الرئيسُ الأمريكيُّ جورج دبليو بوش بالإعلان.', 'google/fleurs', 'ar_eg', 'validation', 35],
  ['media-04-turkey-1', 'TR', 'Türkiye', 'tr', 'male', 'jpg', 6720, 'Araba çarptığında evde üç kişi vardı, ancak hiçbiri zarar görmedi.', 'google/fleurs', 'tr_tr', 'validation', 34],
  ['media-05-turkey-2', 'TR', 'Türkiye', 'tr', 'male', 'jpg', 6240, 'Bazı festivaller küçük çocuklu aileler için özel kamp alanlarına sahiptir.', 'google/fleurs', 'tr_tr', 'validation', 40],
  ['media-06-turkey-3', 'TR', 'Türkiye', 'tr', 'male', 'jpg', 6660, "Doğu Afrika Adaları, Hint Okyanusu'nda, doğu Afrika açıklarında yer alır.", 'google/fleurs', 'tr_tr', 'validation', 76],
  ['media-07-israel-1', 'IL', 'Israel', 'he', 'male', 'jpg', 5160, 'אפשרות שנהיית יותר ויותר פופולרית לאלו שמתכננים שנת חופש היא לטייל וללמוד.', 'google/fleurs', 'he_il', 'validation', 3],
  ['media-08-israel-2', 'IL', 'Israel', 'he', 'male', 'jpg', 6480, 'תוצאות ניתוח הגרף יפורסמו באתר אינטרנט ציבורי.', 'google/fleurs', 'he_il', 'validation', 4],
  ['media-09-israel-3', 'IL', 'Israel', 'he', 'male', 'jpg', 5160, 'הוצאות המלחמה של האימפריאליזם האמריקני על כיבוש הפיליפינים שולמו על-ידי העם הפיליפיני עצמו.', 'google/fleurs', 'he_il', 'validation', 6],
  ['media-10-uk-1', 'GB', 'United Kingdom', 'en', 'female', 'jpg', 6323, 'She can scoop these things into three red bags, and we will go meet her Wednesday at the train station.', 'sanchit-gandhi/vctk', 'default', 'train', 8, 'p225'],
  ['media-11-uk-2', 'GB', 'United Kingdom', 'en', 'male', 'jpg', 6094, 'We also need a small plastic snake and a big toy frog for the kids.', 'sanchit-gandhi/vctk', 'default', 'train', 468, 'p226'],
  ['media-12-uk-3', 'GB', 'United Kingdom', 'en', 'female', 'jpg', 5231, 'When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow.', 'sanchit-gandhi/vctk', 'default', 'train', 2694, 'p229'],
  ['media-13-france-1', 'FR', 'France', 'fr', 'male', 'jpg', 6000, "Il n'avait pas non plus le pouvoir de déroger aux lois fiscales ni à celles sur les droits de douane entre les États.", 'google/fleurs', 'fr_fr', 'validation', 1],
  ['media-14-france-2', 'FR', 'France', 'fr', 'female', 'jpg', 6900, "Noël est l'une des fêtes les plus importantes de la chrétienté, elle célèbre la naissance de Jésus.", 'google/fleurs', 'fr_fr', 'validation', 7],
  ['media-15-germany-1', 'DE', 'Germany', 'de', 'male', 'jpg', 6660, 'Handgefertigte Produkte könnten als „antik“ bezeichnet werden, obwohl sie jünger als ähnliche Erzeugnisse aus Massenproduktion sind.', 'google/fleurs', 'de_de', 'validation', 5],
  ['media-16-germany-2', 'DE', 'Germany', 'de', 'male', 'jpg', 5400, 'Das erschien mir nicht sinnvoll; es war ganz gewiss nicht fair.', 'google/fleurs', 'de_de', 'validation', 6],
  ['media-17-japan-1', 'JP', 'Japan', 'ja', 'male', 'jpg', 6600, '彼はWi-Fiで鳴るドアベルを作ったそうです。', 'google/fleurs', 'ja_jp', 'validation', 118],
  ['media-18-japan-2', 'JP', 'Japan', 'ja', 'male', 'jpg', 6720, 'モルドバの主な宗教は正統派キリスト教です。', 'google/fleurs', 'ja_jp', 'validation', 140],
  ['media-19-korea-1', 'KR', 'South Korea', 'ko', 'male', 'jpg', 6720, '필리핀 정복에 사용된 미국 제국주의의 전쟁 비용은 필리핀인 자신들에 의해 지급되었다.', 'google/fleurs', 'ko_kr', 'validation', 37],
  ['media-20-korea-2', 'KR', 'South Korea', 'ko', 'male', 'png', 6300, '스페인 사람들이 3세기 동안 지속된 식민지 시대를 시작했다.', 'google/fleurs', 'ko_kr', 'validation', 59],
]

export const discoveryMediaPairs = Object.freeze(rows.map(([
  pairingID, countryCode, countryLabel, languageCode, gender, avatarExtension,
  durationMs, transcript, datasetID, datasetConfig, datasetSplit, sourceRow, speakerID,
], index) => {
  const assetNumber = String(index + 1).padStart(2, '0')
  const assetSlug = pairingID.replace(/^media-\d+-/, '')
  return Object.freeze({
    pairingID,
    countryCode,
    countryLabel,
    languageCode,
    gender,
    avatarAsset: discoveryAsset('avatars', `avatar-${assetNumber}-${assetSlug}.${avatarExtension}`),
    voiceAsset: discoveryAsset('audio', `voice-${assetNumber}-${assetSlug}.wav`),
    durationMs,
    transcript,
    source: Object.freeze({
      datasetID,
      datasetConfig,
      datasetSplit,
      sourceRow,
      ...(speakerID ? { speakerID } : {}),
    }),
  })
}))

export const discoveryMediaByID = Object.freeze(Object.fromEntries(
  discoveryMediaPairs.map((pair) => [pair.pairingID, pair]),
))
