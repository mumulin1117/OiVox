const launchTransitionMessages = Object.freeze({
  en: Object.freeze({
    label: 'OiVox introduction',
    skip: 'Skip animation',
    tagline: 'Speak first · Hear the world',
  }),
  ar: Object.freeze({
    label: 'مقدمة OiVox',
    skip: 'تخطي الرسوم المتحركة',
    tagline: 'تحدث أولاً · واسمع العالم',
  }),
  he: Object.freeze({
    label: 'פתיח OiVox',
    skip: 'דילוג על ההנפשה',
    tagline: 'קודם מדברים · ואז שומעים את העולם',
  }),
  tr: Object.freeze({
    label: 'OiVox açılışı',
    skip: 'Animasyonu geç',
    tagline: 'Önce konuş · Dünyayı dinle',
  }),
  fr: Object.freeze({
    label: 'Introduction OiVox',
    skip: "Passer l’animation",
    tagline: 'Parlez d’abord · Écoutez le monde',
  }),
  de: Object.freeze({
    label: 'OiVox-Intro',
    skip: 'Animation überspringen',
    tagline: 'Sprich zuerst · Hör die Welt',
  }),
  ja: Object.freeze({
    label: 'OiVoxイントロ',
    skip: 'アニメーションをスキップ',
    tagline: 'まず話そう · 世界を聴こう',
  }),
  ko: Object.freeze({
    label: 'OiVox 인트로',
    skip: '애니메이션 건너뛰기',
    tagline: '먼저 말하고 · 세상의 목소리를 들어요',
  }),
})

export function launchTransitionContent(locale) {
  return launchTransitionMessages[locale] || launchTransitionMessages.en
}

export { launchTransitionMessages }
