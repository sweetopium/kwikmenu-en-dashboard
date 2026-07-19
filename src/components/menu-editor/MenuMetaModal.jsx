import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { formFieldClasses, formTextareaClasses, primaryActionButtonClasses, secondaryActionButtonClasses } from "../../lib/uiStyles";
import { getLocalizedField, setLocalizedField } from "./menuEditorUtils";
import { createImageUploadUrl, uploadFileToPresignedUrl } from "../../lib/mediaApi";

const MenuMetaModal = ({ menuMeta, promo, categories = [], language, defaultLanguage, onChange, onPromoChange, onCancel, onSave }) => {
  const { t } = useTranslation();
  const [isUploadingPromo, setIsUploadingPromo] = useState(false);
  const [promoImageError, setPromoImageError] = useState('');
  const promoFileRef = useRef(null);
  if (!menuMeta) return null;

  const localizedName = getLocalizedField(menuMeta, 'name', language, defaultLanguage);
  const localizedDescription = getLocalizedField(menuMeta, 'description', language, defaultLanguage);
  const localizedPromoEyebrow = getLocalizedField(promo, 'eyebrow', language, defaultLanguage);
  const localizedPromoTitle = getLocalizedField(promo, 'title', language, defaultLanguage);
  const localizedPromoDescription = getLocalizedField(promo, 'description', language, defaultLanguage);

  const handlePromoImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !promo || !onPromoChange) return;
    setIsUploadingPromo(true);
    setPromoImageError('');
    try {
      const target = await createImageUploadUrl({ filename: file.name, contentType: file.type, assetType: 'promo' });
      await uploadFileToPresignedUrl({ uploadUrl: target.uploadUrl, headers: target.headers, file });
      onPromoChange({ ...promo, imageUrl: target.publicUrl });
    } catch (error) {
      setPromoImageError(error instanceof Error ? error.message : 'Could not upload promo image.');
    } finally {
      setIsUploadingPromo(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('menuEditor.menuMetaModal.title', 'Menu settings')}</h2>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-secondary transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-background overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.menuMetaModal.nameLabel', 'Menu name')} ({language.toUpperCase()})
            </Label>

            <Input
              value={localizedName}
              onChange={(event) => onChange(setLocalizedField(menuMeta, 'name', event.target.value, language, defaultLanguage))}
              className={formFieldClasses}
              placeholder={t('menuEditor.menuMetaModal.namePlaceholder', 'E.g., Main menu')}
            />
          </div>

          {promo && onPromoChange ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div><Label className="text-sm font-bold">Branded promo banner</Label><p className="mt-1 text-xs text-muted-foreground">Shown only in the Branded template.</p></div>
                <Switch checked={promo.enabled} onCheckedChange={(enabled) => onPromoChange({ ...promo, enabled })} />
              </div>
              {promo.enabled ? <>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eyebrow ({language.toUpperCase()})</Label><Input value={localizedPromoEyebrow || ''} onChange={(event) => onPromoChange(setLocalizedField(promo, 'eyebrow', event.target.value, language, defaultLanguage))} className={formFieldClasses} placeholder="Seasonal offer" /></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title ({language.toUpperCase()})</Label><Input value={localizedPromoTitle || ''} onChange={(event) => onPromoChange(setLocalizedField(promo, 'title', event.target.value, language, defaultLanguage))} className={formFieldClasses} placeholder="Summer specials" /></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description ({language.toUpperCase()})</Label><textarea value={localizedPromoDescription || ''} onChange={(event) => onPromoChange(setLocalizedField(promo, 'description', event.target.value, language, defaultLanguage))} className={formTextareaClasses} placeholder="A short guest-facing message" /></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banner image</Label>{promo.imageUrl ? <img src={promo.imageUrl} alt="Promo" className="aspect-[16/6] w-full rounded-xl object-cover" /> : null}<input ref={promoFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePromoImageUpload} /><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => promoFileRef.current?.click()} disabled={isUploadingPromo}><Upload size={14} className="mr-2" />{isUploadingPromo ? 'Uploading...' : 'Upload image'}</Button>{promo.imageUrl ? <Button type="button" variant="ghost" size="sm" onClick={() => onPromoChange({ ...promo, imageUrl: null })}>Remove</Button> : null}</div>{promoImageError ? <p className="text-xs font-medium text-destructive">{promoImageError}</p> : null}<Input value={promo.imageUrl || ''} onChange={(event) => onPromoChange({ ...promo, imageUrl: event.target.value || null })} className={formFieldClasses} placeholder="Or paste https://..." /></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opens category</Label><select value={promo.targetCategoryId || ''} onChange={(event) => onPromoChange({ ...promo, targetCategoryId: event.target.value || null })} className={formFieldClasses}><option value="">No action</option>{categories.map((category) => <option key={category.id} value={category.id}>{getLocalizedField(category, 'name', language, defaultLanguage)}</option>)}</select></div>
              </> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.menuMetaModal.descriptionLabel', 'Menu description')} ({language.toUpperCase()})
            </Label>

            <textarea
              value={localizedDescription || ''}
              onChange={(event) => onChange(setLocalizedField(menuMeta, 'description', event.target.value, language, defaultLanguage))}
              className={formTextareaClasses}
              placeholder={t('menuEditor.menuMetaModal.descriptionPlaceholder', 'Short menu description...')}
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border/60 flex justify-end gap-3 bg-card">
          <Button
            variant="outline"
            onClick={onCancel}
            className={secondaryActionButtonClasses}
          >
            {t('common.cancel', 'Cancel')}
          </Button>

          <Button
            onClick={onSave}
            disabled={!getLocalizedField(menuMeta, 'name', defaultLanguage, defaultLanguage).trim()}
            className={`${primaryActionButtonClasses} px-6`}
          >
            {t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuMetaModal;
