import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { getAvailableHoursLabel, getLocalizedField } from "./menuEditorUtils";
import {primaryActionButtonClasses} from "../../lib/uiStyles.js";

const CategorySidebar = ({
  categories,
  activeCategoryId,
  language,
  defaultLanguage,
  onAddCategory,
  onSelectCategory,
  onMoveCategory,
}) => (
  <div className="w-full max-w-full min-w-0 md:w-[292px] border-b md:border-b-0 md:border-r border-border/60 bg-secondary/10 flex flex-col shrink-0 overflow-hidden">
    <div className="p-3 sm:p-4 flex items-center justify-between border-b border-border/60 bg-card/50 shrink-0">
      <h2 className="font-extrabold text-foreground tracking-tight text-sm">Категории</h2>

      <button
        onClick={onAddCategory}
        className={`${primaryActionButtonClasses} sm:h-10 h-10 px-3.5 shrink-0`}
      >
        <Plus size={18} strokeWidth={3} />
      </button>
    </div>

    <div className="w-full max-w-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto p-2.5 sm:p-3 flex md:flex-col flex-nowrap gap-1.5 no-scrollbar overscroll-x-contain">
      {categories.map((category, index) => (
        <div key={category.id} className="flex items-center gap-1.5 shrink-0 md:shrink md:w-full">
          <button
            onClick={() => onSelectCategory(category.id)}
            className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all whitespace-nowrap text-left min-w-max md:min-w-0 md:w-full ${
              activeCategoryId === category.id
                ? 'bg-background shadow-sm border border-border/50 text-brand-purple font-bold'
                : 'text-muted-foreground hover:bg-secondary/50 font-semibold border border-transparent'
            }`}
          >
            <div className="min-w-0">
              <span className="truncate max-w-[170px] md:max-w-none text-xs sm:text-sm block">
                {getLocalizedField(category, 'name', language, defaultLanguage)}
              </span>
              {category.availableHours?.start && category.availableHours?.end && (
                <span className="text-[9px] font-medium text-muted-foreground/80 block mt-0.5">
                  {getAvailableHoursLabel(category.availableHours)}
                </span>
              )}
            </div>

            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
              activeCategoryId === category.id
                ? 'bg-brand-purple/10 text-brand-purple'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {category.items?.length || 0}
            </span>
          </button>

          <div className="hidden md:flex flex-col gap-0.5 shrink-0">
            <button
              onClick={() => onMoveCategory(index, -1)}
              disabled={index === 0}
              className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronUp size={14} strokeWidth={3} />
            </button>

            <button
              onClick={() => onMoveCategory(index, 1)}
              disabled={index === categories.length - 1}
              className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronDown size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CategorySidebar;
