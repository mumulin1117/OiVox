const questions = [
  { id: 'region', title: 'Which regions are you curious about?', options: [['middle-east', 'Middle East'], ['europe', 'Europe'], ['east-asia', 'East Asia'], ['world', 'Anywhere in the world']] },
  { id: 'languages', title: 'Which languages do you speak?', options: [['english', 'English'], ['arabic', 'Arabic'], ['another', 'Another language'], ['three-plus', 'Three or more']] },
  { id: 'topics', title: 'What do you like talking about?', options: [['food-life', 'Food & everyday life'], ['travel-cities', 'Travel & cities'], ['movies-music', 'Movies & music'], ['everything', 'A bit of everything']] },
  { id: 'reply', title: 'How do you prefer to reply?', options: [['voice', 'A 7-second voice back'], ['heart', 'A heart first'], ['text', 'Text messages'], ['anything', 'Whatever feels right']] },
  { id: 'online', title: 'When are you usually online?', options: [['morning', 'Morning'], ['lunch', 'Lunch break'], ['evening', 'Evening'], ['late-night', 'Late night']] },
  { id: 'ai', title: 'What should AI help you with?', options: [['translate', 'Translate voices'], ['openers', 'Suggest openers'], ['both', 'Both'], ['none', 'Nothing for now']] },
]

export const interests = [
  ['food', 'Food & cooking'], ['travel', 'Travel'], ['movies', 'Movies'], ['music', 'Music'], ['photography', 'Photography'], ['sports', 'Sports'],
  ['books', 'Books'], ['games', 'Games'], ['pets', 'Pets'], ['festivals', 'Festivals'], ['city-life', 'City life'], ['languages', 'Languages'],
]

const en = {
  back: 'Back', skip: 'Skip', continue: 'Continue', done: 'Done', step: (n) => `Step ${n} of 7`,
  profileTitle: 'Pick a nickname', profileSubtitle: 'A photo and nickname are required.', nickname: 'NICKNAME', nicknamePlaceholder: 'How should people know you?', languages: 'I SPEAK', photoAction: 'Choose a photo',
  privacyTitle: 'Only what you choose is public', privacyBody: 'Your real name, email, and exact location stay private.', nicknameRequired: 'Enter a nickname between 1 and 32 characters.', avatarRequired: 'Choose a profile photo to continue.',
  avatarCancelled: 'No photo was selected. Choose a profile photo to continue.', avatarPermissionDenied: 'Photo access was not allowed. Try again or use the other source.', avatarDecodeFailed: 'That photo could not be opened. Choose another image.', avatarProcessingFailed: 'That photo could not be prepared. Please try again.', chooseFromPhotos: 'Choose from Photos', takePhoto: 'Take Photo', returnToProfile: 'Return to Step 2',
  question: (n) => `Question ${n} of 6`, questionNote: 'This only shapes your experience. You can change it later.',
  interestTitle: 'What do you like talking about?', interestSubtitle: 'Choose 2–5 interests to help OiVox shape your first conversations.', selected: 'SELECTED', chooseMore: 'Choose at least two interests.', buildProfile: 'Build My Profile',
  communicationTitle: 'Your profile', communicationSubtitle: 'A quick preview based on your answers.', iSpeak: 'I Speak', reply: 'Reply', online: 'Online', curiousAbout: 'CURIOUS ABOUT', editAnswers: 'Edit answers',
  micTitle: 'We need your mic for 7 seconds', micBody: 'Used only while you hold record — never in the background.', allowMic: 'Allow Microphone', notNow: 'Not now', permissionGranted: 'Microphone ready', permissionSkipped: 'You can enable it later in Settings.',
  cameraTitle: 'Camera, only for the liveness check', cameraBody: 'We record a few seconds of you saying three numbers to confirm you’re a real person. Nothing else uses the camera.', allowCamera: 'Allow Camera', skipForNow: 'Skip for now', cameraGranted: 'Camera ready', cameraSkipped: 'You can enable it later in Settings.',
  verifyTitle: 'Liveness check', verifyBody: 'We’ll show you 3 numbers in sequence. Look into the camera and say them out loud.', startCheck: 'Start check', verifyPrivacy: 'Used only to verify you’re real, then deleted automatically. It never appears on your profile.',
  digitsTitle: 'Say these numbers', digitsBody: 'Speak clearly in one breath.', saidAll: 'I said all three', couldntHear: 'Couldn’t hear me?', cancel: 'Cancel',
  failedTitle: 'Check failed', failedBody: 'The numbers were spoken incorrectly, or we couldn’t hear or see you clearly.', tips: 'QUICK TIPS', tipItems: ['Face the light', 'Keep the phone steady', 'Say all three numbers clearly'], tryAgain: 'Try again', contactSupport: 'Contact support',
  creating: 'Creating your account…', submitError: 'Your account was not created. Check the message and try again.', emailInUse: 'That email already has an account. Return to Step 1 or log in.', returnToAccount: 'Return to Step 1',
  completeKicker: 'REGISTRATION COMPLETE', completeTitle: (name) => `You’re in, ${name}`, completeBody: 'One 7-second clip unlocks the voice globe.', record7: 'Record my 7 seconds', languageSettings: 'Change language first',
  questions,
}

