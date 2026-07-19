import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { formFieldClasses, formTextareaClasses, primaryActionButtonClasses, secondaryActionButtonClasses } from "../../lib/uiStyles";
import { getLocalizedField, setLocalizedField } from "./menuEditorUtils";
import { createImageUploadUrl, uploadFileToPresignedUrl } from "../../lib/mediaApi";

const CategoryModal = ({ category, language, defaultLanguage, onChange, onCancel, onSave }) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  if (!category) return null;

  const localizedName = getLocalizedField(category, 'name', language, defaultLanguage);
  const localizedDescription = getLocalizedField(category, 'description', language, defaultLanguage);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setImageError('');
    try {
      const target = await createImageUploadUrl({ filename: file.name, contentType: file.type, assetType: 'category' });
      await uploadFileToPresignedUrl({ uploadUrl: target.uploadUrl, headers: target.headers, file });
      onChange({ ...category, imageUrl: target.publicUrl });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not upload category image.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {localizedName ? t('menuEditor.categoryModal.titleEdit', 'Category settings') : t('menuEditor.categoryModal.titleNew', 'New category')}
            </h2>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-secondary transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-background">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.categoryModal.nameLabel', 'Name')} ({language.toUpperCase()})
            </Label>

            <Input
              value={localizedName}
              onChange={(event) => onChange(setLocalizedField(category, 'name', event.target.value, language, defaultLanguage))}
              className={formFieldClasses}
              placeholder={t('menuEditor.categoryModal.namePlaceholder', 'E.g., Desserts')}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.categoryModal.descriptionLabel', 'Description')} ({language.toUpperCase()})
            </Label>

            <textarea
              value={localizedDescription || ''}
              onChange={(event) => onChange(setLocalizedField(category, 'description', event.target.value, language, defaultLanguage))}
              className={`${formTextareaClasses} min-h-[80px]`}
              placeholder={t('menuEditor.categoryModal.descriptionPlaceholder', 'Shown under the category heading...')}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.categoryModal.imageLabel', 'Category image')}
            </Label>

            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/15 p-3">
              <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">{category.imageUrl ? <img src={category.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} className="text-muted-foreground" />}</div>
              <div className="min-w-0 flex-1 space-y-2"><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} /><Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><Upload size={14} className="mr-2" />{isUploading ? 'Uploading...' : 'Upload image'}</Button>{category.imageUrl ? <button type="button" onClick={() => onChange({ ...category, imageUrl: null })} className="ml-2 text-xs font-semibold text-destructive">Remove</button> : null}</div>
            </div>
            {imageError ? <p className="text-xs font-medium text-destructive">{imageError}</p> : null}
            <Input value={category.imageUrl || ''} onChange={(event) => onChange({ ...category, imageUrl: event.target.value || null })} className={formFieldClasses} placeholder="Or paste https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('menuEditor.categoryModal.hoursStartLabel', 'Available from')}
              </Label>

              <Input
                type="time"
                value={category.availableHours?.start || ''}
                onChange={(event) => onChange({
                  ...category,
                  availableHours: {
                    start: event.target.value,
                    end: category.availableHours?.end || '',
                  },
                })}
                className={formFieldClasses}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('menuEditor.categoryModal.hoursEndLabel', 'Available until')}
              </Label>

              <Input
                type="time"
                value={category.availableHours?.end || ''}
                onChange={(event) => onChange({
                  ...category,
                  availableHours: {
                    start: category.availableHours?.start || '',
                    end: event.target.value,
                  },
                })}
                className={formFieldClasses}
              />
            </div>
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
            disabled={!getLocalizedField(category, 'name', defaultLanguage, defaultLanguage).trim()}
            className={`${primaryActionButtonClasses} px-6`}
          >
            {t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
