import MenuItemCard from "./MenuItemCard";

const MenuItemList = ({ items, onEditItem, onDeleteItem }) => (
  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-3 bg-secondary/5 min-w-0 max-w-full">
    {items.length === 0 ? (
      <div className="text-center py-20 text-muted-foreground">
        <p>Нет блюд в этой категории</p>
      </div>
    ) : (
      items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
        />
      ))
    )}
  </div>
);

export default MenuItemList;
