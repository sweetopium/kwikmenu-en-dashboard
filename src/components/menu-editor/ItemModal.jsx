import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Image as ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import ImageCropModal from "../media/ImageCropModal";
import { getCroppedImageBlob } from "../../lib/imageCrop";
import { createMenuItemImageUploadUrl, uploadFileToPresignedUrl } from "../../lib/mediaApi";
import {
  formFieldClasses,
  formSelectClasses,
  formTextareaClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
} from "../../lib/uiStyles";
import {
  BADGE_OPTIONS,
  DIETARY_TAG_OPTIONS,
  MEASURE_UNITS,
  getLocalizedField,
  setLocalizedField,
} from "./menuEditorUtils";

const ItemModal = ({
  item,
  mode,
  categories,
  language,
  defaultLanguage,
  targetCategoryId,
  onTargetCategoryChange,
  onChange,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
  onCancel,
  onSave,
}) => {
  const { t } = useTranslation();
  const [cropSource, setCropSource] = useState(null);
  const [pendingFileName, setPendingFileName] = useState('menu-item.webp');
  const [imageError, setImageError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cropSource) {
        URL.revokeObjectURL(cropSource);
      }
    };
  }, [cropSource]);

  if (!item) return null;

  const localizedName = getLocalizedField(item, 'name', language, defaultLanguage);
  const localizedDescription = getLocalizedField(item, 'description', language, defaultLanguage);

  const handleSelectImageFile = (event) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(nextFile.type)) {
      setImageError('Поддерживаются только JPG, PNG и WEBP.');
      event.target.value = '';
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setImageError('Файл слишком большой. Максимум 10 МБ.');
      event.target.value = '';
      return;
    }

    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }
    setImageError('');
    setPendingFileName(nextFile.name || 'menu-item.webp');
    setCropSource(URL.createObjectURL(nextFile));
    event.target.value = '';
  };

  const handleUploadCroppedImage = async (croppedAreaPixels) => {
    if (!cropSource) {
      return;
    }

    setIsUploadingImage(true);
    setImageError('');
    try {
      const croppedBlob = await getCroppedImageBlob(cropSource, croppedAreaPixels, {
        maxSize: 1600,
        type: 'image/webp',
        quality: 0.86,
      });
      const uploadFile = new File(
        [croppedBlob],
        `${pendingFileName.replace(/\.[^.]+$/, '') || 'menu-item'}.webp`,
        { type: 'image/webp' },
      );
      const uploadTarget = await createMenuItemImageUploadUrl({
        filename: uploadFile.name,
        contentType: uploadFile.type,
      });
      await uploadFileToPresignedUrl({
        uploadUrl: uploadTarget.uploadUrl,
        headers: uploadTarget.headers,
        file: uploadFile,
      });
      onChange({ ...item, imageUrl: uploadTarget.publicUrl });
      URL.revokeObjectURL(cropSource);
      setCropSource(null);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Не удалось загрузить изображение блюда.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <ImageCropModal
        imageSrc={cropSource}
        onCancel={() => {
          if (cropSource) {
            URL.revokeObjectURL(cropSource);
          }
          setCropSource(null);
        }}
        onConfirm={handleUploadCroppedImage}
        isSubmitting={isUploadingImage}
      />
      <div
        className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {mode === 'add' ? t('menuEditor.itemModal.titleAdd', 'Новое блюдо') : t('menuEditor.itemModal.titleEdit', 'Редактирование блюда')}
            </h2>

            <p className="text-xs text-muted-foreground mt-1">
              {t('menuEditor.itemModal.subtitle', 'Изменения применятся после сохранения.')}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-secondary transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-background custom-scrollbar">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.itemModal.categoryLabel', 'Категория')}
            </Label>

            <div className="relative">
              <select
                value={targetCategoryId}
                onChange={(event) => onTargetCategoryChange(event.target.value)}
                className={formSelectClasses}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getLocalizedField(category, 'name', language, defaultLanguage)}
                  </option>
                ))}
              </select>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.itemModal.nameLabel', 'Название')} ({language.toUpperCase()})
            </Label>

            <Input
              value={localizedName}
              onChange={(event) => onChange(setLocalizedField(item, 'name', event.target.value, language, defaultLanguage))}
              className={formFieldClasses}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.itemModal.descriptionLabel', 'Описание')} ({language.toUpperCase()})
            </Label>

            <textarea
              value={localizedDescription || ''}
              onChange={(event) => onChange(setLocalizedField(item, 'description', event.target.value, language, defaultLanguage))}
              className={formTextareaClasses}
              placeholder={t('menuEditor.itemModal.descriptionPlaceholder', 'Вкусное описание для гостей...')}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.itemModal.imageLabel', 'Изображение блюда')}
            </Label>

            <div className="space-y-4 rounded-2xl border border-border/60 bg-secondary/15 p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={localizedName || 'dish'} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={22} className="text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:flex-1"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload size={16} className="mr-2" />
                      {item.imageUrl ? 'Заменить фото' : 'Загрузить фото'}
                    </Button>
                    {item.imageUrl ? (
                      <Button
                        type="button"
                        variant="destructive"
                        className="sm:flex-1"
                        onClick={() => onChange({ ...item, imageUrl: null })}
                        disabled={isUploadingImage}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Удалить фото
                      </Button>
                    ) : null}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleSelectImageFile}
                  />

                  <p className="text-xs text-muted-foreground">
                    JPG, PNG или WEBP до 10 МБ. Перед загрузкой можно подрезать кадр.
                  </p>
                </div>
              </div>

              {imageError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {imageError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Или вставьте ссылку вручную
                </Label>
                <Input
                  value={item.imageUrl || ''}
                  onChange={(event) => onChange({ ...item, imageUrl: event.target.value || null })}
                  className={formFieldClasses}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary/20 p-4 sm:p-5 rounded-2xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('menuEditor.itemModal.pricingVolumeLabel', 'Стоимость и объем')}
              </Label>

              <button
                onClick={onAddVariant}
                className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:bg-brand-purple/10 px-2 py-1 rounded-md transition-colors shrink-0"
              >
                <Plus size={14} />
                {t('menuEditor.itemModal.btnAddOption', 'Добавить опцию')}
              </button>
            </div>

            {(!item.variants || item.variants.length === 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t('menuEditor.itemModal.priceLabel', 'Цена (₽)')}
                  </Label>

                  <Input
                    value={item.price || ''}
                    onChange={(event) => onChange({ ...item, price: event.target.value })}
                    className={formFieldClasses}
                    placeholder={t('menuEditor.itemModal.pricePlaceholder', 'Например: 350')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t('menuEditor.itemModal.measureValueLabel', 'Значение')}
                  </Label>

                  <Input
                    type="number"
                    value={item.measureValue || ''}
                    onChange={(event) => onChange({ ...item, measureValue: event.target.value })}
                    className={formFieldClasses}
                    placeholder={t('menuEditor.itemModal.measureValuePlaceholder', 'Например: 250')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t('menuEditor.itemModal.measureUnitLabel', 'Ед. изм.')}
                  </Label>

                  <MeasureUnitSelect
                    value={item.measureUnit || ''}
                    onChange={(value) => onChange({ ...item, measureUnit: value || null })}
                    className={formSelectClasses}
                    chevronSize={14}
                    t={t}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {item.variants.map((variant, index) => (
                  <div
                    key={variant.id || index}
                    className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-3 p-3 bg-background border border-border/60 rounded-xl relative group"
                  >
                    <button
                      onClick={() => onRemoveVariant(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={12} />
                    </button>

                    <div className="flex-1 min-w-[120px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        {t('menuEditor.itemModal.optionNameLabel', 'Название опции')} ({language.toUpperCase()})
                      </Label>

                      <Input
                        value={getLocalizedField(variant, 'label', language, defaultLanguage)}
                        onChange={(event) => onVariantChange(index, 'label', event.target.value, language)}
                        className={`${formFieldClasses} h-11 text-xs px-3`}
                        placeholder={t('menuEditor.itemModal.optionNamePlaceholder', 'Например: Гранд')}
                      />
                    </div>

                    <div className="w-[80px] sm:w-[90px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        {t('menuEditor.itemModal.measureValueLabel', 'Значение')}
                      </Label>

                      <Input
                        type="number"
                        value={variant.measureValue || ''}
                        onChange={(event) => onVariantChange(index, 'measureValue', event.target.value)}
                        className={`${formFieldClasses} h-11 text-xs px-3`}
                        placeholder="400"
                      />
                    </div>

                    <div className="w-[80px] sm:w-[90px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        {t('menuEditor.itemModal.measureUnitLabel', 'Ед. изм.')}
                      </Label>

                      <MeasureUnitSelect
                        value={variant.measureUnit || ''}
                        onChange={(value) => onVariantChange(index, 'measureUnit', value || null)}
                        className={`${formSelectClasses} h-11 text-xs px-3`}
                        chevronSize={12}
                        t={t}
                      />
                    </div>

                    <div className="w-[90px] sm:w-[100px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        {t('menuEditor.itemModal.priceLabel', 'Цена (₽)')}
                      </Label>

                      <Input
                        value={variant.price || ''}
                        onChange={(event) => onVariantChange(index, 'price', event.target.value)}
                        className={`${formFieldClasses} h-11 text-xs px-3`}
                        placeholder="300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('menuEditor.itemModal.badgeLabel', 'Маркетинговый бейдж')}
              </Label>

              <div className="relative">
                <select
                  value={item.badge || ''}
                  onChange={(event) => onChange({ ...item, badge: event.target.value || null })}
                  className={formSelectClasses}
                >
                  <option value="">{t('menuEditor.itemModal.noBadge', 'Без бейджа')}</option>
                  {BADGE_OPTIONS.map((badge) => (
                    <option key={badge.value} value={badge.value}>
                      {t(`menuEditor.badges.${badge.value}`, { defaultValue: badge.label })}
                    </option>
                  ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('menuEditor.itemModal.availableFrom', 'Доступно с')}
                </Label>

                <Input
                  type="time"
                  value={item.availableHours?.start || ''}
                  onChange={(event) => onChange({
                    ...item,
                    availableHours: {
                      start: event.target.value,
                      end: item.availableHours?.end || '',
                    },
                  })}
                  className={formFieldClasses}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('menuEditor.itemModal.availableTo', 'Доступно до')}
                </Label>

                <Input
                  type="time"
                  value={item.availableHours?.end || ''}
                  onChange={(event) => onChange({
                    ...item,
                    availableHours: {
                      start: item.availableHours?.start || '',
                      end: event.target.value,
                    },
                  })}
                  className={formFieldClasses}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('menuEditor.itemModal.tagsLabel', 'Теги и аллергены')}
            </Label>

            <div className="flex flex-wrap gap-2">
              {DIETARY_TAG_OPTIONS.map((tag) => {
                const isActive = item.tags?.includes(tag.value);
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => onChange({
                      ...item,
                      tags: isActive
                        ? item.tags.filter((value) => value !== tag.value)
                        : [...(item.tags || []), tag.value],
                    })}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-secondary/30 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {t(`menuEditor.dietaryTags.${tag.value}`, { defaultValue: tag.label })}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-secondary/20 rounded-xl border border-border/50">
            <div>
              <Label className="text-sm font-bold text-foreground cursor-pointer">
                {t('menuEditor.itemModal.availableInMenu', 'Отображать в меню')}
              </Label>

              <p className="text-xs text-muted-foreground mt-0.5">
                {t('menuEditor.itemModal.availableInMenuDesc', 'Выключите, если позиция закончилась (Стоп-лист)')}
              </p>
            </div>

            <Switch
              checked={item.isAvailable ?? true}
              onCheckedChange={(checked) => onChange({ ...item, isAvailable: checked })}
              className="data-[state=checked]:bg-green-500 shrink-0"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border/60 flex justify-end gap-3 bg-card">
          <Button
            variant="outline"
            onClick={onCancel}
            className={secondaryActionButtonClasses}
          >
            {t('common.cancel', 'Отмена')}
          </Button>

          <Button
            onClick={onSave}
            disabled={!getLocalizedField(item, 'name', defaultLanguage, defaultLanguage).trim()}
            className={`${primaryActionButtonClasses} px-6`}
          >
            {mode === 'add' ? t('menuEditor.itemModal.btnAddItemSubmit', 'Добавить блюдо') : t('menuEditor.itemModal.btnSaveItemSubmit', 'Сохранить изменения')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MeasureUnitSelect = ({ value, onChange, className, chevronSize, t }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      {MEASURE_UNITS.map((unit) => (
        <option key={unit.value} value={unit.value}>
          {t(`menuEditor.measureUnits.${unit.value || 'notSpecified'}`, { defaultValue: unit.label })}
        </option>
      ))}
    </select>

    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
      <ChevronDown size={chevronSize} />
    </div>
  </div>
);

export default ItemModal;
