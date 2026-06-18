export const LANGUAGE_META = {
  en: { flag: '🇬🇧', shortLabel: 'EN', label: 'English' },
  es: { flag: '🇪🇸', label: 'Español' },
  fr: { flag: '🇫🇷', label: 'Français' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
  it: { flag: '🇮🇹', label: 'Italiano' },
  pt: { flag: '🇵🇹', label: 'Português' },
  pt_br: { flag: '🇧🇷', label: 'Português (BR)' },
  ru: { flag: '🇷🇺', shortLabel: 'RU', label: 'Russian' },
  uk: { flag: '🇺🇦', label: 'Ukrainian' },
  kk: { flag: '🇰🇿', shortLabel: 'KZ', label: 'Kazakh' },
  tr: { flag: '🇹🇷', label: 'Türkçe' },
  ar: { flag: '🇦🇪', shortLabel: 'AR', label: 'العربية' },
  he: { flag: '🇮🇱', label: 'עברית' },
  hi: { flag: '🇮🇳', label: 'हिन्दी' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
  ko: { flag: '🇰🇷', label: '한국어' },
  pl: { flag: '🇵🇱', label: 'Polski' },
  nl: { flag: '🇳🇱', label: 'Nederlands' },
  cs: { flag: '🇨🇿', label: 'Čeština' },
};

export const TOP_MENU_LANGUAGES = [
  { code: 'ru', shortLabel: 'RU', nativeName: 'Russian', flag: '🇷🇺' },
  { code: 'en', shortLabel: 'EN', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', shortLabel: 'AR', nativeName: 'العربية', flag: '🇦🇪' },
  { code: 'kk', shortLabel: 'KZ', nativeName: 'Kazakh', flag: '🇰🇿' },
  { code: 'tr', shortLabel: 'TR', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', shortLabel: 'DE', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', shortLabel: 'FR', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', shortLabel: 'ES', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh', shortLabel: 'ZH', nativeName: '中文', flag: '🇨🇳' },
  { code: 'he', shortLabel: 'HE', nativeName: 'עברית', flag: '🇮🇱' },
];

export const getLanguageMeta = (code) => {
  if (!code) return null;
  return LANGUAGE_META[code.toLowerCase()] || null;
};
