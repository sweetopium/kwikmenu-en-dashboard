import { GripVertical, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react';
import { Switch } from "../ui/switch";
import { formatMeasure } from "./menuEditorUtils";

const MenuItemCard = ({ item, language, defaultLanguage, onEdit, onDelete }) => {
  const name = language !== defaultLanguage && item.translations?.[language]?.name ? item.translations[language].name : item.name;
  const desc = language !== defaultLanguage && item.translations?.[language]?.description ? item.translations[language].description : item.description;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all min-w-0 max-w-full overflow-hidden">

      {/* --- ЛЕВАЯ ЧАСТЬ (Десктоп) / ВЕРХНЯЯ ЧАСТЬ (Мобилка) --- */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 p-3 sm:p-4 sm:pr-2">

        {/* Драг-хэндл (Скрыт на мобилке) */}
        <button className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing hidden sm:block shrink-0">
          <GripVertical size={20} />
        </button>

        {/* Изображение */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/50 shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={24} className="text-muted-foreground/50" />
          )}
        </div>

        {/* Инфо-блок */}
        <div className="flex flex-col flex-1 min-w-0 pt-0.5">

          {/* Название и Цена */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            {/* Убрали truncate, добавили break-words и leading-snug для аккуратного переноса строк */}
            <h3 className="font-bold text-sm leading-snug sm:text-base text-foreground break-words">
              {name}
            </h3>
            {(!item.variants || item.variants.length === 0) && (
              <span className="font-extrabold text-sm text-foreground sm:hidden shrink-0">
                {item.price}
              </span>
            )}
          </div>

          {/* Описание */}
          {/* Убрали line-clamp-2, текст теперь выводится полностью */}
          <p className="text-xs text-muted-foreground mt-1 break-words leading-relaxed">
            {desc || "Описания нет"}
            {item.measureValue && ` • ${formatMeasure(item.measureValue, item.measureUnit)}`}
          </p>

          {/* Варианты (Чипсы) */}
          {item.variants && item.variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 min-w-0">
              {item.variants.map(v => (
                <div
                  key={v.id}
                  className="text-[10px] font-medium bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-md border border-brand-purple/20"
                >
                  {v.label || formatMeasure(v.measureValue, v.measureUnit)}:{' '}
                  <span className="font-bold">{v.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- ПРАВАЯ ЧАСТЬ (Десктоп) / ФУТЕР ДЕЙСТВИЙ (Мобилка) --- */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto px-3 py-2.5 sm:p-4 sm:pl-2 bg-secondary/30 sm:bg-transparent border-t border-border/50 sm:border-t-0">

        {/* Цена (Показывается ТОЛЬКО на десктопе) */}
        {(!item.variants || item.variants.length === 0) && (
          <div className="font-extrabold text-sm sm:text-base whitespace-nowrap text-foreground hidden sm:block">
            {item.price}
          </div>
        )}

        {/* Свитч */}
        <div className="flex items-center h-full">
          <Switch
            defaultChecked={item.isAvailable !== false}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="flex items-center justify-center w-[34px] h-[34px] sm:w-auto sm:h-auto text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/10 sm:p-2 rounded-lg transition-colors bg-background sm:bg-transparent border border-border/60 sm:border-transparent shadow-sm sm:shadow-none"
          >
            <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            onClick={() => onDelete(item)}
            className="flex items-center justify-center w-[34px] h-[34px] sm:w-auto sm:h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:p-2 rounded-lg transition-colors bg-background sm:bg-transparent border border-border/60 sm:border-transparent shadow-sm sm:shadow-none"
          >
            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default MenuItemCard;
