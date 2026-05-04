import { useState } from 'react';
import {
  Search, Plus,
  GripVertical, Image as ImageIcon, X, Trash2, Edit2,
  ChevronUp, ChevronDown
} from 'lucide-react';

import { simpleMenuPayload } from "../data/menu_mock.js";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

// Словарь для красивого отображения единиц измерения
const MEASURE_UNITS = [
  { value: 'ml', label: 'мл' },
  { value: 'l', label: 'л' },
  { value: 'g', label: 'г' },
  { value: 'kg', label: 'кг' },
  { value: 'pcs', label: 'шт' },
  { value: 'portion', label: 'порция' }
];

const formatMeasure = (value, unitCode) => {
  if (!value) return '';
  const unit = MEASURE_UNITS.find(u => u.value === unitCode);
  return `${value} ${unit ? unit.label : ''}`.trim();
};

const MenuEditor = () => {
  const [menu, setMenu] = useState(simpleMenuPayload);
  const [activeCategoryId, setActiveCategoryId] = useState(menu.categories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния модалки редактирования категорий
  const [editingCategory, setEditingCategory] = useState(null);

  // Состояния модалки редактирования блюд
  const [editingItem, setEditingItem] = useState(null);
  const [modalMode, setModalMode] = useState('edit'); // 'add' | 'edit'
  const [originalCategoryId, setOriginalCategoryId] = useState(null);
  const [targetCategoryId, setTargetCategoryId] = useState(null);

  // Состояние модалки подтверждения удаления
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'category' | 'item', id: string, name: string, categoryId?: string }

  // Текущая категория и отфильтрованные товары
  const activeCategory = menu.categories.find(c => c.id === activeCategoryId);
  const filteredItems = activeCategory?.items?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // ==========================================
  // ЛОГИКА КАТЕГОРИЙ
  // ==========================================

  const handleAddCategory = () => {
    setEditingCategory({ id: `cat-${Date.now()}`, name: '', description: '', items: [] });
  };

  const handleEditCategory = () => {
    if (!activeCategory) return;
    setEditingCategory(JSON.parse(JSON.stringify(activeCategory)));
  };

  const handleSaveCategory = () => {
    const isExisting = menu.categories.find(c => c.id === editingCategory.id);
    let newCategories;

    if (isExisting) {
      newCategories = menu.categories.map(c =>
        c.id === editingCategory.id ? editingCategory : c
      );
    } else {
      newCategories = [...menu.categories, editingCategory];
    }

    setMenu({ ...menu, categories: newCategories });
    setActiveCategoryId(editingCategory.id);
    setEditingCategory(null);
  };

  const handleDeleteCategoryClick = () => {
    if (!activeCategory) return;
    setDeleteConfirm({
      type: 'category',
      id: activeCategory.id,
      name: activeCategory.name
    });
  };

  const moveCategory = (index, direction) => {
    const newCategories = [...menu.categories];

    if (direction === -1 && index > 0) {
      [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    } else if (direction === 1 && index < newCategories.length - 1) {
      [newCategories[index + 1], newCategories[index]] = [newCategories[index], newCategories[index + 1]];
    }

    setMenu({ ...menu, categories: newCategories });
  };

  // ==========================================
  // ЛОГИКА БЛЮД
  // ==========================================

  const handleAddItemClick = () => {
    setModalMode('add');
    setOriginalCategoryId(null);
    setTargetCategoryId(activeCategoryId);
    setEditingItem({
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      price: '',
      measureValue: '',
      measureUnit: 'ml',
      variants: []
    });
  };

  const handleEditClick = (item) => {
    setModalMode('edit');
    setOriginalCategoryId(activeCategoryId);
    setTargetCategoryId(activeCategoryId);
    setEditingItem(JSON.parse(JSON.stringify(item)));
  };

  const handleDeleteItemClick = (item) => {
    setDeleteConfirm({
      type: 'item',
      id: item.id,
      name: item.name,
      categoryId: activeCategoryId
    });
  };

  const handleSaveItem = () => {
    if (!editingItem.name.trim()) {
      alert('Пожалуйста, введите название блюда');
      return;
    }

    let newCategories = [...menu.categories];

    if (modalMode === 'add') {
      newCategories = newCategories.map(cat => {
        if (cat.id === targetCategoryId) {
          return { ...cat, items: [...(cat.items || []), editingItem] };
        }
        return cat;
      });
    } else if (modalMode === 'edit') {
      if (originalCategoryId === targetCategoryId) {
        newCategories = newCategories.map(cat => {
          if (cat.id === originalCategoryId) {
            return {
              ...cat,
              items: cat.items.map(i => i.id === editingItem.id ? editingItem : i)
            };
          }
          return cat;
        });
      } else {
        newCategories = newCategories.map(cat => {
          if (cat.id === originalCategoryId) {
            return {
              ...cat,
              items: cat.items.filter(i => i.id !== editingItem.id)
            };
          }

          if (cat.id === targetCategoryId) {
            return {
              ...cat,
              items: [...(cat.items || []), editingItem]
            };
          }

          return cat;
        });
      }
    }

    setMenu({ ...menu, categories: newCategories });
    setEditingItem(null);

    if (targetCategoryId !== activeCategoryId) {
      setActiveCategoryId(targetCategoryId);
    }
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...editingItem.variants];
    updatedVariants[index][field] = value;
    setEditingItem({ ...editingItem, variants: updatedVariants });
  };

  const addVariant = () => {
    const newVariant = {
      id: `var-${Date.now()}`,
      label: '',
      price: '',
      measureValue: '',
      measureUnit: 'ml'
    };

    setEditingItem({
      ...editingItem,
      variants: editingItem.variants ? [...editingItem.variants, newVariant] : [newVariant],
      price: '',
      measureValue: '',
      measureUnit: 'ml'
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = editingItem.variants.filter((_, i) => i !== index);

    setEditingItem({
      ...editingItem,
      variants: updatedVariants.length > 0 ? updatedVariants : undefined
    });
  };

  // ==========================================
  // ВЫПОЛНЕНИЕ УДАЛЕНИЯ
  // ==========================================

  const executeDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'category') {
      const newCategories = menu.categories.filter(c => c.id !== deleteConfirm.id);

      setMenu({ ...menu, categories: newCategories });

      if (newCategories.length > 0) {
        setActiveCategoryId(newCategories[0].id);
      } else {
        setActiveCategoryId(null);
      }
    } else if (deleteConfirm.type === 'item') {
      const newCategories = menu.categories.map(cat => {
        if (cat.id === deleteConfirm.categoryId) {
          return {
            ...cat,
            items: cat.items.filter(i => i.id !== deleteConfirm.id)
          };
        }

        return cat;
      });

      setMenu({ ...menu, categories: newCategories });
    }

    setDeleteConfirm(null);
  };

  return (
    <div className="bg-card border border-border/60 rounded-3xl shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[calc(100vh-8rem)] relative w-full max-w-full min-w-0">

      {/* --- САЙДБАР КАТЕГОРИЙ --- */}
      <div className="w-full max-w-full min-w-0 md:w-[320px] border-b md:border-b-0 md:border-r border-border/60 bg-secondary/10 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/60 bg-card/50 shrink-0">
          <h2 className="font-extrabold text-foreground tracking-tight text-lg">КАТЕГОРИИ</h2>

          <button
            onClick={handleAddCategory}
            className="text-brand-purple hover:bg-brand-purple/10 p-1.5 rounded-lg transition-colors shrink-0"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {/*
          ВАЖНО:
          На мобиле это горизонтальная лента чипсов.
          Она скроллится внутри себя и больше не расширяет весь экран.
        */}
        <div className="w-full max-w-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto p-3 sm:p-4 flex md:flex-col flex-nowrap gap-2 no-scrollbar overscroll-x-contain">
          {menu.categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 shrink-0 md:shrink md:w-full"
            >
              <button
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all whitespace-nowrap text-left min-w-max md:min-w-0 md:w-full ${
                  activeCategoryId === cat.id
                    ? 'bg-background shadow-sm border border-border/50 text-brand-purple font-bold'
                    : 'text-muted-foreground hover:bg-secondary/50 font-semibold border border-transparent'
                }`}
              >
                <span className="truncate max-w-[180px] md:max-w-none text-sm sm:text-base">
                  {cat.name}
                </span>

                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                  activeCategoryId === cat.id
                    ? 'bg-brand-purple/10 text-brand-purple'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {cat.items?.length || 0}
                </span>
              </button>

              <div className="hidden md:flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => moveCategory(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronUp size={16} strokeWidth={3} />
                </button>

                <button
                  onClick={() => moveCategory(idx, 1)}
                  disabled={idx === menu.categories.length - 1}
                  className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronDown size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- ОСНОВНАЯ ОБЛАСТЬ --- */}
      <div className="flex-1 flex flex-col bg-background relative min-w-0 w-full max-w-full overflow-hidden">

        {/* Хедер категории */}
        {activeCategory ? (
          <div className="p-4 sm:p-6 lg:p-8 border-b border-border/60 flex flex-col sm:flex-row gap-4 sm:items-start justify-between bg-card z-10 sticky top-0 min-w-0 max-w-full overflow-hidden">
            <div className="flex flex-col min-w-0 max-w-full">
              <div className="flex items-center gap-3 min-w-0 max-w-full">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate min-w-0">
                  {activeCategory.name}
                </h1>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleEditCategory}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/10 border border-border/60 hover:border-brand-purple/30 transition-all bg-secondary/30 shadow-sm"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={handleDeleteCategoryClick}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/60 hover:border-destructive/30 transition-all bg-secondary/30 shadow-sm"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {activeCategory.description && (
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed truncate whitespace-normal line-clamp-2">
                  {activeCategory.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 min-w-0">
              <div className="relative flex-1 sm:w-64 min-w-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />

                <Input
                  placeholder="Поиск блюда..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/30 border-transparent focus:bg-background h-10 w-full rounded-xl min-w-0"
                />
              </div>

              <Button
                onClick={handleAddItemClick}
                className="bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl h-10 px-4 shadow-sm shrink-0"
              >
                <Plus size={18} className="mr-2" />
                Блюдо
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 border-b border-border/60 bg-card">
            <h1 className="text-xl font-bold text-muted-foreground">Выберите категорию</h1>
          </div>
        )}

        {/* Список карточек блюд */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-3 bg-secondary/5 min-w-0 max-w-full">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>Нет блюд в этой категории</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center gap-4 p-3 sm:p-4 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all min-w-0 max-w-full overflow-hidden"
              >
                {/* Левая часть */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <button className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing hidden sm:block shrink-0">
                    <GripVertical size={20} />
                  </button>

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/50 shrink-0">
                    <ImageIcon size={24} className="text-muted-foreground/50" />
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

                {/* Правая часть */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-14 sm:pl-0 border-t border-border/50 sm:border-0 pt-3 sm:pt-0 min-w-0">
                  {(!item.variants || item.variants.length === 0) && (
                    <div className="font-extrabold text-sm sm:text-base whitespace-nowrap text-foreground">
                      {item.price}
                    </div>
                  )}

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <Switch
                      defaultChecked
                      className="data-[state=checked]:bg-green-500 scale-90 sm:scale-100"
                    />

                    <button
                      onClick={() => handleEditClick(item)}
                      className="text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/10 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteItemClick(item)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* МОДАЛКА УДАЛЕНИЯ */}
      {/* ========================================== */}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-card w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center space-y-4 pt-8">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 size={28} />
              </div>

              <h2 className="text-xl font-bold text-foreground">
                {deleteConfirm.type === 'category' ? 'Удалить категорию?' : 'Удалить блюдо?'}
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                Вы уверены, что хотите удалить{' '}
                <span className="font-bold text-foreground">«{deleteConfirm.name}»</span>?
                {deleteConfirm.type === 'category' && ' Все блюда внутри этой категории также будут навсегда удалены.'}{' '}
                Это действие нельзя отменить.
              </p>
            </div>

            <div className="p-4 sm:p-6 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-secondary/10">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="w-full sm:w-auto rounded-xl border-border/60 hover:bg-secondary font-semibold"
              >
                Отмена
              </Button>

              <Button
                onClick={executeDelete}
                className="w-full sm:w-auto rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold shadow-md px-6"
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* МОДАЛКА РЕДАКТИРОВАНИЯ КАТЕГОРИИ */}
      {/* ========================================== */}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingCategory.name ? 'Настройки категории' : 'Новая категория'}
                </h2>
              </div>

              <button
                onClick={() => setEditingCategory(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-secondary transition-colors text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-background">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Название
                </Label>

                <Input
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({
                    ...editingCategory,
                    name: e.target.value
                  })}
                  className="h-11 bg-secondary/30 border-transparent focus:bg-background rounded-xl text-base"
                  placeholder="Например: Десерты"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Описание (опционально)
                </Label>

                <textarea
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({
                    ...editingCategory,
                    description: e.target.value
                  })}
                  className="w-full min-h-[80px] bg-secondary/30 border-transparent focus:border-ring focus:bg-background rounded-xl p-3 text-sm outline-none resize-y transition-colors"
                  placeholder="Показывать под заголовком категории..."
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-border/60 flex justify-end gap-3 bg-card">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className="rounded-xl border-border/60 hover:bg-secondary font-semibold"
              >
                Отмена
              </Button>

              <Button
                onClick={handleSaveCategory}
                disabled={!editingCategory.name.trim()}
                className="rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold shadow-md shadow-brand-purple/20 px-6"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* МОДАЛКА БЛЮДА */}
      {/* ========================================== */}

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-secondary/20">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {modalMode === 'add' ? 'Новое блюдо' : 'Редактирование блюда'}
                </h2>

                <p className="text-xs text-muted-foreground mt-1">
                  Изменения применятся после сохранения.
                </p>
              </div>

              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border hover:bg-secondary transition-colors text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-background custom-scrollbar">

              {/* СЕЛЕКТ КАТЕГОРИИ */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Категория
                </Label>

                <div className="relative">
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                    className="flex h-11 w-full items-center rounded-xl border border-input bg-secondary/30 px-3 text-sm sm:text-base transition-colors focus:bg-background focus:outline-none focus:ring-2 focus:ring-brand-purple/50 appearance-none cursor-pointer font-medium"
                  >
                    {menu.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
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
                  value={editingItem.name}
                  onChange={e => setEditingItem({
                    ...editingItem,
                    name: e.target.value
                  })}
                  className="h-11 bg-secondary/30 border-transparent focus:bg-background rounded-xl text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Описание
                </Label>

                <textarea
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({
                    ...editingItem,
                    description: e.target.value
                  })}
                  className="w-full min-h-[100px] bg-secondary/30 border-transparent focus:border-ring focus:bg-background rounded-xl p-3 text-sm outline-none resize-y transition-colors"
                  placeholder="Вкусное описание для гостей..."
                />
              </div>

              {/* БЛОК: ЦЕНА И ВАРИАНТЫ */}
              <div className="bg-secondary/20 p-4 sm:p-5 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Стоимость и объем
                  </Label>

                  <button
                    onClick={addVariant}
                    className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:bg-brand-purple/10 px-2 py-1 rounded-md transition-colors shrink-0"
                  >
                    <Plus size={14} />
                    Добавить опцию
                  </button>
                </div>

                {(!editingItem.variants || editingItem.variants.length === 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Цена (₽)
                      </Label>

                      <Input
                        value={editingItem.price || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          price: e.target.value
                        })}
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
                        value={editingItem.measureValue || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          measureValue: e.target.value
                        })}
                        className="bg-background rounded-lg border border-input h-10"
                        placeholder="Например: 250"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Ед. изм.
                      </Label>

                      <div className="relative">
                        <select
                          value={editingItem.measureUnit || 'ml'}
                          onChange={e => setEditingItem({
                            ...editingItem,
                            measureUnit: e.target.value
                          })}
                          className="flex h-10 w-full items-center rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 appearance-none cursor-pointer"
                        >
                          {MEASURE_UNITS.map(u => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingItem.variants.map((variant, idx) => (
                      <div
                        key={variant.id || idx}
                        className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-3 p-3 bg-background border border-border/60 rounded-xl relative group"
                      >
                        <button
                          onClick={() => removeVariant(idx)}
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
                            onChange={e => handleVariantChange(idx, 'label', e.target.value)}
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
                            onChange={e => handleVariantChange(idx, 'measureValue', e.target.value)}
                            className="h-9 text-xs bg-secondary/30"
                            placeholder="400"
                          />
                        </div>

                        <div className="w-[80px] sm:w-[90px] space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Ед. изм.
                          </Label>

                          <div className="relative">
                            <select
                              value={variant.measureUnit || 'ml'}
                              onChange={e => handleVariantChange(idx, 'measureUnit', e.target.value)}
                              className="flex h-9 w-full items-center rounded-lg border border-transparent bg-secondary/30 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/50 appearance-none cursor-pointer"
                            >
                              {MEASURE_UNITS.map(u => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>

                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                              <ChevronDown size={12} />
                            </div>
                          </div>
                        </div>

                        <div className="w-[90px] sm:w-[100px] space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Цена (₽)
                          </Label>

                          <Input
                            value={variant.price || ''}
                            onChange={e => handleVariantChange(idx, 'price', e.target.value)}
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
                  defaultChecked
                  className="data-[state=checked]:bg-green-500 shrink-0"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-border/60 flex justify-end gap-3 bg-card">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border-border/60 hover:bg-secondary font-semibold"
              >
                Отмена
              </Button>

              <Button
                onClick={handleSaveItem}
                disabled={!editingItem.name.trim()}
                className="rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold shadow-md shadow-brand-purple/20 px-6"
              >
                {modalMode === 'add' ? 'Добавить блюдо' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenuEditor;