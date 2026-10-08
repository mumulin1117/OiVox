const content = Object.freeze({
  en: {
    nativeOnly: 'This action is available in the iPhone app.', photoLibraryRequired: 'Photo library access is required. Enable it in iOS Settings and try again.', microphoneRequired: 'Microphone access is required to continue. Enable it in iOS Settings and try again.', cameraRequired: 'Camera access is required to continue. Enable it in iOS Settings and try again.',
    settingsTitle: 'Permissions needed', microphoneSettingsBody: 'Open iOS Settings > Apps > OiVox, then turn on Microphone.', cameraSettingsBody: 'Open iOS Settings > Apps > OiVox, then turn on Camera.', bothSettingsBody: 'Open iOS Settings > Apps > OiVox, then turn on Microphone and Camera.', openSettings: 'Open Settings', close: 'Close', settingsOpenFailed: 'Settings could not be opened. Open them manually and try again.',
  },
  ar: {
    nativeOnly: 'هذا الإجراء متاح في تطبيق iPhone.', photoLibraryRequired: 'يلزم السماح بالوصول إلى مكتبة الصور. فعّله في إعدادات iOS ثم حاول مجددًا.', microphoneRequired: 'يلزم السماح بالميكروفون للمتابعة. فعّله في إعدادات iOS ثم حاول مجددًا.', cameraRequired: 'يلزم السماح بالكاميرا للمتابعة. فعّلها في إعدادات iOS ثم حاول مجددًا.',
    settingsTitle: 'الأذونات مطلوبة', microphoneSettingsBody: 'افتح إعدادات iOS > التطبيقات > OiVox، ثم فعّل الميكروفون.', cameraSettingsBody: 'افتح إعدادات iOS > التطبيقات > OiVox، ثم فعّل الكاميرا.', bothSettingsBody: 'افتح إعدادات iOS > التطبيقات > OiVox، ثم فعّل الميكروفون والكاميرا.', openSettings: 'فتح الإعدادات', close: 'إغلاق', settingsOpenFailed: 'تعذر فتح الإعدادات. افتحها يدويًا ثم حاول مجددًا.',
  },
  he: {
    nativeOnly: 'הפעולה זמינה באפליקציית iPhone.', photoLibraryRequired: 'נדרשת גישה לספריית התמונות. יש לאפשר אותה בהגדרות iOS ולנסות שוב.', microphoneRequired: 'נדרשת גישה למיקרופון כדי להמשיך. יש לאפשר אותה בהגדרות iOS ולנסות שוב.', cameraRequired: 'נדרשת גישה למצלמה כדי להמשיך. יש לאפשר אותה בהגדרות iOS ולנסות שוב.',
    settingsTitle: 'נדרשות הרשאות', microphoneSettingsBody: 'פתחו את הגדרות iOS > יישומים > OiVox והפעילו את המיקרופון.', cameraSettingsBody: 'פתחו את הגדרות iOS > יישומים > OiVox והפעילו את המצלמה.', bothSettingsBody: 'פתחו את הגדרות iOS > יישומים > OiVox והפעילו את המיקרופון והמצלמה.', openSettings: 'פתיחת הגדרות', close: 'סגירה', settingsOpenFailed: 'לא ניתן לפתוח את ההגדרות. פתחו אותן ידנית ונסו שוב.',
  },
  tr: {
    nativeOnly: 'Bu işlem iPhone uygulamasında kullanılabilir.', photoLibraryRequired: 'Fotoğraf arşivi izni gerekir. iOS Ayarları’ndan izin verip tekrar dene.', microphoneRequired: 'Devam etmek için mikrofon izni gerekir. iOS Ayarları’ndan izin verip tekrar dene.', cameraRequired: 'Devam etmek için kamera izni gerekir. iOS Ayarları’ndan izin verip tekrar dene.',
    settingsTitle: 'İzinler gerekli', microphoneSettingsBody: 'iOS Ayarları > Uygulamalar > OiVox bölümünü açıp Mikrofonu etkinleştir.', cameraSettingsBody: 'iOS Ayarları > Uygulamalar > OiVox bölümünü açıp Kamerayı etkinleştir.', bothSettingsBody: 'iOS Ayarları > Uygulamalar > OiVox bölümünü açıp Mikrofon ve Kamerayı etkinleştir.', openSettings: 'Ayarları Aç', close: 'Kapat', settingsOpenFailed: 'Ayarlar açılamadı. Ayarları elle açıp tekrar dene.',
  },
  fr: {
    nativeOnly: 'Cette action est disponible dans l’app iPhone.', photoLibraryRequired: 'L’accès à la photothèque est requis. Activez-le dans Réglages iOS, puis réessayez.', microphoneRequired: 'L’accès au microphone est requis pour continuer. Activez-le dans Réglages iOS, puis réessayez.', cameraRequired: 'L’accès à la caméra est requis pour continuer. Activez-le dans Réglages iOS, puis réessayez.',
    settingsTitle: 'Autorisations requises', microphoneSettingsBody: 'Ouvrez Réglages iOS > Apps > OiVox, puis activez le microphone.', cameraSettingsBody: 'Ouvrez Réglages iOS > Apps > OiVox, puis activez la caméra.', bothSettingsBody: 'Ouvrez Réglages iOS > Apps > OiVox, puis activez le microphone et la caméra.', openSettings: 'Ouvrir Réglages', close: 'Fermer', settingsOpenFailed: 'Impossible d’ouvrir Réglages. Ouvrez-les manuellement, puis réessayez.',
  },
  de: {
    nativeOnly: 'Diese Aktion ist in der iPhone-App verfügbar.', photoLibraryRequired: 'Zugriff auf die Fotomediathek ist erforderlich. Aktiviere ihn in den iOS-Einstellungen und versuche es erneut.', microphoneRequired: 'Mikrofonzugriff ist zum Fortfahren erforderlich. Aktiviere ihn in den iOS-Einstellungen und versuche es erneut.', cameraRequired: 'Kamerazugriff ist zum Fortfahren erforderlich. Aktiviere ihn in den iOS-Einstellungen und versuche es erneut.',
    settingsTitle: 'Berechtigungen erforderlich', microphoneSettingsBody: 'Öffne iOS-Einstellungen > Apps > OiVox und aktiviere das Mikrofon.', cameraSettingsBody: 'Öffne iOS-Einstellungen > Apps > OiVox und aktiviere die Kamera.', bothSettingsBody: 'Öffne iOS-Einstellungen > Apps > OiVox und aktiviere Mikrofon und Kamera.', openSettings: 'Einstellungen öffnen', close: 'Schließen', settingsOpenFailed: 'Die Einstellungen konnten nicht geöffnet werden. Öffne sie manuell und versuche es erneut.',
  },
  ja: {
    nativeOnly: 'この操作はiPhoneアプリで利用できます。', photoLibraryRequired: '写真ライブラリへのアクセスが必要です。iOSの設定で許可してから再試行してください。', microphoneRequired: '続行するにはマイクの許可が必要です。iOSの設定で許可してから再試行してください。', cameraRequired: '続行するにはカメラの許可が必要です。iOSの設定で許可してから再試行してください。',
    settingsTitle: '権限が必要です', microphoneSettingsBody: 'iOSの「設定」>「アプリ」>「OiVox」を開き、マイクをオンにしてください。', cameraSettingsBody: 'iOSの「設定」>「アプリ」>「OiVox」を開き、カメラをオンにしてください。', bothSettingsBody: 'iOSの「設定」>「アプリ」>「OiVox」を開き、マイクとカメラをオンにしてください。', openSettings: '設定を開く', close: '閉じる', settingsOpenFailed: '設定を開けませんでした。手動で開いてから再試行してください。',
  },
  ko: {
    nativeOnly: '이 작업은 iPhone 앱에서 사용할 수 있습니다.', photoLibraryRequired: '사진 보관함 권한이 필요합니다. iOS 설정에서 허용한 후 다시 시도하세요.', microphoneRequired: '계속하려면 마이크 권한이 필요합니다. iOS 설정에서 허용한 후 다시 시도하세요.', cameraRequired: '계속하려면 카메라 권한이 필요합니다. iOS 설정에서 허용한 후 다시 시도하세요.',
    settingsTitle: '권한이 필요합니다', microphoneSettingsBody: 'iOS 설정 > 앱 > OiVox에서 마이크를 켜 주세요.', cameraSettingsBody: 'iOS 설정 > 앱 > OiVox에서 카메라를 켜 주세요.', bothSettingsBody: 'iOS 설정 > 앱 > OiVox에서 마이크와 카메라를 켜 주세요.', openSettings: '설정 열기', close: '닫기', settingsOpenFailed: '설정을 열 수 없습니다. 직접 연 후 다시 시도하세요.',
  },
})

export const permissionContent = (locale) => content[locale] || content.en
export const permissionLocales = Object.freeze(Object.keys(content))
