import { Edit2, GripVertical, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Switch } from "../ui/switch";
import { formatMeasure } from "./menuEditorUtils";

const MenuItemCard = ({ item, onEdit, onDelete }) => (
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
        <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
          {item.name}
        </h3>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.description || "Описания нет"}
          {item.measureValue && ` • ${formatMeasure(item.measureValue, item.measureUnit)}`}
        </p>

        {item.variants && item.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 min-w-0">
            {item.variants.map((variant) => (
              <div
                key={variant.id}
                className="text-[10px] font-medium bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-md border border-brand-purple/20"
              >
                {variant.label || formatMeasure(variant.measureValue, variant.measureUnit)}:{' '}
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
          className="text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/10 p-2 rounded-lg transition-colors"
        >
          <Edit2 size={18} />
        </button>

        <button
          onClick={() => onDelete(item)}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);

export default MenuItemCard;