const translations = {
  ar: {
    profileSubtitle: 'الصورة والاسم المستعار مطلوبان.', avatarRequired: 'اختر صورة للملف الشخصي للمتابعة.', avatarCancelled: 'لم يتم اختيار صورة. اختر صورة للملف الشخصي للمتابعة.', avatarPermissionDenied: 'لم يُسمح بالوصول إلى الصور. حاول مجددًا أو استخدم المصدر الآخر.', avatarDecodeFailed: 'تعذر فتح هذه الصورة. اختر صورة أخرى.', avatarProcessingFailed: 'تعذر تجهيز هذه الصورة. حاول مجددًا.', chooseFromPhotos: 'اختيار من الصور', takePhoto: 'التقاط صورة', returnToProfile: 'العودة إلى الخطوة 2',
    back: 'رجوع', skip: 'تخطّي', continue: 'متابعة', done: 'تم', step: (n) => `الخطوة ${n} من 7`, profileTitle: 'اختر اسمًا مستعارًا', nickname: 'الاسم المستعار', nicknamePlaceholder: 'كيف تريد أن يعرفك الآخرون؟', languages: 'أتحدث', photoAction: 'اختر صورة', privacyTitle: 'لا يظهر إلا ما تختاره', privacyBody: 'يبقى اسمك الحقيقي وبريدك وموقعك الدقيق خاصًا.', nicknameRequired: 'أدخل اسمًا من 1 إلى 32 حرفًا.', question: (n) => `السؤال ${n} من 6`, questionNote: 'تُستخدم الإجابات لتخصيص تجربتك ويمكن تغييرها لاحقًا.', interestTitle: 'عمّ تحب التحدث؟', interestSubtitle: 'اختر من 2 إلى 5 اهتمامات لبدء محادثات مناسبة.', selected: 'المحدد', chooseMore: 'اختر اهتمامين على الأقل.', buildProfile: 'إنشاء ملفي', communicationTitle: 'ملفك الشخصي', communicationSubtitle: 'معاينة سريعة بناءً على إجاباتك.', iSpeak: 'أتحدث', reply: 'الرد', online: 'متصل', curiousAbout: 'مهتم بـ', editAnswers: 'تعديل الإجابات', micTitle: 'دع صوتك يسافر', micBody: 'يحتاج OiVox إلى الميكروفون للمقاطع والرسائل والمكالمات الصوتية.', allowMic: 'السماح بالميكروفون', notNow: 'ليس الآن', permissionGranted: 'الميكروفون جاهز', permissionSkipped: 'يمكنك تفعيله لاحقًا من الإعدادات.', cameraTitle: 'تواصل وجهًا لوجه', cameraBody: 'تُستخدم الكاميرا فقط عند بدء التحقق أو مكالمة فيديو فردية.', allowCamera: 'السماح بالكاميرا', skipForNow: 'تخطّي الآن', cameraGranted: 'الكاميرا جاهزة', cameraSkipped: 'يمكنك تفعيلها لاحقًا من الإعدادات.', verifyTitle: 'خطوة أخيرة للتحقق', verifyBody: 'اقرأ ثلاثة أرقام بصوت مرتفع. لا يرفع العرض المحلي التسجيل أو يحتفظ به.', startCheck: 'بدء التحقق', verifyPrivacy: 'لن تُضاف عينة التحقق إلى ملفك.', digitsTitle: 'انطق هذه الأرقام', digitsBody: 'تحدث بوضوح في نفس واحد.', saidAll: 'نطقت الأرقام الثلاثة', couldntHear: 'لم تسمعني؟', cancel: 'إلغاء', failedTitle: 'تعذر التحقق من هذه المحاولة', failedBody: 'لم يُرسل شيء. حاول في مكان هادئ وأبق وجهك داخل الدائرة.', tips: 'نصائح سريعة', tipItems: ['واجه الضوء', 'ثبّت الهاتف', 'انطق الأرقام الثلاثة بوضوح'], tryAgain: 'حاول مجددًا', contactSupport: 'اتصل بالدعم', creating: 'جارٍ إنشاء الحساب…', submitError: 'لم يُنشأ حسابك. تحقق من الرسالة وحاول مجددًا.', emailInUse: 'يوجد حساب بهذا البريد. ارجع إلى الخطوة الأولى أو سجّل الدخول.', returnToAccount: 'العودة للخطوة الأولى', completeKicker: 'اكتمل التسجيل', completeTitle: (name) => `أهلًا بك، ${name}`, completeBody: 'ملف OiVox جاهز. سجّل أول سبع ثوانٍ عندما تكون مستعدًا.', record7: 'سجّل 7 ثوانٍ', languageSettings: 'تغيير لغة التطبيق',
  },
  he: {
    profileSubtitle: 'נדרשים תמונה וכינוי.', avatarRequired: 'יש לבחור תמונת פרופיל כדי להמשיך.', avatarCancelled: 'לא נבחרה תמונה. יש לבחור תמונת פרופיל כדי להמשיך.', avatarPermissionDenied: 'הגישה לתמונות לא אושרה. נסו שוב או בחרו מקור אחר.', avatarDecodeFailed: 'לא ניתן לפתוח את התמונה. בחרו תמונה אחרת.', avatarProcessingFailed: 'לא ניתן להכין את התמונה. נסו שוב.', chooseFromPhotos: 'בחירה מהתמונות', takePhoto: 'צילום תמונה', returnToProfile: 'חזרה לשלב 2',
    back: 'חזרה', skip: 'דילוג', continue: 'המשך', done: 'סיום', step: (n) => `שלב ${n} מתוך 7`, profileTitle: 'בחירת כינוי', nickname: 'כינוי', nicknamePlaceholder: 'איך להציג אותך?', languages: 'השפות שלי', photoAction: 'בחירת תמונה', privacyTitle: 'רק מה שבחרת יהיה ציבורי', privacyBody: 'השם האמיתי, האימייל והמיקום המדויק נשארים פרטיים.', nicknameRequired: 'יש להזין כינוי באורך 1–32 תווים.', question: (n) => `שאלה ${n} מתוך 6`, questionNote: 'התשובות רק מעצבות את החוויה וניתנות לשינוי.', interestTitle: 'מה מעניין אותך?', interestSubtitle: 'בחרו 2–5 תחומים לשיחות הראשונות.', selected: 'נבחרו', chooseMore: 'יש לבחור לפחות שני תחומים.', buildProfile: 'בניית הפרופיל', communicationTitle: 'פרופיל התקשורת שלך', communicationSubtitle: 'תצוגה מקדימה לפי התשובות.', iSpeak: 'שפות', reply: 'תגובה', online: 'זמן פעילות', curiousAbout: 'מעניין אותי', editAnswers: 'עריכת תשובות', micTitle: 'לתת לקול להגיע רחוק', micBody: 'OiVox זקוקה למיקרופון לקליפים, הודעות קוליות ושיחות.', allowMic: 'אישור מיקרופון', notNow: 'לא עכשיו', permissionGranted: 'המיקרופון מוכן', permissionSkipped: 'אפשר לאפשר מאוחר יותר בהגדרות.', cameraTitle: 'להיפגש פנים אל פנים', cameraBody: 'המצלמה משמשת רק לאימות או לשיחת וידאו אישית.', allowCamera: 'אישור מצלמה', skipForNow: 'דילוג לעת עתה', cameraGranted: 'המצלמה מוכנה', cameraSkipped: 'אפשר לאפשר מאוחר יותר בהגדרות.', verifyTitle: 'בדיקה אחרונה של אדם אמיתי', verifyBody: 'אמרו שלושה מספרים בקול. ההדגמה המקומית לא מעלה או שומרת הקלטה.', startCheck: 'התחלת בדיקה', verifyPrivacy: 'דגימת האימות לא תתווסף לפרופיל.', digitsTitle: 'אמרו את המספרים', digitsBody: 'דברו בבירור בנשימה אחת.', saidAll: 'אמרתי את שלושתם', couldntHear: 'לא שמעתם אותי?', cancel: 'ביטול', failedTitle: 'לא הצלחנו לאמת את הניסיון', failedBody: 'דבר לא נשלח. נסו במקום שקט והשאירו את הפנים בעיגול.', tips: 'טיפים מהירים', tipItems: ['פנים אל האור', 'להחזיק את הטלפון יציב', 'לומר את כל המספרים בבירור'], tryAgain: 'ניסיון חוזר', contactSupport: 'פנייה לתמיכה', creating: 'יוצרים את החשבון…', submitError: 'החשבון לא נוצר. בדקו ונסו שוב.', emailInUse: 'כבר קיים חשבון עם האימייל הזה. חזרו לשלב 1 או התחברו.', returnToAccount: 'חזרה לשלב 1', completeKicker: 'ההרשמה הושלמה', completeTitle: (name) => `נכנסת, ${name}`, completeBody: 'פרופיל OiVox מוכן. אפשר להקליט את שבע השניות הראשונות.', record7: 'הקלטת 7 שניות', languageSettings: 'שינוי שפת האפליקציה',
  },
  tr: {
    avatarRequired: 'Devam etmek için profil fotoğrafı seç.', avatarCancelled: 'Fotoğraf seçilmedi. Devam etmek için bir profil fotoğrafı seç.', avatarPermissionDenied: 'Fotoğraf erişimine izin verilmedi. Tekrar dene veya diğer kaynağı kullan.', avatarDecodeFailed: 'Bu fotoğraf açılamadı. Başka bir görsel seç.', avatarProcessingFailed: 'Bu fotoğraf hazırlanamadı. Tekrar dene.', chooseFromPhotos: 'Fotoğraflardan seç', takePhoto: 'Fotoğraf çek', returnToProfile: '2. adıma dön',
    back: 'Geri', skip: 'Geç', continue: 'Devam', done: 'Bitti', step: (n) => `7 adımın ${n}. adımı`, profileTitle: 'Bir takma ad seç', nickname: 'TAKMA AD', nicknamePlaceholder: 'Seni nasıl tanısınlar?', languages: 'KONUŞTUĞUM DİLLER', photoAction: 'Fotoğraf seç', privacyTitle: 'Yalnızca seçtiklerin herkese açık', privacyBody: 'Gerçek adın, e-postan ve kesin konumun gizli kalır.', nicknameRequired: '1–32 karakterlik bir takma ad gir.', question: (n) => `6 sorudan ${n}. soru`, questionNote: 'Yalnızca deneyimini şekillendirir; sonra değiştirebilirsin.', interestTitle: 'Nelerden hoşlanırsın?', interestSubtitle: 'İlk sohbetlerin için 2–5 ilgi alanı seç.', selected: 'SEÇİLEN', chooseMore: 'En az iki ilgi alanı seç.', buildProfile: 'Profilimi Oluştur', communicationTitle: 'İletişim profilin', communicationSubtitle: 'Yanıtlarına göre kısa bir önizleme.', iSpeak: 'Diller', reply: 'Yanıt', online: 'Çevrimiçi', curiousAbout: 'MERAK ETTİKLERİM', editAnswers: 'Yanıtları düzenle', micTitle: 'Sesin dünyaya ulaşsın', micBody: 'OiVox; klipler, sesli mesajlar ve aramalar için mikrofon ister.', allowMic: 'Mikrofona İzin Ver', notNow: 'Şimdi değil', permissionGranted: 'Mikrofon hazır', permissionSkipped: 'Daha sonra Ayarlar’dan açabilirsin.', cameraTitle: 'Yüz yüze buluş', cameraBody: 'Kamera yalnızca doğrulama veya bire bir görüntülü aramada kullanılır.', allowCamera: 'Kameraya İzin Ver', skipForNow: 'Şimdilik geç', cameraGranted: 'Kamera hazır', cameraSkipped: 'Daha sonra Ayarlar’dan açabilirsin.', verifyTitle: 'Son bir gerçek kişi kontrolü', verifyBody: 'Üç sayıyı sesli söyle. Yerel demo kaydı yüklemez veya saklamaz.', startCheck: 'Kontrolü Başlat', verifyPrivacy: 'Doğrulama örneği profiline eklenmez.', digitsTitle: 'Bu sayıları söyle', digitsBody: 'Tek nefeste net konuş.', saidAll: 'Üçünü de söyledim', couldntHear: 'Beni duyamadın mı?', cancel: 'İptal', failedTitle: 'Bu denemeyi doğrulayamadık', failedBody: 'Hiçbir şey gönderilmedi. Sessiz bir yerde tekrar dene.', tips: 'HIZLI İPUÇLARI', tipItems: ['Işığa dön', 'Telefonu sabit tut', 'Üç sayıyı net söyle'], tryAgain: 'Tekrar dene', contactSupport: 'Destekle iletişim', creating: 'Hesabın oluşturuluyor…', submitError: 'Hesabın oluşturulmadı. Mesajı kontrol edip tekrar dene.', emailInUse: 'Bu e-posta zaten kayıtlı. 1. adıma dön veya giriş yap.', returnToAccount: '1. adıma dön', completeKicker: 'KAYIT TAMAMLANDI', completeTitle: (name) => `Hazırsın, ${name}`, completeBody: 'OiVox profilin hazır. İlk yedi saniyeni kaydet.', record7: '7 saniyemi kaydet', languageSettings: 'Uygulama dilini değiştir',
    profileSubtitle: 'Fotoğraf ve takma ad zorunludur.',
  },
  fr: {
    avatarRequired: 'Choisissez une photo de profil pour continuer.', avatarCancelled: 'Aucune photo sélectionnée. Choisissez une photo de profil pour continuer.', avatarPermissionDenied: 'L’accès aux photos n’a pas été autorisé. Réessayez ou utilisez l’autre source.', avatarDecodeFailed: 'Impossible d’ouvrir cette photo. Choisissez une autre image.', avatarProcessingFailed: 'Impossible de préparer cette photo. Réessayez.', chooseFromPhotos: 'Choisir dans Photos', takePhoto: 'Prendre une photo', returnToProfile: 'Revenir à l’étape 2',
    back: 'Retour', skip: 'Passer', continue: 'Continuer', done: 'Terminé', step: (n) => `Étape ${n} sur 7`, profileTitle: 'Choisissez un pseudo', nickname: 'PSEUDO', nicknamePlaceholder: 'Comment vous présenter ?', languages: 'JE PARLE', photoAction: 'Choisir une photo', privacyTitle: 'Vous choisissez ce qui est public', privacyBody: 'Votre vrai nom, e-mail et position précise restent privés.', nicknameRequired: 'Saisissez un pseudo de 1 à 32 caractères.', question: (n) => `Question ${n} sur 6`, questionNote: 'Ces réponses personnalisent votre expérience et restent modifiables.', interestTitle: 'Qu’aimez-vous ?', interestSubtitle: 'Choisissez 2 à 5 centres d’intérêt pour vos premiers échanges.', selected: 'SÉLECTION', chooseMore: 'Choisissez au moins deux centres d’intérêt.', buildProfile: 'Créer mon profil', communicationTitle: 'Votre profil de communication', communicationSubtitle: 'Un aperçu établi à partir de vos réponses.', iSpeak: 'Je parle', reply: 'Réponse', online: 'En ligne', curiousAbout: 'CURIEUX DE', editAnswers: 'Modifier les réponses', micTitle: 'Faites voyager votre voix', micBody: 'OiVox utilise le micro pour les clips, messages vocaux et appels.', allowMic: 'Autoriser le micro', notNow: 'Pas maintenant', permissionGranted: 'Micro prêt', permissionSkipped: 'Vous pourrez l’activer dans Réglages.', cameraTitle: 'Échangez face à face', cameraBody: 'La caméra sert uniquement à la vérification ou aux appels vidéo individuels.', allowCamera: 'Autoriser la caméra', skipForNow: 'Passer pour le moment', cameraGranted: 'Caméra prête', cameraSkipped: 'Vous pourrez l’activer dans Réglages.', verifyTitle: 'Une dernière vérification', verifyBody: 'Lisez trois chiffres. Cette démo locale ne transfère ni ne conserve l’enregistrement.', startCheck: 'Commencer', verifyPrivacy: 'L’échantillon ne sera pas ajouté au profil.', digitsTitle: 'Prononcez ces chiffres', digitsBody: 'Parlez clairement en une seule fois.', saidAll: 'J’ai dit les trois', couldntHear: 'Vous ne m’entendez pas ?', cancel: 'Annuler', failedTitle: 'Impossible de vérifier cette prise', failedBody: 'Rien n’a été envoyé. Réessayez au calme en gardant votre visage dans le cercle.', tips: 'CONSEILS RAPIDES', tipItems: ['Faites face à la lumière', 'Gardez le téléphone stable', 'Prononcez clairement les trois chiffres'], tryAgain: 'Réessayer', contactSupport: 'Contacter le support', creating: 'Création du compte…', submitError: 'Votre compte n’a pas été créé. Vérifiez le message et réessayez.', emailInUse: 'Cette adresse possède déjà un compte. Revenez à l’étape 1 ou connectez-vous.', returnToAccount: 'Revenir à l’étape 1', completeKicker: 'INSCRIPTION TERMINÉE', completeTitle: (name) => `Bienvenue, ${name}`, completeBody: 'Votre profil OiVox est prêt. Enregistrez vos sept premières secondes.', record7: 'Enregistrer mes 7 secondes', languageSettings: 'Changer la langue',
    profileSubtitle: 'Une photo et un pseudo sont requis.',
  },
  de: {
    avatarRequired: 'Wähle ein Profilfoto, um fortzufahren.', avatarCancelled: 'Kein Foto ausgewählt. Wähle ein Profilfoto, um fortzufahren.', avatarPermissionDenied: 'Der Fotozugriff wurde nicht erlaubt. Versuche es erneut oder nutze die andere Quelle.', avatarDecodeFailed: 'Dieses Foto konnte nicht geöffnet werden. Wähle ein anderes Bild.', avatarProcessingFailed: 'Dieses Foto konnte nicht vorbereitet werden. Versuche es erneut.', chooseFromPhotos: 'Aus Fotos wählen', takePhoto: 'Foto aufnehmen', returnToProfile: 'Zurück zu Schritt 2',
    back: 'Zurück', skip: 'Überspringen', continue: 'Weiter', done: 'Fertig', step: (n) => `Schritt ${n} von 7`, profileTitle: 'Wähle einen Spitznamen', nickname: 'SPITZNAME', nicknamePlaceholder: 'Wie sollen dich andere kennen?', languages: 'ICH SPRECHE', photoAction: 'Foto wählen', privacyTitle: 'Nur deine Auswahl ist öffentlich', privacyBody: 'Echter Name, E-Mail und genauer Standort bleiben privat.', nicknameRequired: 'Gib einen Spitznamen mit 1–32 Zeichen ein.', question: (n) => `Frage ${n} von 6`, questionNote: 'Die Antworten gestalten nur dein Erlebnis und bleiben änderbar.', interestTitle: 'Was interessiert dich?', interestSubtitle: 'Wähle 2–5 Interessen für deine ersten Gespräche.', selected: 'AUSGEWÄHLT', chooseMore: 'Wähle mindestens zwei Interessen.', buildProfile: 'Profil erstellen', communicationTitle: 'Dein Kommunikationsprofil', communicationSubtitle: 'Eine Vorschau aus deinen Antworten.', iSpeak: 'Sprachen', reply: 'Antwort', online: 'Online', curiousAbout: 'INTERESSIERT AN', editAnswers: 'Antworten ändern', micTitle: 'Lass deine Stimme reisen', micBody: 'OiVox benötigt das Mikrofon für Clips, Sprachnachrichten und Anrufe.', allowMic: 'Mikrofon erlauben', notNow: 'Nicht jetzt', permissionGranted: 'Mikrofon bereit', permissionSkipped: 'Später in Einstellungen aktivierbar.', cameraTitle: 'Trefft euch von Angesicht zu Angesicht', cameraBody: 'Die Kamera wird nur für die Verifizierung oder Videoanrufe verwendet.', allowCamera: 'Kamera erlauben', skipForNow: 'Vorerst überspringen', cameraGranted: 'Kamera bereit', cameraSkipped: 'Später in Einstellungen aktivierbar.', verifyTitle: 'Ein letzter Echtheitscheck', verifyBody: 'Sprich drei Zahlen laut. Die lokale Demo lädt keine Aufnahme hoch und speichert sie nicht.', startCheck: 'Prüfung starten', verifyPrivacy: 'Die Probe wird nicht deinem Profil hinzugefügt.', digitsTitle: 'Sprich diese Zahlen', digitsBody: 'Sprich deutlich in einem Atemzug.', saidAll: 'Alle drei gesagt', couldntHear: 'Nicht gehört?', cancel: 'Abbrechen', failedTitle: 'Dieser Versuch konnte nicht bestätigt werden', failedBody: 'Nichts wurde gesendet. Versuche es an einem ruhigen Ort erneut.', tips: 'KURZE TIPPS', tipItems: ['Blick ins Licht', 'Telefon ruhig halten', 'Alle Zahlen deutlich sagen'], tryAgain: 'Erneut versuchen', contactSupport: 'Support kontaktieren', creating: 'Konto wird erstellt…', submitError: 'Dein Konto wurde nicht erstellt. Prüfe die Meldung und versuche es erneut.', emailInUse: 'Für diese E-Mail besteht bereits ein Konto. Gehe zu Schritt 1 oder melde dich an.', returnToAccount: 'Zurück zu Schritt 1', completeKicker: 'REGISTRIERUNG ABGESCHLOSSEN', completeTitle: (name) => `Du bist dabei, ${name}`, completeBody: 'Dein OiVox-Profil ist bereit. Nimm deine ersten sieben Sekunden auf.', record7: 'Meine 7 Sekunden aufnehmen', languageSettings: 'App-Sprache ändern',
    profileSubtitle: 'Foto und Spitzname sind erforderlich.',
  },
  ja: {
    avatarRequired: '続けるにはプロフィール写真を選んでください。', avatarCancelled: '写真が選択されていません。プロフィール写真を選んでください。', avatarPermissionDenied: '写真へのアクセスが許可されませんでした。再試行するか、別の方法を使ってください。', avatarDecodeFailed: 'この写真を開けませんでした。別の画像を選んでください。', avatarProcessingFailed: 'この写真を準備できませんでした。もう一度お試しください。', chooseFromPhotos: '写真から選ぶ', takePhoto: '写真を撮る', returnToProfile: 'ステップ2に戻る',
    back: '戻る', skip: 'スキップ', continue: '続ける', done: '完了', step: (n) => `7ステップ中 ${n}`, profileTitle: 'ニックネームを選ぶ', nickname: 'ニックネーム', nicknamePlaceholder: 'どんな名前で呼ばれたいですか？', languages: '話せる言語', photoAction: '写真を選ぶ', privacyTitle: '公開する情報は自分で選べます', privacyBody: '本名、メール、正確な位置情報は非公開です。', nicknameRequired: '1〜32文字のニックネームを入力してください。', question: (n) => `6問中 ${n}問目`, questionNote: '体験の調整にだけ使い、後から変更できます。', interestTitle: '好きなことは？', interestSubtitle: '最初の会話のために興味を2〜5個選んでください。', selected: '選択中', chooseMore: '2個以上選んでください。', buildProfile: 'プロフィールを作成', communicationTitle: 'コミュニケーションプロフィール', communicationSubtitle: '回答から作成したプレビューです。', iSpeak: '言語', reply: '返信', online: 'オンライン', curiousAbout: '興味のある地域', editAnswers: '回答を編集', micTitle: '声を世界へ', micBody: '7秒クリップ、音声メッセージ、通話にマイクを使用します。', allowMic: 'マイクを許可', notNow: '今はしない', permissionGranted: 'マイクの準備完了', permissionSkipped: '後で設定から有効にできます。', cameraTitle: '顔を見て話そう', cameraBody: 'カメラは本人確認または1対1のビデオ通話でのみ使います。', allowCamera: 'カメラを許可', skipForNow: '今はスキップ', cameraGranted: 'カメラの準備完了', cameraSkipped: '後で設定から有効にできます。', verifyTitle: '最後の本人確認', verifyBody: '3つの数字を声に出してください。ローカルデモは録音を送信・保存しません。', startCheck: '確認を開始', verifyPrivacy: '確認サンプルはプロフィールに追加されません。', digitsTitle: '数字を読んでください', digitsBody: 'ひと息ではっきり話してください。', saidAll: '3つとも言いました', couldntHear: '聞こえませんでしたか？', cancel: 'キャンセル', failedTitle: 'このテイクを確認できませんでした', failedBody: '何も送信されていません。静かな場所で顔を枠に合わせて再試行してください。', tips: '簡単なヒント', tipItems: ['明るい方を向く', '端末を動かさない', '3つの数字をはっきり言う'], tryAgain: 'もう一度試す', contactSupport: 'サポートに連絡', creating: 'アカウントを作成中…', submitError: 'アカウントは作成されていません。内容を確認して再試行してください。', emailInUse: 'このメールには既にアカウントがあります。ステップ1に戻るかログインしてください。', returnToAccount: 'ステップ1に戻る', completeKicker: '登録完了', completeTitle: (name) => `${name}さん、ようこそ`, completeBody: 'OiVoxプロフィールの準備ができました。最初の7秒を録音しましょう。', record7: '7秒を録音', languageSettings: 'アプリ言語を変更',
    profileSubtitle: '写真とニックネームは必須です。',
  },
  ko: {
    avatarRequired: '계속하려면 프로필 사진을 선택해 주세요.', avatarCancelled: '사진이 선택되지 않았습니다. 프로필 사진을 선택해 주세요.', avatarPermissionDenied: '사진 접근이 허용되지 않았습니다. 다시 시도하거나 다른 방법을 이용해 주세요.', avatarDecodeFailed: '이 사진을 열 수 없습니다. 다른 이미지를 선택해 주세요.', avatarProcessingFailed: '이 사진을 준비할 수 없습니다. 다시 시도해 주세요.', chooseFromPhotos: '사진에서 선택', takePhoto: '사진 촬영', returnToProfile: '2단계로 돌아가기',
    back: '뒤로', skip: '건너뛰기', continue: '계속', done: '완료', step: (n) => `7단계 중 ${n}단계`, profileTitle: '닉네임을 골라주세요', nickname: '닉네임', nicknamePlaceholder: '어떤 이름으로 불리고 싶나요?', languages: '사용 언어', photoAction: '사진 선택', privacyTitle: '선택한 정보만 공개됩니다', privacyBody: '실명, 이메일, 정확한 위치는 비공개입니다.', nicknameRequired: '1~32자의 닉네임을 입력해 주세요.', question: (n) => `6개 질문 중 ${n}번`, questionNote: '경험을 맞추는 데만 사용되며 나중에 바꿀 수 있어요.', interestTitle: '무엇을 좋아하나요?', interestSubtitle: '첫 대화를 위해 관심사 2~5개를 골라주세요.', selected: '선택됨', chooseMore: '관심사를 두 개 이상 선택해 주세요.', buildProfile: '프로필 만들기', communicationTitle: '나의 소통 프로필', communicationSubtitle: '답변을 바탕으로 만든 미리보기입니다.', iSpeak: '사용 언어', reply: '답장', online: '접속 시간', curiousAbout: '관심 지역', editAnswers: '답변 수정', micTitle: '목소리를 세상으로', micBody: '7초 클립, 음성 메시지, 통화에 마이크를 사용합니다.', allowMic: '마이크 허용', notNow: '나중에', permissionGranted: '마이크 준비 완료', permissionSkipped: '설정에서 나중에 켤 수 있어요.', cameraTitle: '얼굴을 보며 만나요', cameraBody: '카메라는 본인 확인 또는 1:1 영상 통화에서만 사용합니다.', allowCamera: '카메라 허용', skipForNow: '지금은 건너뛰기', cameraGranted: '카메라 준비 완료', cameraSkipped: '설정에서 나중에 켤 수 있어요.', verifyTitle: '마지막 본인 확인', verifyBody: '숫자 세 개를 소리 내어 읽어주세요. 로컬 데모는 녹음을 전송하거나 저장하지 않습니다.', startCheck: '확인 시작', verifyPrivacy: '확인 샘플은 프로필에 추가되지 않습니다.', digitsTitle: '숫자를 말해 주세요', digitsBody: '한 번에 또렷하게 말해 주세요.', saidAll: '세 개 모두 말했어요', couldntHear: '제 목소리가 안 들리나요?', cancel: '취소', failedTitle: '이번 확인을 완료하지 못했어요', failedBody: '아무것도 전송되지 않았습니다. 조용한 곳에서 얼굴을 원 안에 맞추고 다시 시도하세요.', tips: '빠른 도움말', tipItems: ['빛을 바라보기', '휴대폰을 고정하기', '숫자 세 개를 또렷하게 말하기'], tryAgain: '다시 시도', contactSupport: '고객 지원', creating: '계정을 만드는 중…', submitError: '계정이 생성되지 않았습니다. 메시지를 확인하고 다시 시도하세요.', emailInUse: '이미 계정이 있는 이메일입니다. 1단계로 돌아가거나 로그인하세요.', returnToAccount: '1단계로 돌아가기', completeKicker: '가입 완료', completeTitle: (name) => `${name}님, 환영해요`, completeBody: 'OiVox 프로필이 준비되었습니다. 첫 7초를 녹음해 보세요.', record7: '7초 녹음하기', languageSettings: '앱 언어 변경',
    profileSubtitle: '사진과 닉네임은 필수입니다.',
  },
}

