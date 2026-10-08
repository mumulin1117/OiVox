import { discoveryMediaPairs } from './discoveryMediaManifest'

export const DISCOVERY_TRANSLATION_LANGUAGES = Object.freeze(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])

// Checked-in review translations keep the 20 bundled voice clips deterministic.
// The source transcript itself still comes from discoveryMediaManifest so it cannot
// silently drift away from the audio/transcript correspondence.
const translationsByPairingID = {
  'media-01-arabic-1': {
    en: 'The police said the body appeared to have been there for about a day.',
    ar: 'وقالت الشرطة إن الجثة بدت وكأنها كانت هناك منذ يوم تقريباً.',
    he: 'המשטרה אמרה כי נראה שהגופה הייתה שם במשך יום בערך.',
    tr: 'Polis, cesedin yaklaşık bir gündür orada gibi göründüğünü söyledi.',
    fr: 'La police a déclaré que le corps semblait être là depuis environ une journée.',
    de: 'Die Polizei erklärte, die Leiche habe offenbar seit etwa einem Tag dort gelegen.',
    ja: '警察によると、遺体はそこに1日ほどあったように見えたとのことです。',
    ko: '경찰은 시신이 그곳에 하루 정도 있었던 것으로 보인다고 말했습니다.',
  },
  'media-02-arabic-2': {
    en: 'At first, Byzantine culture in the East had a strong influence on clothing.',
    ar: 'في البداية، أثرت الثقافة البيزنطية في الشرق على الملابس تأثيرًا شديدًا.',
    he: 'בתחילה השפיעה התרבות הביזנטית במזרח במידה רבה על הלבוש.',
    tr: 'Başlangıçta Doğu’daki Bizans kültürü giyim üzerinde güçlü bir etki yarattı.',
    fr: 'Au début, la culture byzantine en Orient a fortement influencé les vêtements.',
    de: 'Anfangs hatte die byzantinische Kultur im Osten einen starken Einfluss auf die Kleidung.',
    ja: '当初、東方のビザンチン文化は服装に強い影響を与えました。',
    ko: '처음에는 동방의 비잔틴 문화가 의복에 큰 영향을 미쳤습니다.',
  },
  'media-03-arabic-3': {
    en: 'U.S. President George W. Bush welcomed the announcement.',
    ar: 'رحّب الرئيسُ الأمريكيُّ جورج دبليو بوش بالإعلان.',
    he: 'נשיא ארצות הברית ג׳ורג׳ ו׳ בוש בירך על ההודעה.',
    tr: 'ABD Başkanı George W. Bush açıklamayı memnuniyetle karşıladı.',
    fr: 'Le président américain George W. Bush a salué l’annonce.',
    de: 'US-Präsident George W. Bush begrüßte die Ankündigung.',
    ja: 'アメリカのジョージ・W・ブッシュ大統領は、その発表を歓迎しました。',
    ko: '조지 W. 부시 미국 대통령은 그 발표를 환영했습니다.',
  },
  'media-04-turkey-1': {
    en: 'There were three people in the house when the car hit it, but none of them were hurt.',
    ar: 'كان هناك ثلاثة أشخاص في المنزل عندما اصطدمت به السيارة، لكن لم يُصب أيٌّ منهم بأذى.',
    he: 'שלושה אנשים היו בבית כשהמכונית פגעה בו, אך איש מהם לא נפגע.',
    tr: 'Araba çarptığında evde üç kişi vardı, ancak hiçbiri zarar görmedi.',
    fr: 'Trois personnes se trouvaient dans la maison lorsque la voiture l’a percutée, mais aucune n’a été blessée.',
    de: 'Als das Auto in das Haus fuhr, waren drei Personen darin, aber niemand wurde verletzt.',
    ja: '車が家に衝突したとき、中には3人いましたが、誰もけがをしませんでした。',
    ko: '차가 집을 들이받았을 때 안에는 세 사람이 있었지만 아무도 다치지 않았습니다.',
  },
  'media-05-turkey-2': {
    en: 'Some festivals have special camping areas for families with young children.',
    ar: 'توفّر بعض المهرجانات مناطق تخييم خاصة للعائلات التي لديها أطفال صغار.',
    he: 'בחלק מהפסטיבלים יש אזורי קמפינג מיוחדים למשפחות עם ילדים קטנים.',
    tr: 'Bazı festivaller küçük çocuklu aileler için özel kamp alanlarına sahiptir.',
    fr: 'Certains festivals disposent de zones de camping réservées aux familles avec de jeunes enfants.',
    de: 'Einige Festivals bieten besondere Campingbereiche für Familien mit kleinen Kindern.',
    ja: '一部のフェスティバルには、小さな子ども連れの家族専用キャンプエリアがあります。',
    ko: '일부 축제에는 어린 자녀가 있는 가족을 위한 전용 캠핑 구역이 있습니다.',
  },
  'media-06-turkey-3': {
    en: 'The East African Islands are in the Indian Ocean, off the coast of East Africa.',
    ar: 'تقع جزر شرق أفريقيا في المحيط الهندي قبالة سواحل شرق أفريقيا.',
    he: 'איי מזרח אפריקה נמצאים באוקיינוס ההודי, מול חופי מזרח אפריקה.',
    tr: "Doğu Afrika Adaları, Hint Okyanusu'nda, doğu Afrika açıklarında yer alır.",
    fr: 'Les îles d’Afrique de l’Est se trouvent dans l’océan Indien, au large de l’Afrique orientale.',
    de: 'Die ostafrikanischen Inseln liegen im Indischen Ozean vor der Küste Ostafrikas.',
    ja: '東アフリカ諸島は、東アフリカ沖のインド洋にあります。',
    ko: '동아프리카 제도는 동아프리카 연안의 인도양에 있습니다.',
  },
  'media-07-israel-1': {
    en: 'An increasingly popular option for people planning a gap year is to travel and study.',
    ar: 'أصبح السفر والدراسة خيارًا متزايد الشعبية لمن يخططون لسنة فاصلة.',
    he: 'אפשרות שנהיית יותר ויותר פופולרית לאלו שמתכננים שנת חופש היא לטייל וללמוד.',
    tr: 'Ara yıl planlayanlar için giderek daha popüler hâle gelen bir seçenek seyahat edip eğitim almaktır.',
    fr: 'Voyager et étudier est une option de plus en plus appréciée par les personnes qui prévoient une année de césure.',
    de: 'Für Menschen, die ein Auszeitjahr planen, wird Reisen und Lernen immer beliebter.',
    ja: 'ギャップイヤーを計画する人の間では、旅をしながら学ぶという選択肢がますます人気になっています。',
    ko: '갭 이어를 계획하는 사람들에게 여행하며 공부하는 선택지가 점점 더 인기를 얻고 있습니다.',
  },
  'media-08-israel-2': {
    en: 'The graph analysis results will be published on a public website.',
    ar: 'ستُنشر نتائج تحليل الرسم البياني على موقع إلكتروني عام.',
    he: 'תוצאות ניתוח הגרף יפורסמו באתר אינטרנט ציבורי.',
    tr: 'Grafik analizinin sonuçları herkese açık bir internet sitesinde yayımlanacak.',
    fr: 'Les résultats de l’analyse du graphique seront publiés sur un site web public.',
    de: 'Die Ergebnisse der Diagrammanalyse werden auf einer öffentlichen Website veröffentlicht.',
    ja: 'グラフの分析結果は一般公開のウェブサイトで発表されます。',
    ko: '그래프 분석 결과는 공개 웹사이트에 게시될 예정입니다.',
  },
  'media-09-israel-3': {
    en: 'The costs of the American imperialist war to conquer the Philippines were paid by the Filipino people themselves.',
    ar: 'دفع الشعب الفلبيني نفسه تكاليف حرب الإمبريالية الأمريكية لاحتلال الفلبين.',
    he: 'הוצאות המלחמה של האימפריאליזם האמריקני על כיבוש הפיליפינים שולמו על-ידי העם הפיליפיני עצמו.',
    tr: 'Amerikan emperyalizminin Filipinler’i fethetmek için yürüttüğü savaşın masraflarını Filipin halkı bizzat ödedi.',
    fr: 'Le peuple philippin a lui-même payé le coût de la guerre menée par l’impérialisme américain pour conquérir les Philippines.',
    de: 'Die Kosten des amerikanisch-imperialistischen Krieges zur Eroberung der Philippinen wurden vom philippinischen Volk selbst getragen.',
    ja: 'フィリピン征服のためにアメリカ帝国主義が行った戦争の費用は、フィリピンの人々自身が負担しました。',
    ko: '필리핀을 정복하기 위해 미국 제국주의가 벌인 전쟁의 비용은 필리핀 국민 스스로가 부담했습니다.',
  },
  'media-10-uk-1': {
    en: 'She can scoop these things into three red bags, and we will go meet her Wednesday at the train station.',
    ar: 'يمكنها أن تضع هذه الأشياء في ثلاثة أكياس حمراء، وسنذهب لمقابلتها يوم الأربعاء في محطة القطار.',
    he: 'היא יכולה להכניס את הדברים האלה לשלושה תיקים אדומים, ואנחנו נלך לפגוש אותה ביום רביעי בתחנת הרכבת.',
    tr: 'Bunları üç kırmızı torbaya doldurabilir; biz de çarşamba günü tren istasyonunda onunla buluşuruz.',
    fr: 'Elle peut mettre ces choses dans trois sacs rouges, et nous irons la retrouver mercredi à la gare.',
    de: 'Sie kann diese Sachen in drei rote Taschen packen, und wir treffen sie am Mittwoch am Bahnhof.',
    ja: '彼女はこれらを3つの赤い袋に入れられます。私たちは水曜日に駅で彼女と会います。',
    ko: '그녀는 이것들을 빨간 가방 세 개에 담을 수 있고, 우리는 수요일에 기차역에서 그녀를 만날 것입니다.',
  },
  'media-11-uk-2': {
    en: 'We also need a small plastic snake and a big toy frog for the kids.',
    ar: 'نحتاج أيضًا إلى ثعبان بلاستيكي صغير وضفدع لعبة كبير للأطفال.',
    he: 'אנחנו צריכים גם נחש קטן מפלסטיק וצפרדע צעצוע גדולה לילדים.',
    tr: 'Çocuklar için küçük bir plastik yılana ve büyük bir oyuncak kurbağaya da ihtiyacımız var.',
    fr: 'Il nous faut aussi un petit serpent en plastique et une grande grenouille en jouet pour les enfants.',
    de: 'Wir brauchen außerdem eine kleine Plastikschlange und einen großen Spielzeugfrosch für die Kinder.',
    ja: '子どもたちのために、小さなプラスチックのヘビと大きなおもちゃのカエルも必要です。',
    ko: '아이들을 위해 작은 플라스틱 뱀과 큰 장난감 개구리도 필요합니다.',
  },
  'media-12-uk-3': {
    en: 'When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow.',
    ar: 'عندما يصطدم ضوء الشمس بقطرات المطر في الهواء، تعمل كمنشور وتكوّن قوس قزح.',
    he: 'כאשר אור השמש פוגע בטיפות גשם באוויר, הן פועלות כמנסרה ויוצרות קשת בענן.',
    tr: 'Güneş ışığı havadaki yağmur damlalarına çarptığında damlalar prizma gibi davranır ve gökkuşağı oluşturur.',
    fr: 'Lorsque la lumière du soleil frappe les gouttes de pluie dans l’air, elles agissent comme un prisme et forment un arc-en-ciel.',
    de: 'Wenn Sonnenlicht auf Regentropfen in der Luft trifft, wirken sie wie ein Prisma und bilden einen Regenbogen.',
    ja: '太陽の光が空気中の雨粒に当たると、雨粒がプリズムのように働いて虹を作ります。',
    ko: '햇빛이 공기 중의 빗방울에 닿으면 빗방울이 프리즘처럼 작용해 무지개를 만듭니다.',
  },
  'media-13-france-1': {
    en: 'Nor did he have the power to set aside tax laws or laws concerning customs duties between the states.',
    ar: 'كما لم تكن لديه سلطة مخالفة القوانين الضريبية أو القوانين المتعلقة بالرسوم الجمركية بين الولايات.',
    he: 'גם לא הייתה לו סמכות לחרוג מחוקי המס או מהחוקים הנוגעים למכסים בין המדינות.',
    tr: 'Ayrıca vergi yasalarını ya da eyaletler arasındaki gümrük vergilerine ilişkin yasaları geçersiz kılma yetkisi yoktu.',
    fr: "Il n'avait pas non plus le pouvoir de déroger aux lois fiscales ni à celles sur les droits de douane entre les États.",
    de: 'Er war auch nicht befugt, von den Steuergesetzen oder den Gesetzen über Zölle zwischen den Bundesstaaten abzuweichen.',
    ja: 'また、税法や州間の関税に関する法律を適用除外にする権限もありませんでした。',
    ko: '그에게는 세법이나 주 사이의 관세에 관한 법률을 따르지 않을 권한도 없었습니다.',
  },
  'media-14-france-2': {
    en: 'Christmas is one of the most important celebrations in Christianity; it celebrates the birth of Jesus.',
    ar: 'عيد الميلاد من أهم الأعياد في المسيحية، وهو يحتفل بميلاد يسوع.',
    he: 'חג המולד הוא אחד החגים החשובים ביותר בנצרות, והוא מציין את הולדתו של ישו.',
    tr: 'Noel, Hristiyanlığın en önemli bayramlarından biridir ve İsa’nın doğumunu kutlar.',
    fr: "Noël est l'une des fêtes les plus importantes de la chrétienté, elle célèbre la naissance de Jésus.",
    de: 'Weihnachten ist eines der wichtigsten Feste des Christentums und feiert die Geburt Jesu.',
    ja: 'クリスマスはキリスト教で最も重要な祝日の一つで、イエスの誕生を祝います。',
    ko: '크리스마스는 기독교에서 가장 중요한 축일 중 하나로, 예수의 탄생을 기념합니다.',
  },
  'media-15-germany-1': {
    en: 'Handcrafted products may be described as “antique” even though they are newer than similar mass-produced goods.',
    ar: 'قد توصف المنتجات المصنوعة يدويًا بأنها «عتيقة» رغم أنها أحدث من منتجات مماثلة مصنّعة بكميات كبيرة.',
    he: 'מוצרים בעבודת יד עשויים להיקרא ״עתיקים״ אף שהם חדשים יותר ממוצרים דומים שיוצרו בייצור המוני.',
    tr: 'El yapımı ürünler, benzer seri üretim ürünlerden daha yeni olsalar bile “antika” olarak tanımlanabilir.',
    fr: 'Des produits artisanaux peuvent être qualifiés d’« anciens », même s’ils sont plus récents que des produits similaires fabriqués en série.',
    de: 'Handgefertigte Produkte könnten als „antik“ bezeichnet werden, obwohl sie jünger als ähnliche Erzeugnisse aus Massenproduktion sind.',
    ja: '手作りの製品は、同種の大量生産品より新しくても「アンティーク」と呼ばれることがあります。',
    ko: '수공예품은 비슷한 대량 생산품보다 더 최근에 만들어졌더라도 ‘골동품’이라고 불릴 수 있습니다.',
  },
  'media-16-germany-2': {
    en: 'That did not seem sensible to me; it certainly was not fair.',
    ar: 'لم يبدُ ذلك منطقيًا بالنسبة إليّ، ومن المؤكد أنه لم يكن عادلًا.',
    he: 'זה לא נראה לי הגיוני; זה בהחלט לא היה הוגן.',
    tr: 'Bu bana mantıklı gelmedi; kesinlikle adil değildi.',
    fr: 'Cela ne me semblait pas raisonnable ; ce n’était certainement pas juste.',
    de: 'Das erschien mir nicht sinnvoll; es war ganz gewiss nicht fair.',
    ja: 'それは私には理にかなっているようには思えませんでしたし、決して公平でもありませんでした。',
    ko: '그것은 제게 합리적으로 보이지 않았고, 분명 공정하지도 않았습니다.',
  },
  'media-17-japan-1': {
    en: 'Apparently, he made a doorbell that rings over Wi-Fi.',
    ar: 'يبدو أنه صنع جرس باب يعمل عبر شبكة Wi-Fi.',
    he: 'נראה שהוא יצר פעמון דלת שמצלצל דרך Wi-Fi.',
    tr: 'Görünüşe göre Wi-Fi üzerinden çalan bir kapı zili yapmış.',
    fr: 'Il aurait fabriqué une sonnette qui retentit par Wi-Fi.',
    de: 'Anscheinend hat er eine Türklingel gebaut, die über WLAN klingelt.',
    ja: '彼はWi-Fiで鳴るドアベルを作ったそうです。',
    ko: '그는 Wi-Fi로 울리는 초인종을 만들었다고 합니다.',
  },
  'media-18-japan-2': {
    en: 'The main religion in Moldova is Orthodox Christianity.',
    ar: 'الديانة الرئيسية في مولدوفا هي المسيحية الأرثوذكسية.',
    he: 'הדת העיקרית במולדובה היא הנצרות האורתודוקסית.',
    tr: 'Moldova’daki başlıca din Ortodoks Hristiyanlıktır.',
    fr: 'La principale religion en Moldavie est le christianisme orthodoxe.',
    de: 'Die wichtigste Religion in Moldau ist das orthodoxe Christentum.',
    ja: 'モルドバの主な宗教は正統派キリスト教です。',
    ko: '몰도바의 주요 종교는 정교회 기독교입니다.',
  },
  'media-19-korea-1': {
    en: 'The costs of the American imperialist war to conquer the Philippines were paid by the Filipinos themselves.',
    ar: 'دفع الفلبينيون أنفسهم تكاليف حرب الإمبريالية الأمريكية لاحتلال الفلبين.',
    he: 'הוצאות המלחמה של האימפריאליזם האמריקני לכיבוש הפיליפינים שולמו בידי הפיליפינים עצמם.',
    tr: 'Amerikan emperyalizminin Filipinler’i fethetmek için yürüttüğü savaşın masraflarını Filipinliler bizzat ödedi.',
    fr: 'Les Philippins ont eux-mêmes payé le coût de la guerre menée par l’impérialisme américain pour conquérir les Philippines.',
    de: 'Die Kosten des amerikanisch-imperialistischen Krieges zur Eroberung der Philippinen wurden von den Filipinos selbst getragen.',
    ja: 'フィリピン征服のためにアメリカ帝国主義が行った戦争の費用は、フィリピン人自身が負担しました。',
    ko: '필리핀 정복에 사용된 미국 제국주의의 전쟁 비용은 필리핀인 자신들에 의해 지급되었다.',
  },
  'media-20-korea-2': {
    en: 'The Spanish began a colonial era that lasted for three centuries.',
    ar: 'بدأ الإسبان حقبة استعمارية استمرت ثلاثة قرون.',
    he: 'הספרדים פתחו תקופה קולוניאלית שנמשכה שלוש מאות שנים.',
    tr: 'İspanyollar üç yüzyıl süren bir sömürge dönemini başlattı.',
    fr: 'Les Espagnols ont inauguré une période coloniale qui a duré trois siècles.',
    de: 'Die Spanier leiteten eine Kolonialzeit ein, die drei Jahrhunderte dauerte.',
    ja: 'スペイン人は3世紀にわたる植民地時代を始めました。',
    ko: '스페인 사람들이 3세기 동안 지속된 식민지 시대를 시작했다.',
  },
}

