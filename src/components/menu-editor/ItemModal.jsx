import { ChevronDown, Plus, X } from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { MEASURE_UNITS } from "./menuEditorUtils";

const ItemModal = ({
  item,
  mode,
  categories,
  targetCategoryId,
  onTargetCategoryChange,
  onChange,
  onVariantChange,
  onAddVariant,
  onRemoveVariant,
  onCancel,
  onSave,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {mode === 'add' ? 'Новое блюдо' : 'Редактирование блюда'}
            </h2>

            <p className="text-xs text-muted-foreground mt-1">
              Изменения применятся после сохранения.
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
              Категория
            </Label>

            <div className="relative">
              <select
                value={targetCategoryId}
                onChange={(event) => onTargetCategoryChange(event.target.value)}
                className="flex h-11 w-full items-center rounded-xl border border-input bg-secondary/30 px-3 text-sm sm:text-base transition-colors focus:bg-background focus:outline-none focus:ring-2 focus:ring-brand-purple/50 appearance-none cursor-pointer font-medium"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
              Название
            </Label>

            <Input
              value={item.name}
              onChange={(event) => onChange({ ...item, name: event.target.value })}
              className="h-11 bg-secondary/30 border-transparent focus:bg-background rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Описание
            </Label>

            <textarea
              value={item.description || ''}
              onChange={(event) => onChange({ ...item, description: event.target.value })}
              className="w-full min-h-[100px] bg-secondary/30 border-transparent focus:border-ring focus:bg-background rounded-xl p-3 text-sm outline-none resize-y transition-colors"
              placeholder="Вкусное описание для гостей..."
            />
          </div>

          <div className="bg-secondary/20 p-4 sm:p-5 rounded-2xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Стоимость и объем
              </Label>

              <button
                onClick={onAddVariant}
                className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:bg-brand-purple/10 px-2 py-1 rounded-md transition-colors shrink-0"
              >
                <Plus size={14} />
                Добавить опцию
              </button>
            </div>

            {(!item.variants || item.variants.length === 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Цена (₽)
                  </Label>

                  <Input
                    value={item.price || ''}
                    onChange={(event) => onChange({ ...item, price: event.target.value })}
                    className="bg-background rounded-lg border border-input h-10"
                    placeholder="Например: 350"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Значение
                  </Label>

                  <Input
                    type="number"
                    value={item.measureValue || ''}
                    onChange={(event) => onChange({ ...item, measureValue: event.target.value })}
                    className="bg-background rounded-lg border border-input h-10"
                    placeholder="Например: 250"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Ед. изм.
                  </Label>

                  <MeasureUnitSelect
                    value={item.measureUnit || 'ml'}
                    onChange={(value) => onChange({ ...item, measureUnit: value })}
                    className="flex h-10 w-full items-center rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 appearance-none cursor-pointer"
                    chevronSize={14}
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
                        Название опции
                      </Label>

                      <Input
                        value={variant.label || ''}
                        onChange={(event) => onVariantChange(index, 'label', event.target.value)}
                        className="h-9 text-xs bg-secondary/30"
                        placeholder="Например: Гранд"
                      />
                    </div>

                    <div className="w-[80px] sm:w-[90px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Значение
                      </Label>

                      <Input
                        type="number"
                        value={variant.measureValue || ''}
                        onChange={(event) => onVariantChange(index, 'measureValue', event.target.value)}
                        className="h-9 text-xs bg-secondary/30"
                        placeholder="400"
                      />
                    </div>

                    <div className="w-[80px] sm:w-[90px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Ед. изм.
                      </Label>

                      <MeasureUnitSelect
                        value={variant.measureUnit || 'ml'}
                        onChange={(value) => onVariantChange(index, 'measureUnit', value)}
                        className="flex h-9 w-full items-center rounded-lg border border-transparent bg-secondary/30 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/50 appearance-none cursor-pointer"
                        chevronSize={12}
                      />
                    </div>

                    <div className="w-[90px] sm:w-[100px] space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Цена (₽)
                      </Label>

                      <Input
                        value={variant.price || ''}
                        onChange={(event) => onVariantChange(index, 'price', event.target.value)}
                        className="h-9 text-xs bg-secondary/30"
                        placeholder="300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-secondary/20 rounded-xl border border-border/50">
            <div>
              <Label className="text-sm font-bold text-foreground cursor-pointer">
                Отображать в меню
              </Label>

              <p className="text-xs text-muted-foreground mt-0.5">
                Выключите, если позиция закончилась (Стоп-лист)
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
            className="rounded-xl border-border/60 hover:bg-secondary font-semibold"
          >
            Отмена
          </Button>

          <Button
            onClick={onSave}
            disabled={!item.name.trim()}
            className="rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold shadow-md shadow-brand-purple/20 px-6"
          >
            {mode === 'add' ? 'Добавить блюдо' : 'Сохранить изменения'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MeasureUnitSelect = ({ value, onChange, className, chevronSize }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      {MEASURE_UNITS.map((unit) => (
        <option key={unit.value} value={unit.value}>
          {unit.label}
        </option>
      ))}
    </select>

    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
      <ChevronDown size={chevronSize} />
    </div>
  </div>
);

export default ItemModal;
