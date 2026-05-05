import { Edit2, GripVertical, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Switch } from "../ui/switch";
import { subtleIconButtonClasses } from "../../lib/uiStyles";
import {
  DIETARY_TAG_OPTIONS,
  formatMeasure,
  getAvailableHoursLabel,
  getBadgeMeta,
  getLocalizedField,
} from "./menuEditorUtils";

const MenuItemCard = ({ item, language, defaultLanguage, onEdit, onDelete }) => {
  const localizedName = getLocalizedField(item, 'name', language, defaultLanguage);
  const localizedDescription = getLocalizedField(item, 'description', language, defaultLanguage);
  const badgeMeta = getBadgeMeta(item.badge);

  return (
  <div className="group flex flex-col sm:flex-row sm:items-center gap-4 p-3 sm:p-4 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all min-w-0 max-w-full overflow-hidden">
    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
      <button className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing hidden sm:block shrink-0">
        <GripVertical size={20} />
      </button>

      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/50 shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={24} className="text-muted-foreground/50" />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
            {localizedName}
          </h3>
          {badgeMeta && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeMeta.className}`}>
              {badgeMeta.label}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {localizedDescription || "Описания нет"}
          {item.measureValue && ` • ${formatMeasure(item.measureValue, item.measureUnit)}`}
        </p>

        {(item.tags?.length > 0 || item.availableHours?.start) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags?.map((tag) => {
              const tagMeta = DIETARY_TAG_OPTIONS.find((option) => option.value === tag);
              return (
                <span
                  key={tag}
                  className="text-[10px] font-semibold bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-md border border-border/50"
                >
                  {tagMeta?.label || tag}
                </span>
              );
            })}
            {item.availableHours?.start && item.availableHours?.end && (
              <span className="text-[10px] font-semibold bg-background text-foreground px-2 py-0.5 rounded-md border border-border/50">
                {getAvailableHoursLabel(item.availableHours)}
              </span>
            )}
          </div>
        )}

        {item.variants && item.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 min-w-0">
            {item.variants.map((variant) => (
              <div
                key={variant.id}
                className="text-[10px] font-medium bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-md border border-brand-purple/20"
              >
                {getLocalizedField(variant, 'label', language, defaultLanguage) || formatMeasure(variant.measureValue, variant.measureUnit)}:{' '}
                <span className="font-bold">{variant.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-14 sm:pl-0 border-t border-border/50 sm:border-0 pt-3 sm:pt-0 min-w-0">
      {(!item.variants || item.variants.length === 0) && (
        <div className="font-extrabold text-sm sm:text-base whitespace-nowrap text-foreground">
          {item.price}
        </div>
      )}

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <Switch
          checked={item.isAvailable ?? true}
          className="data-[state=checked]:bg-green-500 scale-90 sm:scale-100"
        />

        <button
          onClick={() => onEdit(item)}
          className={`${subtleIconButtonClasses} hover:text-brand-purple hover:bg-brand-purple/10`}
        >
          <Edit2 size={18} />
        </button>

        <button
          onClick={() => onDelete(item)}
          className={`${subtleIconButtonClasses} hover:text-destructive hover:bg-destructive/10`}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);
};

export default MenuItemCard;