const localizedQuestions = {
  ar: ['ما المناطق التي تثير فضولك؟', 'ما اللغات التي تتحدثها؟', 'عمّ تحب أن تتحدث؟', 'كيف تفضّل الرد؟', 'متى تكون متصلًا عادةً؟', 'بماذا يساعدك الذكاء الاصطناعي؟'],
  he: ['אילו אזורים מעניינים אותך?', 'אילו שפות אתה מדבר?', 'על מה כיף לך לדבר?', 'איך נוח לך להגיב?', 'מתי אתה בדרך כלל מחובר?', 'במה תרצה עזרה מ־AI?'],
  tr: ['Hangi bölgeleri merak ediyorsun?', 'Hangi dilleri konuşuyorsun?', 'Neler hakkında konuşmayı seversin?', 'Nasıl yanıt vermeyi tercih edersin?', 'Genelde ne zaman çevrimiçisin?', 'Yapay zekâ sana nasıl yardımcı olsun?'],
  fr: ['Quelles régions vous intéressent ?', 'Quelles langues parlez-vous ?', 'De quoi aimez-vous parler ?', 'Comment préférez-vous répondre ?', 'Quand êtes-vous généralement en ligne ?', 'Comment l’IA peut-elle vous aider ?'],
  de: ['Welche Regionen interessieren dich?', 'Welche Sprachen sprichst du?', 'Worüber redest du gern?', 'Wie antwortest du am liebsten?', 'Wann bist du meistens online?', 'Wobei soll KI helfen?'],
  ja: ['興味のある地域は？', '話せる言語は？', '好きな話題は？', 'どんな返信が好きですか？', '普段オンラインになる時間は？', 'AIに何を手伝ってほしいですか？'],
  ko: ['어떤 지역이 궁금한가요?', '어떤 언어를 사용하나요?', '어떤 이야기를 좋아하나요?', '어떤 방식으로 답장하고 싶나요?', '보통 언제 접속하나요?', 'AI가 무엇을 도와주면 좋을까요?'],
}

