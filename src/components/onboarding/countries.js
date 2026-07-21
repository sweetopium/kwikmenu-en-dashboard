import { formFieldClasses } from "../../lib/uiStyles";

export const COUNTRIES = [
  { id: 'us', name: 'United States', flag: '🇺🇸', dial: '+1', currency: 'USD' },
  { id: 'gb', name: 'United Kingdom', flag: '🇬🇧', dial: '+44', currency: 'GBP' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', dial: '+1', currency: 'CAD' },
  { id: 'au', name: 'Australia', flag: '🇦🇺', dial: '+61', currency: 'AUD' },
  { id: 'ie', name: 'Ireland', flag: '🇮🇪', dial: '+353', currency: 'EUR' },
  { id: 'ru', name: 'Russia', flag: '🇷🇺', dial: '+7', currency: 'RUB' },
  { id: 'by', name: 'Belarus', flag: '🇧🇾', dial: '+375', currency: 'BYN' },
  { id: 'kz', name: 'Kazakhstan', flag: '🇰🇿', dial: '+7', currency: 'KZT' },
  { id: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', dial: '+971', currency: 'AED' },
  { id: 'de', name: 'Germany', flag: '🇩🇪', dial: '+49', currency: 'EUR' },
  { id: 'fr', name: 'France', flag: '🇫🇷', dial: '+33', currency: 'EUR' },
  { id: 'es', name: 'Spain', flag: '🇪🇸', dial: '+34', currency: 'EUR' },
  { id: 'it', name: 'Italy', flag: '🇮🇹', dial: '+39', currency: 'EUR' },
  { id: 'nl', name: 'Netherlands', flag: '🇳🇱', dial: '+31', currency: 'EUR' },
  { id: 'pt', name: 'Portugal', flag: '🇵🇹', dial: '+351', currency: 'EUR' },
  { id: 'tr', name: 'Turkey', flag: '🇹🇷', dial: '+90', currency: 'TRY' },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', dial: '+65', currency: 'SGD' },
  { id: 'id', name: 'Indonesia', flag: '🇮🇩', dial: '+62', currency: 'IDR' },
  { id: 'th', name: 'Thailand', flag: '🇹🇭', dial: '+66', currency: 'THB' },
  { id: 'vn', name: 'Vietnam', flag: '🇻🇳', dial: '+84', currency: 'VND' },
  { id: 'hk', name: 'Hong Kong', flag: '🇭🇰', dial: '+852', currency: 'HKD' },
  { id: 'in', name: 'India', flag: '🇮🇳', dial: '+91', currency: 'USD' },
];

export const inputBaseClasses = `${formFieldClasses} appearance-none`;
