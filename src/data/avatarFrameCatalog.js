export const avatarFrameCatalog = Object.freeze([
  { id: 'none', price: 0, ring: 'none' },
  { id: 'cream', price: 30, ring: '#E7D3B1' },
  { id: 'terracotta', price: 30, ring: '#A85A27' },
  { id: 'uae', price: 50, ring: 'linear-gradient(135deg,#00732F,#fff,#000)' },
  { id: 'japan', price: 50, ring: 'linear-gradient(135deg,#fff,#BC002D,#fff)' },
  { id: 'turkiye', price: 50, ring: 'linear-gradient(135deg,#E30A17,#fff,#E30A17)' },
  { id: 'foodie', price: 80, ring: 'linear-gradient(135deg,#5E6B45,#FBE08A,#A85A27)' },
  { id: 'aurora', price: 80, ring: 'conic-gradient(from 0deg,#8CCBE8,#C9B6F5,#F498C0,#8CCBE8)', animated: true },
  { id: 'rare-gold', price: 100, ring: 'conic-gradient(from 0deg,#A85A27,#FBE08A,#fff,#A85A27)', animated: true },
])

const names = {
  en: ['None', 'Cream', 'Terracotta', 'UAE', 'Japan', 'Türkiye', 'Foodie', 'Aurora', 'Rare gold'],
  ar: ['بدون', 'كريمي', 'طيني', 'الإمارات', 'اليابان', 'تركيا', 'محب للطعام', 'شفق', 'ذهبي نادر'],
  he: ['ללא', 'שמנת', 'טרקוטה', 'איחוד האמירויות', 'יפן', 'טורקיה', 'חובב אוכל', 'זוהר', 'זהב נדיר'],
  tr: ['Yok', 'Krem', 'Toprak', 'BAE', 'Japonya', 'Türkiye', 'Gurme', 'Aurora', 'Nadir altın'],
  fr: ['Aucun', 'Crème', 'Terre cuite', 'ÉAU', 'Japon', 'Türkiye', 'Gourmand', 'Aurore', 'Or rare'],
  de: ['Keiner', 'Creme', 'Terrakotta', 'VAE', 'Japan', 'Türkei', 'Feinschmecker', 'Aurora', 'Seltenes Gold'],
  ja: ['なし', 'クリーム', 'テラコッタ', 'UAE', '日本', 'トルコ', 'フーディー', 'オーロラ', 'レアゴールド'],
  ko: ['없음', '크림', '테라코타', 'UAE', '일본', '튀르키예', '미식가', '오로라', '레어 골드'],
}

const en = {
  title: 'Avatar Frames', free: 'free', coins: '{count} coins', owned: 'Owned', inUse: 'In use', useFrame: 'Use this frame', useNoFrame: 'Use no frame', unlock: '{count} coins · unlock frame',
  note: 'Frames are in-app decoration only — no lotteries or loot boxes, and they can’t be exchanged for cash or goods.',
  insufficient: 'Not enough coins for this frame.', getCoins: 'Get Coins', unlocked: 'Frame unlocked permanently.', failed: 'The frame could not be unlocked. Your balance was not changed.',
  confirmTitle: 'Unlock this frame?', confirmBody: 'This frame will be yours permanently.', cost: 'Cost', balance: 'Your balance', after: 'Balance after', shortBy: 'You need', cancel: 'Not now', confirmPurchase: 'Unlock frame', processing: 'Unlocking…', insufficientTitle: 'Not enough coins', insufficientBody: 'You need {amount} more coins to unlock this frame.', purchaseNote: 'Coins are only charged after you confirm.',
}