const localizedQuestionOptions = {
  ar: [
    ['الشرق الأوسط', 'أوروبا', 'شرق آسيا', 'أي مكان في العالم'], ['الإنجليزية', 'العربية', 'لغة أخرى', 'ثلاث لغات أو أكثر'], ['الطعام والحياة اليومية', 'السفر والمدن', 'الأفلام والموسيقى', 'قليل من كل شيء'], ['صوت لمدة 7 ثوانٍ', 'قلب أولًا', 'رسائل نصية', 'ما يبدو مناسبًا'], ['الصباح', 'استراحة الغداء', 'المساء', 'آخر الليل'], ['ترجمة الأصوات', 'اقتراح افتتاحيات', 'كلاهما', 'لا شيء الآن'],
  ],
  he: [
    ['המזרח התיכון', 'אירופה', 'מזרח אסיה', 'בכל מקום בעולם'], ['אנגלית', 'ערבית', 'שפה אחרת', 'שלוש שפות או יותר'], ['אוכל וחיי יום־יום', 'טיולים וערים', 'סרטים ומוזיקה', 'קצת מהכול'], ['קול של 7 שניות', 'קודם לב', 'הודעות טקסט', 'מה שמרגיש נכון'], ['בוקר', 'הפסקת צהריים', 'ערב', 'לילה מאוחר'], ['תרגום קולות', 'הצעות לפתיחה', 'שניהם', 'כלום כרגע'],
  ],
  tr: [
    ['Orta Doğu', 'Avrupa', 'Doğu Asya', 'Dünyanın her yeri'], ['İngilizce', 'Arapça', 'Başka bir dil', 'Üç veya daha fazla'], ['Yemek ve günlük yaşam', 'Seyahat ve şehirler', 'Film ve müzik', 'Her şeyden biraz'], ['7 saniyelik ses', 'Önce bir kalp', 'Metin mesajı', 'İçimden geldiği gibi'], ['Sabah', 'Öğle arası', 'Akşam', 'Gece geç'], ['Sesleri çevir', 'Açılış öner', 'İkisi de', 'Şimdilik hiçbiri'],
  ],
  fr: [
    ['Moyen-Orient', 'Europe', 'Asie de l’Est', 'Partout dans le monde'], ['Anglais', 'Arabe', 'Une autre langue', 'Trois langues ou plus'], ['Cuisine et quotidien', 'Voyages et villes', 'Films et musique', 'Un peu de tout'], ['Une réponse vocale de 7 s', 'Un cœur d’abord', 'Messages texte', 'Selon l’envie'], ['Matin', 'Pause déjeuner', 'Soir', 'Tard le soir'], ['Traduire les voix', 'Suggérer une ouverture', 'Les deux', 'Rien pour le moment'],
  ],
  de: [
    ['Naher Osten', 'Europa', 'Ostasien', 'Überall auf der Welt'], ['Englisch', 'Arabisch', 'Eine andere Sprache', 'Drei oder mehr'], ['Essen und Alltag', 'Reisen und Städte', 'Filme und Musik', 'Von allem etwas'], ['7-Sekunden-Antwort', 'Zuerst ein Herz', 'Textnachrichten', 'Wie es sich richtig anfühlt'], ['Morgens', 'Mittagspause', 'Abends', 'Spät nachts'], ['Stimmen übersetzen', 'Einstiege vorschlagen', 'Beides', 'Vorerst nichts'],
  ],
  ja: [
    ['中東', 'ヨーロッパ', '東アジア', '世界中どこでも'], ['英語', 'アラビア語', 'その他の言語', '3言語以上'], ['食と日常', '旅と街', '映画と音楽', '何でも少しずつ'], ['7秒の音声', 'まずハート', 'テキスト', 'その時の気分'], ['朝', '昼休み', '夕方', '深夜'], ['音声を翻訳', '会話のきっかけ', '両方', '今は不要'],
  ],
  ko: [
    ['중동', '유럽', '동아시아', '세계 어디든'], ['영어', '아랍어', '다른 언어', '세 가지 이상'], ['음식과 일상', '여행과 도시', '영화와 음악', '모두 조금씩'], ['7초 음성 답장', '먼저 하트', '문자 메시지', '편한 방식'], ['아침', '점심시간', '저녁', '늦은 밤'], ['음성 번역', '첫마디 추천', '둘 다', '지금은 필요 없음'],
  ],
}

