const languageOptions = Object.freeze([
  Object.freeze({ id: 'en', label: 'English' }),
  Object.freeze({ id: 'ar', label: 'العربية' }),
  Object.freeze({ id: 'tr', label: 'Türkçe' }),
  Object.freeze({ id: 'he', label: 'עברית' }),
  Object.freeze({ id: 'fr', label: 'Français' }),
  Object.freeze({ id: 'de', label: 'Deutsch' }),
  Object.freeze({ id: 'ja', label: '日本語' }),
  Object.freeze({ id: 'ko', label: '한국어' }),
])

const copy = Object.freeze({
  en: Object.freeze({ title: 'Filter voices', cancel: 'Cancel', reset: 'Reset', purchaseOnlyNote: 'Filters apply only to coin-purchased voices; if there aren’t enough matches, other voices fill the remaining spots.', region: 'REGION', regions: { middleEast: 'Middle East', europe: 'Europe', eastAsia: 'East Asia', anywhere: 'Anywhere' }, language: 'LANGUAGE THEY SPEAK', more: 'MORE', onlineNow: 'Online now', onlineHint: 'Only people awake at this hour', notHeardYet: 'Not heard yet', notHeardHint: 'Hide voices you already played', showVoices: 'Show voices' }),
  ar: Object.freeze({ title: 'تصفية الأصوات', cancel: 'إلغاء', reset: 'إعادة ضبط', purchaseOnlyNote: 'تُطبّق الفلاتر فقط على الأصوات المشتراة بالعملات، وإذا لم تكفِ النتائج المطابقة تُستكمل الفرص بأصوات أخرى.', region: 'المنطقة', regions: { middleEast: 'الشرق الأوسط', europe: 'أوروبا', eastAsia: 'شرق آسيا', anywhere: 'أي مكان' }, language: 'اللغة التي يتحدثون بها', more: 'المزيد', onlineNow: 'متصل الآن', onlineHint: 'الأشخاص المستيقظون في هذا الوقت فقط', notHeardYet: 'لم أسمعه بعد', notHeardHint: 'إخفاء الأصوات التي شغّلتها من قبل', showVoices: 'عرض الأصوات' }),
  he: Object.freeze({ title: 'סינון קולות', cancel: 'ביטול', reset: 'איפוס', purchaseOnlyNote: 'הסינון חל רק על קולות שנרכשו במטבעות; אם אין מספיק התאמות, החסר יושלם בקולות אחרים.', region: 'אזור', regions: { middleEast: 'המזרח התיכון', europe: 'אירופה', eastAsia: 'מזרח אסיה', anywhere: 'מכל מקום' }, language: 'השפה שהם מדברים', more: 'עוד', onlineNow: 'מחוברים עכשיו', onlineHint: 'רק אנשים שערים בשעה זו', notHeardYet: 'עדיין לא נשמע', notHeardHint: 'הסתרת קולות שכבר נוגנו', showVoices: 'הצגת קולות' }),
  tr: Object.freeze({ title: 'Sesleri filtrele', cancel: 'İptal', reset: 'Sıfırla', purchaseOnlyNote: 'Filtreler yalnızca jetonla alınan seslerde uygulanır; yeterli eşleşme yoksa kalan yerler diğer seslerle tamamlanır.', region: 'BÖLGE', regions: { middleEast: 'Orta Doğu', europe: 'Avrupa', eastAsia: 'Doğu Asya', anywhere: 'Her yer' }, language: 'KONUŞTUKLARI DİL', more: 'DAHA FAZLA', onlineNow: 'Şimdi çevrimiçi', onlineHint: 'Yalnızca bu saatte uyanık olan kişiler', notHeardYet: 'Henüz dinlenmedi', notHeardHint: 'Daha önce dinlediğin sesleri gizle', showVoices: 'Sesleri göster' }),
  fr: Object.freeze({ title: 'Filtrer les voix', cancel: 'Annuler', reset: 'Réinitialiser', purchaseOnlyNote: 'Les filtres s’appliquent uniquement aux voix achetées avec des pièces ; s’il manque des correspondances, d’autres voix complètent le lot.', region: 'RÉGION', regions: { middleEast: 'Moyen-Orient', europe: 'Europe', eastAsia: 'Asie de l’Est', anywhere: 'Partout' }, language: 'LANGUE PARLÉE', more: 'PLUS', onlineNow: 'En ligne', onlineHint: 'Uniquement les personnes éveillées à cette heure', notHeardYet: 'Pas encore écouté', notHeardHint: 'Masquer les voix déjà écoutées', showVoices: 'Afficher les voix' }),
  de: Object.freeze({ title: 'Stimmen filtern', cancel: 'Abbrechen', reset: 'Zurücksetzen', purchaseOnlyNote: 'Filter gelten nur für mit Münzen gekaufte Stimmen; fehlen passende Treffer, werden die übrigen Plätze mit anderen Stimmen aufgefüllt.', region: 'REGION', regions: { middleEast: 'Naher Osten', europe: 'Europa', eastAsia: 'Ostasien', anywhere: 'Überall' }, language: 'GESPROCHENE SPRACHE', more: 'MEHR', onlineNow: 'Jetzt online', onlineHint: 'Nur Personen, die um diese Zeit wach sind', notHeardYet: 'Noch nicht gehört', notHeardHint: 'Bereits abgespielte Stimmen ausblenden', showVoices: 'Stimmen anzeigen' }),
  ja: Object.freeze({ title: '声を絞り込む', cancel: 'キャンセル', reset: 'リセット', purchaseOnlyNote: 'フィルターはコインで購入する音声にのみ適用され、条件に合う音声が足りない場合は、ほかの音声で不足分を補います。', region: '地域', regions: { middleEast: '中東', europe: 'ヨーロッパ', eastAsia: '東アジア', anywhere: 'すべての地域' }, language: '相手が話す言語', more: 'その他', onlineNow: 'オンライン中', onlineHint: '現在起きている人のみ', notHeardYet: 'まだ聞いていない', notHeardHint: '再生済みの声を非表示', showVoices: '声を表示' }),
  ko: Object.freeze({ title: '목소리 필터', cancel: '취소', reset: '초기화', purchaseOnlyNote: '필터는 코인으로 구매한 목소리에만 적용되고, 조건에 맞는 목소리가 부족하면 다른 목소리로 수량을 채웁니다.', region: '지역', regions: { middleEast: '중동', europe: '유럽', eastAsia: '동아시아', anywhere: '모든 지역' }, language: '상대가 사용하는 언어', more: '더 보기', onlineNow: '현재 온라인', onlineHint: '현재 시간에 깨어 있는 사람만', notHeardYet: '아직 듣지 않음', notHeardHint: '이미 재생한 목소리 숨기기', showVoices: '목소리 보기' }),
})

export const discoveryFilterLanguageOptions = languageOptions

export function discoveryFilterContent(locale) {
  return copy[locale] || copy.en
}
