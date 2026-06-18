import { formFieldClasses } from "../../lib/uiStyles";

export const COUNTRIES = [
  { id: 'us', name: 'United States', flag: '🇺🇸', dial: '+1' },
  { id: 'gb', name: 'United Kingdom', flag: '🇬🇧', dial: '+44' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', dial: '+1' },
  { id: 'au', name: 'Australia', flag: '🇦🇺', dial: '+61' },
  { id: 'ie', name: 'Ireland', flag: '🇮🇪', dial: '+353' },
  { id: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', dial: '+971' },
  { id: 'de', name: 'Germany', flag: '🇩🇪', dial: '+49' },
  { id: 'fr', name: 'France', flag: '🇫🇷', dial: '+33' },
  { id: 'es', name: 'Spain', flag: '🇪🇸', dial: '+34' },
  { id: 'it', name: 'Italy', flag: '🇮🇹', dial: '+39' },
  { id: 'nl', name: 'Netherlands', flag: '🇳🇱', dial: '+31' },
  { id: 'pt', name: 'Portugal', flag: '🇵🇹', dial: '+351' },
  { id: 'tr', name: 'Turkey', flag: '🇹🇷', dial: '+90' },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', dial: '+65' },
  { id: 'hk', name: 'Hong Kong', flag: '🇭🇰', dial: '+852' },
  { id: 'in', name: 'India', flag: '🇮🇳', dial: '+91' },
];

export const inputBaseClasses = `${formFieldClasses} appearance-none`;