const translations = {
  ar: { title: 'إطارات الصورة', free: 'مجاناً', coins: '{count} عملة', owned: 'مملوك', inUse: 'قيد الاستخدام', useFrame: 'استخدم هذا الإطار', useNoFrame: 'استخدم بدون إطار', unlock: '{count} عملة · فتح الإطار', note: 'الإطارات زينة داخل التطبيق فقط — لا سحب ولا صناديق حظ، ولا يمكن استبدالها بنقد أو سلع.', insufficient: 'لا توجد عملات كافية لهذا الإطار.', getCoins: 'شراء عملات', unlocked: 'تم فتح الإطار بشكل دائم.', failed: 'تعذر فتح الإطار. لم يتغير رصيدك.', confirmTitle: 'فتح هذا الإطار؟', confirmBody: 'سيبقى هذا الإطار ملكك بشكل دائم.', cost: 'التكلفة', balance: 'رصيدك', after: 'الرصيد بعد الشراء', shortBy: 'تحتاج إلى', cancel: 'ليس الآن', confirmPurchase: 'فتح الإطار', processing: 'جارٍ الفتح…', insufficientTitle: 'العملات غير كافية', insufficientBody: 'تحتاج إلى {amount} عملة إضافية لفتح هذا الإطار.', purchaseNote: 'لن تُخصم العملات إلا بعد التأكيد.' },
  he: { title: 'מסגרות תמונה', free: 'חינם', coins: '{count} מטבעות', owned: 'בבעלותך', inUse: 'בשימוש', useFrame: 'השתמש במסגרת', useNoFrame: 'השתמש ללא מסגרת', unlock: '{count} מטבעות · פתיחת מסגרת', note: 'המסגרות הן קישוט בתוך האפליקציה בלבד — בלי הגרלות או תיבות אוצר, ולא ניתן להמירן בכסף או בסחורה.', insufficient: 'אין מספיק מטבעות למסגרת הזו.', getCoins: 'רכישת מטבעות', unlocked: 'המסגרת נפתחה לצמיתות.', failed: 'לא ניתן לפתוח את המסגרת. היתרה לא השתנתה.', confirmTitle: 'לפתוח את המסגרת?', confirmBody: 'המסגרת תישאר בבעלותך לצמיתות.', cost: 'עלות', balance: 'היתרה שלך', after: 'יתרה לאחר הרכישה', shortBy: 'חסרים לך', cancel: 'לא עכשיו', confirmPurchase: 'פתיחת המסגרת', processing: 'פותח…', insufficientTitle: 'אין מספיק מטבעות', insufficientBody: 'נדרשים עוד {amount} מטבעות לפתיחת המסגרת.', purchaseNote: 'המטבעות יחויבו רק לאחר אישור.' },
  tr: { title: 'Avatar Çerçeveleri', free: 'ücretsiz', coins: '{count} jeton', owned: 'Senin', inUse: 'Kullanımda', useFrame: 'Bu çerçeveyi kullan', useNoFrame: 'Çerçevesiz kullan', unlock: '{count} jeton · çerçeveyi aç', note: 'Çerçeveler yalnızca uygulama içi süstür — çekiliş veya ganimet kutusu yok, nakit ya da eşyayla değiştirilemez.', insufficient: 'Bu çerçeve için yeterli jeton yok.', getCoins: 'Jeton al', unlocked: 'Çerçeve kalıcı olarak açıldı.', failed: 'Çerçeve açılamadı. Bakiyen değişmedi.', confirmTitle: 'Bu çerçeve açılsın mı?', confirmBody: 'Bu çerçeve kalıcı olarak senin olacak.', cost: 'Ücret', balance: 'Bakiyen', after: 'Kalan bakiye', shortBy: 'Gereken', cancel: 'Şimdi değil', confirmPurchase: 'Çerçeveyi aç', processing: 'Açılıyor…', insufficientTitle: 'Yeterli jeton yok', insufficientBody: 'Bu çerçeve için {amount} jeton daha gerekiyor.', purchaseNote: 'Jetonlar yalnızca onayından sonra harcanır.' },
  fr: { title: 'Cadres d’avatar', free: 'gratuit', coins: '{count} pièces', owned: 'Acheté', inUse: 'Utilisé', useFrame: 'Utiliser ce cadre', useNoFrame: 'Utiliser sans cadre', unlock: '{count} pièces · débloquer le cadre', note: 'Les cadres sont une décoration in-app — pas de loterie ni de coffres, et non échangeables contre de l’argent ou des biens.', insufficient: 'Pas assez de pièces pour ce cadre.', getCoins: 'Obtenir des pièces', unlocked: 'Cadre débloqué définitivement.', failed: 'Impossible de débloquer le cadre. Votre solde n’a pas changé.', confirmTitle: 'Débloquer ce cadre ?', confirmBody: 'Ce cadre vous appartiendra définitivement.', cost: 'Coût', balance: 'Votre solde', after: 'Solde restant', shortBy: 'Il vous manque', cancel: 'Pas maintenant', confirmPurchase: 'Débloquer', processing: 'Déblocage…', insufficientTitle: 'Pas assez de pièces', insufficientBody: 'Il vous faut encore {amount} pièces pour ce cadre.', purchaseNote: 'Les pièces ne sont débitées qu’après confirmation.' },
  de: { title: 'Avatar-Rahmen', free: 'gratis', coins: '{count} Münzen', owned: 'Gekauft', inUse: 'Aktiv', useFrame: 'Diesen Rahmen verwenden', useNoFrame: 'Ohne Rahmen verwenden', unlock: '{count} Münzen · Rahmen freischalten', note: 'Rahmen sind reine In-App-Deko — keine Lotterien oder Lootboxen, nicht gegen Geld oder Waren tauschbar.', insufficient: 'Nicht genug Münzen für diesen Rahmen.', getCoins: 'Münzen holen', unlocked: 'Rahmen dauerhaft freigeschaltet.', failed: 'Der Rahmen konnte nicht freigeschaltet werden. Dein Guthaben blieb unverändert.', confirmTitle: 'Diesen Rahmen freischalten?', confirmBody: 'Dieser Rahmen gehört dir danach dauerhaft.', cost: 'Kosten', balance: 'Dein Guthaben', after: 'Guthaben danach', shortBy: 'Dir fehlen', cancel: 'Nicht jetzt', confirmPurchase: 'Rahmen freischalten', processing: 'Wird freigeschaltet…', insufficientTitle: 'Nicht genug Münzen', insufficientBody: 'Du brauchst noch {amount} Münzen für diesen Rahmen.', purchaseNote: 'Münzen werden erst nach deiner Bestätigung abgezogen.' },
  ja: { title: 'アバターフレーム', free: '無料', coins: '{count} コイン', owned: '所有済み', inUse: '使用中', useFrame: 'このフレームを使う', useNoFrame: 'フレームなしで使う', unlock: '{count} コイン · フレーム解放', note: 'フレームはアプリ内の装飾のみ — 抽選やガチャはなく、現金や物品に交換できません。', insufficient: 'このフレームを購入するコインが不足しています。', getCoins: 'コインを購入', unlocked: 'フレームを永久に解放しました。', failed: 'フレームを解放できませんでした。残高は変更されていません。', confirmTitle: 'このフレームを解放しますか？', confirmBody: '解放後は永久に使用できます。', cost: '必要コイン', balance: '現在の残高', after: '解放後の残高', shortBy: '不足分', cancel: '今はしない', confirmPurchase: 'フレームを解放', processing: '解放中…', insufficientTitle: 'コインが不足しています', insufficientBody: 'このフレームにはあと {amount} コイン必要です。', purchaseNote: '確認後にのみコインが消費されます。' },
  ko: { title: '아바타 프레임', free: '무료', coins: '{count}코인', owned: '보유 중', inUse: '사용 중', useFrame: '이 프레임 사용', useNoFrame: '프레임 없이 사용', unlock: '{count}코인 · 프레임 잠금 해제', note: '프레임은 앱 내 장식일 뿐이며 뽑기나 랜덤 상자가 없고, 현금이나 물품으로 교환할 수 없어요.', insufficient: '이 프레임을 위한 코인이 부족해요.', getCoins: '코인 구매', unlocked: '프레임이 영구적으로 잠금 해제됐어요.', failed: '프레임을 잠금 해제하지 못했어요. 잔액은 바뀌지 않았어요.', confirmTitle: '이 프레임을 잠금 해제할까요?', confirmBody: '잠금 해제하면 영구적으로 사용할 수 있어요.', cost: '비용', balance: '내 잔액', after: '사용 후 잔액', shortBy: '부족한 코인', cancel: '나중에', confirmPurchase: '프레임 잠금 해제', processing: '잠금 해제 중…', insufficientTitle: '코인이 부족해요', insufficientBody: '이 프레임에는 코인 {amount}개가 더 필요해요.', purchaseNote: '확인한 뒤에만 코인이 차감됩니다.' },
}

export function avatarFrameContent(locale) {
  return { ...en, ...(translations[locale] || {}), names: names[locale] || names.en }
}

export function avatarFrameByID(id) {
  return avatarFrameCatalog.find((item) => item.id === id) || avatarFrameCatalog[0]
}

export function resolveAvatarFrameID(profile) {
  const explicit = avatarFrameCatalog.find((item) => item.id === profile?.avatarFrameID)
  if (explicit) return explicit.id
  const label = String(profile?.avatarFrameLabel || '').trim().toLocaleLowerCase()
  if (!label) return 'none'
  for (const localizedNames of Object.values(names)) {
    const index = localizedNames.findIndex((name) => name.toLocaleLowerCase() === label)
    if (index >= 0) return avatarFrameCatalog[index].id
  }
  return 'none'
}
