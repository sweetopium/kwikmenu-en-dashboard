export const LANGUAGE_META = {
  en: { flag: '🇬🇧', label: 'English' },
  es: { flag: '🇪🇸', label: 'Español' },
  fr: { flag: '🇫🇷', label: 'Français' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
  it: { flag: '🇮🇹', label: 'Italiano' },
  pt: { flag: '🇵🇹', label: 'Português' },
  pt_br: { flag: '🇧🇷', label: 'Português (BR)' },
  ru: { flag: '🇷🇺', label: 'Русский' },
  uk: { flag: '🇺🇦', label: 'Українська' },
  kk: { flag: '🇰🇿', label: 'Қазақша' },
  tr: { flag: '🇹🇷', label: 'Türkçe' },
  ar: { flag: '🇦🇪', label: 'العربية' },
  he: { flag: '🇮🇱', label: 'עברית' },
  hi: { flag: '🇮🇳', label: 'हिन्दी' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
  ko: { flag: '🇰🇷', label: '한국어' },
  pl: { flag: '🇵🇱', label: 'Polski' },
  nl: { flag: '🇳🇱', label: 'Nederlands' },
  cs: { flag: '🇨🇿', label: 'Čeština' },
};

export const getLanguageMeta = (code) => {
  if (!code) return null;
  return LANGUAGE_META[code.toLowerCase()] || null;
};