const localizedInterestLabels = {
  ar: ['الطعام والطبخ', 'السفر', 'الأفلام', 'الموسيقى', 'التصوير', 'الرياضة', 'الكتب', 'الألعاب', 'الحيوانات', 'المهرجانات', 'حياة المدينة', 'اللغات'],
  he: ['אוכל ובישול', 'טיולים', 'סרטים', 'מוזיקה', 'צילום', 'ספורט', 'ספרים', 'משחקים', 'חיות מחמד', 'פסטיבלים', 'חיי עיר', 'שפות'],
  tr: ['Yemek ve mutfak', 'Seyahat', 'Filmler', 'Müzik', 'Fotoğraf', 'Spor', 'Kitaplar', 'Oyunlar', 'Evcil hayvanlar', 'Festivaller', 'Şehir yaşamı', 'Diller'],
  fr: ['Cuisine', 'Voyages', 'Films', 'Musique', 'Photographie', 'Sports', 'Livres', 'Jeux', 'Animaux', 'Festivals', 'Vie urbaine', 'Langues'],
  de: ['Essen & Kochen', 'Reisen', 'Filme', 'Musik', 'Fotografie', 'Sport', 'Bücher', 'Spiele', 'Haustiere', 'Festivals', 'Stadtleben', 'Sprachen'],
  ja: ['食と料理', '旅行', '映画', '音楽', '写真', 'スポーツ', '本', 'ゲーム', 'ペット', 'お祭り', '街の暮らし', '言語'],
  ko: ['음식과 요리', '여행', '영화', '음악', '사진', '스포츠', '책', '게임', '반려동물', '축제', '도시 생활', '언어'],
}

