const en = {
  connecting: 'Connecting......',
  report: 'Report',
  block: 'Block',
  mute: 'Mute',
  unmute: 'Unmute',
  end: 'End',
  aiTopics: 'AI topics',
  aiPrompt: 'AI TOPIC PROMPT',
  mutualOnly: 'Mutual friends only · calls are free',
  topicIdeas: 'Topic ideas',
  freeInCalls: 'FREE IN CALLS',
  topicHint: 'Tap one to show it on screen for both of you',
  done: 'Done',
  permissionRequired: 'Camera and microphone access are required for video calls.',
  voicePermissionRequired: 'Microphone access is required to record a voice message.',
  voiceRecordingUnavailable: 'No microphone input is available. Check your device audio input and try again.',
  voiceRecordingFailed: 'The voice message could not be recorded. Please try again.',
  voiceRecordingInterrupted: 'Recording was interrupted. Tap the microphone to try again.',
  permissionRetry: 'Try permissions again',
  categories: ['Hello', 'Your city', 'Food', 'Culture', 'Next'],
  categoryPrompts: [
    '“How do people say hello where you live?”',
    '“What is your favorite place in your city?”',
    '“What does everyone eat where you live?”',
    '“Which local tradition do you love most?”',
    '“What should we talk about next?”',
  ],
  topics: [
    '“What does everyone eat where you live?”',
    '“What’s the best season to visit?”',
    '“Teach me one word in your language.”',
    '“What did you do last weekend?”',
  ],
}