function freezeTranslations(translations) {
  return Object.freeze(Object.fromEntries(DISCOVERY_TRANSLATION_LANGUAGES.map((language) => [language, translations[language]])))
}

export const discoveryVoiceTranslationsByPairingID = Object.freeze(Object.fromEntries(
  discoveryMediaPairs.map((media) => [media.pairingID, Object.freeze({
    pairingID: media.pairingID,
    voiceID: `voice-${media.pairingID}`,
    originalText: media.transcript,
    sourceLanguage: media.languageCode,
    translations: freezeTranslations(translationsByPairingID[media.pairingID] || {}),
  })]),
))

export const discoveryVoiceTranslationsByOriginalText = Object.freeze(Object.fromEntries(
  Object.values(discoveryVoiceTranslationsByPairingID).map((entry) => [entry.originalText, entry]),
))

export function getDiscoveryVoiceTranslation({ pairingID, voiceID, originalText, targetLanguage } = {}) {
  const normalizedLanguage = String(targetLanguage || '').toLowerCase().split(/[-_]/)[0]
  if (!DISCOVERY_TRANSLATION_LANGUAGES.includes(normalizedLanguage)) return null

  const stablePairingID = pairingID || String(voiceID || '').replace(/^voice-/, '')
  const entry = discoveryVoiceTranslationsByPairingID[stablePairingID]
    || discoveryVoiceTranslationsByOriginalText[String(originalText || '')]
  if (!entry || (originalText && entry.originalText !== originalText)) return null

  const translatedText = entry.translations[normalizedLanguage]
  if (!translatedText) return null
  return Object.freeze({
    translatedText,
    sourceLanguage: entry.sourceLanguage,
    targetLanguage: normalizedLanguage,
    pairingID: entry.pairingID,
    voiceID: entry.voiceID,
    source: 'bundled-localization',
  })
}
