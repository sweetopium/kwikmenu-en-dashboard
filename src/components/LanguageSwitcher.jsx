import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ variant = 'pill' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = () => {
    i18n.changeLanguage('en');
  };

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex items-center gap-3 px-3 h-11 w-full text-sm font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-foreground rounded-lg transition-colors group min-w-0"
      >
        <Globe size={18} className="group-hover:text-brand-purple transition-colors shrink-0" />
        <span className="truncate">
          Language: English
        </span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-secondary font-bold uppercase tracking-wider text-muted-foreground shrink-0">
          EN
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card hover:bg-secondary/35 text-xs font-bold text-foreground shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all cursor-pointer group"
      title="Language: English"
    >
      <Globe size={13} className="text-muted-foreground group-hover:text-brand-purple transition-colors" />
      <span className="uppercase tracking-wider">
        EN
      </span>
    </button>
  );
};

export default LanguageSwitcher;