const overrides = {
  ar: {
    connecting: 'جارٍ الاتصال......', report: 'إبلاغ', block: 'حظر', mute: 'كتم', unmute: 'إلغاء الكتم', end: 'إنهاء', aiTopics: 'مواضيع AI', aiPrompt: 'موضوع مقترح من الذكاء الاصطناعي', mutualOnly: 'للأصدقاء المتبادلين فقط · المكالمات مجانية', topicIdeas: 'أفكار للحديث', freeInCalls: 'مجاني في المكالمات', topicHint: 'اختر واحدة لتظهر على الشاشة لكليكما', done: 'تم', permissionRequired: 'يلزم السماح بالكاميرا والميكروفون لمكالمات الفيديو.', voicePermissionRequired: 'يلزم السماح بالميكروفون لتسجيل رسالة صوتية.', voiceRecordingUnavailable: 'لا يتوفر إدخال للميكروفون. تحقق من إدخال الصوت وحاول مجدداً.', voiceRecordingFailed: 'تعذر تسجيل الرسالة الصوتية. حاول مجدداً.', voiceRecordingInterrupted: 'توقف التسجيل. اضغط على الميكروفون للمحاولة مجدداً.', permissionRetry: 'إعادة طلب الأذونات', categories: ['مرحباً', 'مدينتك', 'الطعام', 'الثقافة', 'التالي'], categoryPrompts: ['«كيف يلقي الناس التحية عندك؟»', '«ما مكانك المفضل في مدينتك؟»', '«ماذا يأكل الجميع في بلدك؟»', '«ما التقليد المحلي الأقرب إليك؟»', '«عمّ نتحدث بعد ذلك؟»'], topics: ['«ماذا يأكل الجميع في بلدك؟»', '«ما أفضل فصل للزيارة؟»', '«علّمني كلمة من لغتك.»', '«ماذا فعلت في عطلة نهاية الأسبوع؟»'],
  },
  he: {
    connecting: 'מתחבר......', report: 'דיווח', block: 'חסימה', mute: 'השתקה', unmute: 'ביטול השתקה', end: 'סיום', aiTopics: 'נושאי AI', aiPrompt: 'נושא מוצע מ-AI', mutualOnly: 'רק חברים הדדיים · השיחות חינם', topicIdeas: 'רעיונות לשיחה', freeInCalls: 'חינם בשיחות', topicHint: 'הקש על אחד כדי להציג לשניכם', done: 'סיום', permissionRequired: 'נדרשת גישה למצלמה ולמיקרופון לשיחות וידאו.', voicePermissionRequired: 'נדרשת גישה למיקרופון כדי להקליט הודעה קולית.', voiceRecordingUnavailable: 'אין קלט מיקרופון זמין. בדקו את קלט השמע ונסו שוב.', voiceRecordingFailed: 'לא ניתן היה להקליט את ההודעה הקולית. נסו שוב.', voiceRecordingInterrupted: 'ההקלטה הופסקה. הקישו על המיקרופון כדי לנסות שוב.', permissionRetry: 'ניסיון הרשאות נוסף', categories: ['שלום', 'העיר שלך', 'אוכל', 'תרבות', 'הבא'], categoryPrompts: ['״איך אומרים שלום אצלכם?״', '״מה המקום האהוב עליך בעיר?״', '״מה כולם אוכלים במקום שבו גרים?״', '״איזו מסורת מקומית הכי אהובה עליך?״', '״על מה נדבר עכשיו?״'], topics: ['״מה כולם אוכלים במקום שבו גרים?״', '״מה העונה הטובה ביותר לביקור?״', '״למדו אותי מילה אחת בשפה שלכם.״', '״מה עשיתם בסוף השבוע האחרון?״'],
  },
  tr: {
    connecting: 'Bağlanıyor......', report: 'Bildir', block: 'Engelle', mute: 'Sessize al', unmute: 'Sesi aç', end: 'Bitir', aiTopics: 'AI konuları', aiPrompt: 'AI KONU ÖNERİSİ', mutualOnly: 'Sadece karşılıklı arkadaşlar · aramalar ücretsiz', topicIdeas: 'Konu fikirleri', freeInCalls: 'ARAMALARDA ÜCRETSİZ', topicHint: 'Birine dokun, ikinizin ekranında görünsün', done: 'Tamam', permissionRequired: 'Görüntülü aramalar için kamera ve mikrofon izni gerekir.', voicePermissionRequired: 'Sesli mesaj kaydetmek için mikrofon izni gerekir.', voiceRecordingUnavailable: 'Kullanılabilir mikrofon girişi yok. Ses girişini kontrol edip tekrar deneyin.', voiceRecordingFailed: 'Sesli mesaj kaydedilemedi. Tekrar deneyin.', voiceRecordingInterrupted: 'Kayıt kesildi. Tekrar denemek için mikrofona dokunun.', permissionRetry: 'İzinleri yeniden dene', categories: ['Merhaba', 'Şehrin', 'Yemek', 'Kültür', 'Sonraki'], categoryPrompts: ['“Yaşadığın yerde insanlar nasıl selamlaşır?”', '“Şehrindeki en sevdiğin yer neresi?”', '“Yaşadığın yerde herkes ne yer?”', '“En sevdiğin yerel gelenek hangisi?”', '“Sırada ne konuşalım?”'], topics: ['“Yaşadığın yerde herkes ne yer?”', '“Ziyaret için en iyi mevsim hangisi?”', '“Bana dilinden bir kelime öğret.”', '“Geçen hafta sonu ne yaptın?”'],
  },
  fr: {
    connecting: 'Connexion......', report: 'Signaler', block: 'Bloquer', mute: 'Couper le son', unmute: 'Réactiver', end: 'Fin', aiTopics: 'Sujets IA', aiPrompt: 'SUJET PROPOSÉ PAR L’IA', mutualOnly: 'Amis réciproques uniquement · appels gratuits', topicIdeas: 'Idées de sujets', freeInCalls: 'GRATUIT EN APPEL', topicHint: 'Touchez-en un pour l’afficher à vous deux', done: 'Terminé', permissionRequired: 'La caméra et le micro sont requis pour les appels vidéo.', voicePermissionRequired: 'Le microphone est requis pour enregistrer un message vocal.', voiceRecordingUnavailable: 'Aucune entrée microphone disponible. Vérifiez l’entrée audio et réessayez.', voiceRecordingFailed: 'Le message vocal n’a pas pu être enregistré. Réessayez.', voiceRecordingInterrupted: 'L’enregistrement a été interrompu. Touchez le micro pour réessayer.', permissionRetry: 'Réessayer les autorisations', categories: ['Bonjour', 'Ta ville', 'Cuisine', 'Culture', 'Suite'], categoryPrompts: ['« Comment se salue-t-on chez toi ? »', '« Quel est ton endroit préféré dans ta ville ? »', '« Que mange-t-on chez toi ? »', '« Quelle tradition locale préfères-tu ? »', '« De quoi parlons-nous ensuite ? »'], topics: ['« Que mange-t-on chez toi ? »', '« Quelle est la meilleure saison pour venir ? »', '« Apprends-moi un mot dans ta langue. »', '« Qu’as-tu fait le week-end dernier ? »'],
  },
  de: {
    connecting: 'Verbindung wird hergestellt......', report: 'Melden', block: 'Blockieren', mute: 'Stumm', unmute: 'Ton an', end: 'Ende', aiTopics: 'KI-Themen', aiPrompt: 'KI-THEMENVORSCHLAG', mutualOnly: 'Nur gegenseitige Freunde · Anrufe sind kostenlos', topicIdeas: 'Themenideen', freeInCalls: 'GRATIS IM ANRUF', topicHint: 'Tippe eines an, damit es bei euch beiden erscheint', done: 'Fertig', permissionRequired: 'Für Videoanrufe sind Kamera und Mikrofon erforderlich.', voicePermissionRequired: 'Für Sprachnachrichten ist Mikrofonzugriff erforderlich.', voiceRecordingUnavailable: 'Kein Mikrofoneingang verfügbar. Prüfe den Audioeingang und versuche es erneut.', voiceRecordingFailed: 'Die Sprachnachricht konnte nicht aufgenommen werden. Versuche es erneut.', voiceRecordingInterrupted: 'Die Aufnahme wurde unterbrochen. Tippe zum Wiederholen auf das Mikrofon.', permissionRetry: 'Berechtigungen erneut versuchen', categories: ['Hallo', 'Deine Stadt', 'Essen', 'Kultur', 'Weiter'], categoryPrompts: ['„Wie begrüßt man sich bei dir?“', '„Welcher Ort in deiner Stadt gefällt dir am besten?“', '„Was essen alle bei dir?“', '„Welche lokale Tradition magst du am liebsten?“', '„Worüber reden wir als Nächstes?“'], topics: ['„Was essen alle bei dir?“', '„Welche Jahreszeit ist am besten für einen Besuch?“', '„Bring mir ein Wort in deiner Sprache bei.“', '„Was hast du letztes Wochenende gemacht?“'],
  },
  ja: {
    connecting: '接続中......', report: '報告', block: 'ブロック', mute: 'ミュート', unmute: 'ミュート解除', end: '終了', aiTopics: 'AIトピック', aiPrompt: 'AIトピックの提案', mutualOnly: '相互の友達のみ · 通話は無料', topicIdeas: '話題のヒント', freeInCalls: '通話中は無料', topicHint: 'タップすると二人の画面に表示されます', done: '完了', permissionRequired: 'ビデオ通話にはカメラとマイクの許可が必要です。', voicePermissionRequired: '音声メッセージの録音にはマイクの許可が必要です。', voiceRecordingUnavailable: 'マイク入力を利用できません。端末の音声入力を確認してもう一度お試しください。', voiceRecordingFailed: '音声メッセージを録音できませんでした。もう一度お試しください。', voiceRecordingInterrupted: '録音が中断されました。マイクをタップしてやり直してください。', permissionRetry: '権限を再確認', categories: ['あいさつ', 'あなたの街', '食べ物', '文化', '次へ'], categoryPrompts: ['「あなたの地域ではどう挨拶しますか？」', '「街で一番好きな場所はどこですか？」', '「あなたの地域では何をよく食べますか？」', '「好きな地元の伝統は何ですか？」', '「次は何を話しましょう？」'], topics: ['「あなたの地域では何をよく食べますか？」', '「訪れるならどの季節が一番ですか？」', '「あなたの言葉を一つ教えてください。」', '「先週末は何をしましたか？」'],
  },
  ko: {
    connecting: '연결 중......', report: '신고', block: '차단', mute: '음소거', unmute: '음소거 해제', end: '종료', aiTopics: 'AI 주제', aiPrompt: 'AI 주제 추천', mutualOnly: '서로 친구인 경우에만 · 통화는 무료', topicIdeas: '주제 아이디어', freeInCalls: '통화 중 무료', topicHint: '하나를 누르면 두 사람 화면에 표시돼요', done: '완료', permissionRequired: '영상 통화에는 카메라와 마이크 권한이 필요합니다.', voicePermissionRequired: '음성 메시지를 녹음하려면 마이크 권한이 필요합니다.', voiceRecordingUnavailable: '사용 가능한 마이크 입력이 없습니다. 기기 오디오 입력을 확인하고 다시 시도하세요.', voiceRecordingFailed: '음성 메시지를 녹음하지 못했습니다. 다시 시도하세요.', voiceRecordingInterrupted: '녹음이 중단되었습니다. 마이크를 눌러 다시 시도하세요.', permissionRetry: '권한 다시 요청', categories: ['인사', '내 도시', '음식', '문화', '다음'], categoryPrompts: ['“사는 곳에서는 어떻게 인사하나요?”', '“도시에서 가장 좋아하는 곳은 어디예요?”', '“사는 곳에서는 무엇을 자주 먹나요?”', '“가장 좋아하는 지역 전통은 무엇인가요?”', '“다음에는 무슨 이야기를 할까요?”'], topics: ['“사는 곳에서는 무엇을 자주 먹나요?”', '“방문하기 가장 좋은 계절은 언제예요?”', '“당신의 언어로 한 단어를 가르쳐 주세요.”', '“지난 주말에 무엇을 했나요?”'],
  },
}

export const videoCallContent = (locale) => ({ ...en, ...(overrides[locale] || {}) })
export const videoCallLocales = Object.freeze(['en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko'])
