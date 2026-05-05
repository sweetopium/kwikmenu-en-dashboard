import { X } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { formFieldClasses, formTextareaClasses, primaryActionButtonClasses, secondaryActionButtonClasses } from "../../lib/uiStyles";
import { getLocalizedField, setLocalizedField } from "./menuEditorUtils";

const CategoryModal = ({ category, language, defaultLanguage, onChange, onCancel, onSave }) => {
  if (!category) return null;

  const localizedName = getLocalizedField(category, 'name', language, defaultLanguage);
  const localizedDescription = getLocalizedField(category, 'description', language, defaultLanguage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {localizedName ? 'Настройки категории' : 'Новая категория'}
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
              Название ({language.toUpperCase()})
            </Label>

            <Input
              value={localizedName}
              onChange={(event) => onChange(setLocalizedField(category, 'name', event.target.value, language, defaultLanguage))}
              className={formFieldClasses}
              placeholder="Например: Десерты"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Описание ({language.toUpperCase()})
            </Label>

            <textarea
              value={localizedDescription || ''}
              onChange={(event) => onChange(setLocalizedField(category, 'description', event.target.value, language, defaultLanguage))}
              className={`${formTextareaClasses} min-h-[80px]`}
              placeholder="Показывать под заголовком категории..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Изображение категории
            </Label>

            <Input
              value={category.imageUrl || ''}
              onChange={(event) => onChange({ ...category, imageUrl: event.target.value || null })}
              className={formFieldClasses}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Доступно с
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
                Доступно до
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
            Отмена
          </Button>

          <Button
            onClick={onSave}
            disabled={!getLocalizedField(category, 'name', defaultLanguage, defaultLanguage).trim()}
            className={`${primaryActionButtonClasses} px-6`}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
