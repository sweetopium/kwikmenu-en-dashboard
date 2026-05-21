import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'ru';

  const toggleLanguage = () => {
    const nextLang = currentLang.startsWith('ru') ? 'en' : 'ru';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card hover:bg-secondary/35 text-xs font-bold text-foreground shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all cursor-pointer group"
      title={currentLang.startsWith('ru') ? 'Switch to English' : 'Переключить на русский'}
    >
      <Globe size={13} className="text-muted-foreground group-hover:text-brand-purple transition-colors" />
      <span className="uppercase tracking-wider">
        {currentLang.startsWith('ru') ? 'RU' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
