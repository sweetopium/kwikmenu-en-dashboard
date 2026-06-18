import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, Globe, Sparkles, X } from 'lucide-react';
import { Button } from "../ui/button";
import { TOP_MENU_LANGUAGES } from "../../lib/languageMeta";
import { primaryActionButtonClasses, secondaryActionButtonClasses } from "../../lib/uiStyles";

const TranslationModal = ({
  menu,
  editorLanguage,
  onClose,
  onSwitchLanguage,
  onTranslate,
}) => {
  const { t } = useTranslation();
  const defaultLanguage = menu.defaultLanguage || 'en';

  // Find translated codes: default language + languages with translated entries
  const translatedCodes = new Set(
    (menu.languages || [])
      .filter(lang => lang.code === defaultLanguage || (menu.categories || []).some(cat => 
        (cat.translations && cat.translations[lang.code]) || 
        (cat.items || []).some(item => item.translations && item.translations[lang.code])
      ))
      .map(lang => lang.code)
  );

  const [selectedCode, setSelectedCode] = useState(editorLanguage || defaultLanguage);
  const [translatingCode, setTranslatingCode] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedLangMeta = TOP_MENU_LANGUAGES.find(lang => lang.code === selectedCode);
  const isDefaultLang = selectedCode === defaultLanguage;
  const isAlreadyTranslated = translatedCodes.has(selectedCode);
  const isCurrentEditorLang = selectedCode === editorLanguage;

  const handleTranslateClick = async () => {
    setTranslatingCode(selectedCode);
    setError('');
    setSuccessMsg('');
    try {
      await onTranslate(selectedCode);
      setSuccessMsg(t('menuEditor.translationModal.successMsg', 'AI translation generated successfully.'));
    } catch (err) {
      setError(err?.message || t('menuEditor.errors.translateFailed', 'Could not translate menu'));
    } finally {
      setTranslatingCode(null);
    }
  };

  const handleSelectLangToEdit = () => {
    onSwitchLanguage(selectedCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200 h-[600px] sm:h-[500px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between bg-secondary/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <Globe size={18} />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {t('menuEditor.translationModal.title', 'Menu translations')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-secondary transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Split Container */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Left Panel - Languages List */}
          <div className="w-full sm:w-[240px] border-b sm:border-b-0 sm:border-r border-border/60 bg-secondary/5 flex flex-col shrink-0 min-h-0">
            <div className="p-3 border-b border-border/50 bg-secondary/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {t('menuEditor.translationModal.selectLang', 'Choose language')}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {TOP_MENU_LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedCode;
                const isDefault = lang.code === defaultLanguage;
                const hasTranslation = isDefault || translatedCodes.has(lang.code);

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedCode(lang.code);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-background border border-border/60 shadow-sm font-bold text-brand-purple'
                        : 'hover:bg-secondary/40 text-foreground font-semibold border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </span>

                    {isDefault ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded border border-border/30">
                        {t('menuEditor.translationModal.badgeDefault', 'Base')}
                      </span>
                    ) : hasTranslation ? (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 flex items-center justify-center gap-0.5 shadow-sm">
                        <Check size={10} className="stroke-[3.5]" />
                        {t('menuEditor.translationModal.badgeTranslated', 'AI')}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Language Options */}
          <div className="flex-1 bg-background p-5 sm:p-6 overflow-y-auto flex flex-col min-w-0">
            {selectedLangMeta && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4 shrink-0">
                  <span className="text-3xl select-none">{selectedLangMeta.flag}</span>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">
                      {selectedLangMeta.nativeName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isDefaultLang 
                        ? t('menuEditor.translationModal.mainLangDesc', 'Default menu language') 
                        : t('menuEditor.translationModal.translationLangDesc', 'Translation language')}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  {/* Status / Description */}
                  <div className="space-y-4">
                    {isDefaultLang ? (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('menuEditor.translationModal.defaultLangHelp', 'This is the default language of your menu. Item names, descriptions, categories, and price options are edited in this language. AI translations are generated from this content.')}
                      </p>
                    ) : isAlreadyTranslated ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 text-emerald-800">
                          <Check size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                          <p className="text-xs sm:text-sm leading-relaxed">
                            {t('menuEditor.translationModal.statusTranslated', 'AI translation for this language has been generated. You can edit it manually or update the AI translation.')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-100/60 text-amber-800">
                          <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                          <p className="text-xs sm:text-sm leading-relaxed">
                            {t('menuEditor.translationModal.statusNotTranslated', 'Translation for this language has not been created yet. Guests will see the menu in the default language ({{lang}}) unless you add a translation.', { lang: selectedLangMeta.nativeName })}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {t('menuEditor.translationModal.translatePrompt', 'You can generate a full menu translation with AI in one click. AI will translate sections, item names, descriptions, and units.')}
                        </p>
                      </div>
                    )}

                    {/* Messages */}
                    {error && (
                      <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                        <Check size={14} className="shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-border/50 mt-6 bg-background shrink-0">
                    {!isDefaultLang && (
                      <Button
                        type="button"
                        onClick={handleTranslateClick}
                        disabled={translatingCode !== null}
                        className={`${primaryActionButtonClasses} bg-violet-600 hover:bg-violet-700 hover:shadow-violet-600/20 text-white flex-1 md:h-11 h-11 text-xs md:text-sm gap-2 font-bold`}
                      >
                        <Sparkles size={16} className={translatingCode === selectedCode ? 'animate-spin' : ''} />
                        {translatingCode === selectedCode
                          ? t('menuEditor.translating', 'Translating...')
                          : isAlreadyTranslated 
                            ? t('menuEditor.translationModal.btnTranslateUpdate', 'Update AI translation')
                            : t('menuEditor.translationModal.btnTranslateStart', 'Translate with AI')}
                      </Button>
                    )}

                    {isCurrentEditorLang ? (
                      <div className="text-center md:text-left text-xs text-muted-foreground font-semibold py-3 flex-1 flex items-center justify-center bg-secondary/15 rounded-xl border border-border/40 select-none">
                        {t('menuEditor.translationModal.alreadyActive', 'Editor is set to this language')}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSelectLangToEdit}
                        disabled={translatingCode !== null}
                        variant="outline"
                        className={`${secondaryActionButtonClasses} flex-1 md:h-11 h-11 text-xs md:text-sm font-bold`}
                      >
                        {isDefaultLang 
                          ? t('menuEditor.translationModal.btnSwitchDefault', 'Edit original')
                          : t('menuEditor.translationModal.btnSwitchLang', 'Edit this language')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;
