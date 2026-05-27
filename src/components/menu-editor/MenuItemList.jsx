import { useTranslation } from 'react-i18next';
import MenuItemCard from "./MenuItemCard";

const MenuItemList = ({ items, language, defaultLanguage, onEditItem, onDeleteItem, onToggleItemAvailability }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-3 space-y-2.5 bg-secondary/5 min-w-0 max-w-full">
      {items.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <p>{t('menuEditor.noItems')}</p>
        </div>
      ) : (
        items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            language={language}
            defaultLanguage={defaultLanguage}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onToggleAvailability={(checked) => onToggleItemAvailability(item.id, checked)}
          />
        ))
      )}
    </div>
  );
};

export default MenuItemList;