const localizedFlowExtras = {
  en: {
    helloWorld: 'hello, world', digitWord: 'three', recording: 'REC', completeCommunity: '46 countries are listening today',
    micBenefits: ['Only while you hold record', 'Never captured in the background', 'Re-record as many times as you like'],
    cameraBenefits: ['Used only for the liveness check', 'Recording deleted right after', 'Never shown on your profile'],
  },
  ar: {
    helloWorld: 'مرحبًا بالعالم', digitWord: 'ثلاثة', recording: 'تسجيل', completeCommunity: 'يستمع اليوم أشخاص من 46 دولة',
    micBenefits: ['يُستخدم فقط أثناء الضغط للتسجيل', 'لا يُسجّل أبدًا في الخلفية', 'يمكنك إعادة التسجيل بلا حدود'],
    cameraBenefits: ['تُستخدم فقط للتحقق من الحيوية', 'يُحذف التسجيل مباشرة بعد التحقق', 'لن يظهر التسجيل في ملفك'],
  },
  he: {
    helloWorld: 'שלום, עולם', digitWord: 'שלוש', recording: 'הקלטה', completeCommunity: '46 מדינות מקשיבות היום',
    micBenefits: ['פועל רק בזמן לחיצה על הקלטה', 'לעולם לא מקליט ברקע', 'אפשר להקליט מחדש ללא הגבלה'],
    cameraBenefits: ['משמשת רק לבדיקת החיוּת', 'ההקלטה נמחקת מיד לאחר מכן', 'ההקלטה לא תוצג בפרופיל'],
  },
  tr: {
    helloWorld: 'merhaba, dünya', digitWord: 'üç', recording: 'KAYIT', completeCommunity: 'Bugün 46 ülke dinliyor',
    micBenefits: ['Yalnızca kayıt düğmesini tutarken kullanılır', 'Arka planda asla kayıt yapmaz', 'İstediğin kadar yeniden kaydedebilirsin'],
    cameraBenefits: ['Yalnızca canlılık kontrolünde kullanılır', 'Kayıt hemen ardından silinir', 'Profilinde asla gösterilmez'],
  },
  fr: {
    helloWorld: 'bonjour, le monde', digitWord: 'trois', recording: 'REC', completeCommunity: '46 pays écoutent aujourd’hui',
    micBenefits: ['Utilisé uniquement pendant l’enregistrement', 'Jamais activé en arrière-plan', 'Réenregistrez autant de fois que nécessaire'],
    cameraBenefits: ['Utilisée uniquement pour le contrôle de présence', 'Enregistrement supprimé juste après', 'Jamais affiché sur votre profil'],
  },
  de: {
    helloWorld: 'hallo, welt', digitWord: 'drei', recording: 'REC', completeCommunity: 'Heute hören 46 Länder zu',
    micBenefits: ['Nur beim Gedrückthalten der Aufnahme aktiv', 'Niemals im Hintergrund aufgezeichnet', 'Beliebig oft neu aufnehmen'],
    cameraBenefits: ['Nur für die Echtheitsprüfung verwendet', 'Aufnahme wird direkt danach gelöscht', 'Niemals in deinem Profil sichtbar'],
  },
  ja: {
    helloWorld: 'こんにちは、世界', digitWord: 'さん', recording: '録音中', completeCommunity: '今日は46か国が聴いています',
    micBenefits: ['録音ボタンを押している間だけ使用', 'バックグラウンドでは録音しません', '何度でも録り直せます'],
    cameraBenefits: ['本人確認にのみ使用', '録画は確認後すぐに削除', 'プロフィールには表示されません'],
  },
  ko: {
    helloWorld: '안녕, 세상', digitWord: '삼', recording: '녹음', completeCommunity: '오늘 46개국이 듣고 있어요',
    micBenefits: ['녹음 버튼을 누르는 동안에만 사용', '백그라운드에서는 녹음하지 않음', '원하는 만큼 다시 녹음 가능'],
    cameraBenefits: ['실제 사용자 확인에만 사용', '확인 직후 녹화 삭제', '프로필에는 절대 표시되지 않음'],
  },
}

export function registrationContent(locale) {
  const copy = { ...en, ...localizedFlowExtras.en, ...(translations[locale] || {}), ...(localizedFlowExtras[locale] || {}) }
  if (localizedQuestions[locale]) copy.questions = questions.map((question, index) => ({
    ...question,
    title: localizedQuestions[locale][index],
    options: question.options.map(([id], optionIndex) => [id, localizedQuestionOptions[locale][index][optionIndex]]),
  }))
  return copy
}

export function registrationInterests(locale) {
  const labels = localizedInterestLabels[locale]
  return labels ? interests.map(([id], index) => [id, labels[index]]) : interests
}
