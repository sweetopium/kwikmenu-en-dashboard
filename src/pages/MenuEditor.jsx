import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Edit2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

import CategoryModal from "../components/menu-editor/CategoryModal";
import CategorySidebar from "../components/menu-editor/CategorySidebar";
import DeleteConfirmModal from "../components/menu-editor/DeleteConfirmModal";
import ItemModal from "../components/menu-editor/ItemModal";
import MenuMetaModal from "../components/menu-editor/MenuMetaModal";
import MenuItemList from "../components/menu-editor/MenuItemList";
import { simpleMenuPayload } from "../data/menu_mock.js";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { loadImportedMenuFromStorage, saveImportedMenuToStorage } from "../lib/importedMenuStorage";
import { normalizeMenu } from "../lib/menuNormalization";
import { getMenu, updateMenu } from "../lib/menusApi";
import { getLanguageMeta } from "../lib/languageMeta";
import {
  formFieldClasses,
  formSelectClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
  subtleIconButtonClasses,
} from "../lib/uiStyles";
import {
  getAvailableHoursLabel,
  getLocalizedField,
  setLocalizedField,
} from "../components/menu-editor/menuEditorUtils";

const MenuEditor = () => {
  const { id } = useParams();
  const isImportedMenu = id === 'imported';
  const isRemoteMenu = Boolean(id) && !isImportedMenu;
  const resolveMenuPayload = () => {
    if (!isImportedMenu) {
      return simpleMenuPayload;
    }

    return loadImportedMenuFromStorage() || simpleMenuPayload;
  };
  const [menu, setMenu] = useState(() => {
    return resolveMenuPayload();
  });
  const [activeCategoryId, setActiveCategoryId] = useState(menu.categories[0]?.id);
  const [editorLanguage, setEditorLanguage] = useState(menu.defaultLanguage || 'ru');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMenuMeta, setEditingMenuMeta] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [originalCategoryId, setOriginalCategoryId] = useState(null);
  const [targetCategoryId, setTargetCategoryId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isLoadingRemoteMenu, setIsLoadingRemoteMenu] = useState(false);
  const [remoteMenuError, setRemoteMenuError] = useState('');
  const hasLoadedRemoteMenuRef = useRef(false);

  const activeCategory = menu.categories.find((category) => category.id === activeCategoryId);
  const filteredItems = activeCategory?.items?.filter((item) =>
    getLocalizedField(item, 'name', editorLanguage, menu.defaultLanguage).toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  const localizedMenuName = getLocalizedField(menu.menuMeta, 'name', editorLanguage, menu.defaultLanguage);
  const localizedCategoryName = getLocalizedField(activeCategory, 'name', editorLanguage, menu.defaultLanguage);
  const localizedCategoryDescription = getLocalizedField(activeCategory, 'description', editorLanguage, menu.defaultLanguage);

  useEffect(() => {
    if (isRemoteMenu) {
      let cancelled = false;
      setIsLoadingRemoteMenu(true);
      setRemoteMenuError('');

      getMenu(id)
        .then((response) => {
          if (cancelled) return;
          const nextMenu = response.payload;
          hasLoadedRemoteMenuRef.current = true;
          setMenu(nextMenu);
          setActiveCategoryId(nextMenu.categories[0]?.id || null);
          setEditorLanguage(nextMenu.defaultLanguage || 'ru');
          setSearchQuery('');
        })
        .catch((error) => {
          if (cancelled) return;
          setRemoteMenuError(error?.message || 'Не удалось загрузить меню');
        })
        .finally(() => {
          if (cancelled) return;
          setIsLoadingRemoteMenu(false);
        });

      return () => {
        cancelled = true;
      };
    }

    const nextMenu = resolveMenuPayload();
    hasLoadedRemoteMenuRef.current = true;
    setMenu(nextMenu);
    setActiveCategoryId(nextMenu.categories[0]?.id || null);
    setEditorLanguage(nextMenu.defaultLanguage || 'ru');
    setSearchQuery('');
  }, [id]);

  useEffect(() => {
    if (!isImportedMenu) {
      return;
    }

    saveImportedMenuToStorage(menu);
  }, [isImportedMenu, menu]);

  useEffect(() => {
    if (!isRemoteMenu || !hasLoadedRemoteMenuRef.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      updateMenu(id, { payload: menu }).catch(() => {});
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [id, isRemoteMenu, menu]);

  if (isLoadingRemoteMenu) {
    return <div className="rounded-3xl border border-border/60 bg-card p-8 text-sm text-muted-foreground shadow-sm">Загружаем меню...</div>;
  }

  if (remoteMenuError) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive shadow-sm">{remoteMenuError}</div>;
  }

  const handleAddCategory = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      description: '',
      translations: {},
      sortOrder: menu.categories.length + 1,
      isHidden: false,
      imageUrl: null,
      availableHours: null,
      items: [],
    });
  };

  const handleEditCategory = () => {
    if (!activeCategory) return;
    setEditingCategory(JSON.parse(JSON.stringify(activeCategory)));
  };

  const handleEditMenuMeta = () => {
    setEditingMenuMeta(JSON.parse(JSON.stringify(menu.menuMeta)));
  };

  const handleSaveMenuMeta = () => {
    setMenu({ ...menu, menuMeta: editingMenuMeta });
    setEditingMenuMeta(null);
  };

  const handleSaveCategory = () => {
    const isExisting = menu.categories.find((category) => category.id === editingCategory.id);
    const newCategories = isExisting
      ? menu.categories.map((category) =>
        category.id === editingCategory.id ? editingCategory : category
      )
      : [...menu.categories, editingCategory];

    setMenu({ ...menu, categories: newCategories });
    setActiveCategoryId(editingCategory.id);
    setEditingCategory(null);
  };

  const moveCategory = (index, direction) => {
    const newCategories = [...menu.categories];

    if (direction === -1 && index > 0) {
      [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    } else if (direction === 1 && index < newCategories.length - 1) {
      [newCategories[index + 1], newCategories[index]] = [newCategories[index], newCategories[index + 1]];
    }

    setMenu({
      ...menu,
      categories: newCategories.map((category, categoryIndex) => ({
        ...category,
        sortOrder: categoryIndex + 1,
      })),
    });
  };

  const handleAddItemClick = () => {
    setModalMode('add');
    setOriginalCategoryId(null);
    setTargetCategoryId(activeCategoryId);
    setEditingItem({
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      translations: {},
      price: '',
      measureValue: '',
      measureUnit: 'ml',
      tags: [],
      badge: null,
      availableHours: null,
      sortOrder: (activeCategory?.items?.length || 0) + 1,
      isAvailable: true,
      imageUrl: null,
      variants: [],
    });
  };

  const handleEditItemClick = (item) => {
    setModalMode('edit');
    setOriginalCategoryId(activeCategoryId);
    setTargetCategoryId(activeCategoryId);
    setEditingItem(JSON.parse(JSON.stringify(item)));
  };

  const handleDeleteCategoryClick = () => {
    if (!activeCategory) return;
    setDeleteConfirm({
      type: 'category',
      id: activeCategory.id,
      name: localizedCategoryName,
    });
  };

  const handleDeleteItemClick = (item) => {
    setDeleteConfirm({
      type: 'item',
      id: item.id,
      name: getLocalizedField(item, 'name', editorLanguage, menu.defaultLanguage),
      categoryId: activeCategoryId,
    });
  };

  const handleSaveItem = () => {
    if (!editingItem.name.trim()) {
      alert('Пожалуйста, введите название блюда');
      return;
    }

    let newCategories = [...menu.categories];

    if (modalMode === 'add') {
      newCategories = newCategories.map((category) => {
        if (category.id === targetCategoryId) {
          return { ...category, items: [...(category.items || []), editingItem] };
        }
        return category;
      });
    } else if (originalCategoryId === targetCategoryId) {
      newCategories = newCategories.map((category) => {
        if (category.id === originalCategoryId) {
          return {
            ...category,
            items: category.items.map((item) => item.id === editingItem.id ? editingItem : item),
          };
        }
        return category;
      });
    } else {
      newCategories = newCategories.map((category) => {
        if (category.id === originalCategoryId) {
          return {
            ...category,
            items: category.items.filter((item) => item.id !== editingItem.id),
          };
        }

        if (category.id === targetCategoryId) {
          return {
            ...category,
            items: [...(category.items || []), editingItem],
          };
        }

        return category;
      });
    }

    setMenu({ ...menu, categories: newCategories });
    setEditingItem(null);

    if (targetCategoryId !== activeCategoryId) {
      setActiveCategoryId(targetCategoryId);
    }
  };

  const handleVariantChange = (index, field, value, language = menu.defaultLanguage) => {
    const updatedVariants = [...editingItem.variants];
    updatedVariants[index] = field === 'label'
      ? setLocalizedField(updatedVariants[index], field, value, language, menu.defaultLanguage)
      : { ...updatedVariants[index], [field]: value };
    setEditingItem({ ...editingItem, variants: updatedVariants });
  };

  const addVariant = () => {
    const newVariant = {
      id: `var-${Date.now()}`,
      label: '',
      translations: {},
      price: '',
      measureValue: '',
      measureUnit: 'ml',
      sortOrder: (editingItem.variants?.length || 0) + 1,
      isAvailable: true,
    };

    setEditingItem({
      ...editingItem,
      variants: editingItem.variants ? [...editingItem.variants, newVariant] : [newVariant],
      price: '',
      measureValue: '',
      measureUnit: 'ml',
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = editingItem.variants.filter((_, variantIndex) => variantIndex !== index);

    setEditingItem({
      ...editingItem,
      variants: updatedVariants.length > 0
        ? updatedVariants.map((variant, variantIndex) => ({ ...variant, sortOrder: variantIndex + 1 }))
        : undefined,
    });
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'category') {
      const newCategories = menu.categories.filter((category) => category.id !== deleteConfirm.id);

      setMenu({
        ...menu,
        categories: newCategories.map((category, index) => ({ ...category, sortOrder: index + 1 })),
      });
      setActiveCategoryId(newCategories[0]?.id || null);
    } else if (deleteConfirm.type === 'item') {
      const newCategories = menu.categories.map((category) => {
        if (category.id === deleteConfirm.categoryId) {
          return {
            ...category,
            items: category.items
              .filter((item) => item.id !== deleteConfirm.id)
              .map((item, index) => ({ ...item, sortOrder: index + 1 })),
          };
        }

        return category;
      });

      setMenu({ ...menu, categories: newCategories });
    }

    setDeleteConfirm(null);
  };

  const handleNormalizeMenu = async () => {
    setIsNormalizing(true);

    try {
      const response = await normalizeMenu(menu);
      setMenu(response.menu);
    } catch (error) {
      alert(error?.message || 'Не удалось нормализовать меню');
    } finally {
      setIsNormalizing(false);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-3xl shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[calc(100vh-8rem)] relative w-full max-w-full min-w-0">
      <CategorySidebar
        categories={menu.categories}
        activeCategoryId={activeCategoryId}
        language={editorLanguage}
        defaultLanguage={menu.defaultLanguage}
        onAddCategory={handleAddCategory}
        onSelectCategory={setActiveCategoryId}
        onMoveCategory={moveCategory}
      />

      <div className="flex-1 flex flex-col bg-background relative min-w-0 w-full max-w-full overflow-hidden">
        {activeCategory ? (
          <div className="p-4 sm:p-6 lg:p-8 border-b border-border/60 flex flex-col gap-4 bg-card z-10 sticky top-0 min-w-0 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full min-w-0 sm:justify-end md:ml-auto md:w-auto md:max-w-full md:rounded-xl md:border md:border-border/70 md:bg-secondary/35 md:px-3 md:py-3 mb-0 md:mb-4">
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:flex-row shrink-0">
                <div className="relative min-w-0 sm:min-w-[156px]">
                  <select
                    value={editorLanguage}
                    onChange={(event) => setEditorLanguage(event.target.value)}
                    className={formSelectClasses}
                  >
                    {menu.languages.map((language) => {
                      const meta = getLanguageMeta(language.code);
                      const flag = language.flag || meta?.flag || '🌐';
                      const label = language.nativeName || meta?.label || language.shortLabel || language.code.toUpperCase();

                      return (
                        <option key={language.code} value={language.code}>
                          {flag} {label}
                        </option>
                      );
                    })}
                  </select>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleEditMenuMeta}
                  className={`${secondaryActionButtonClasses} sm:h-[44px] h-[44px] px-5 w-full sm:w-auto shrink-0`}
                >
                  Редактировать
                </Button>

                {isImportedMenu && (
                  <Button
                    variant="outline"
                    onClick={handleNormalizeMenu}
                    disabled={isNormalizing}
                    className={`${secondaryActionButtonClasses} sm:h-[44px] h-[44px] px-5 w-full sm:w-auto shrink-0`}
                  >
                    <Sparkles size={16} className="mr-2" />
                    {isNormalizing ? 'Нормализация...' : 'Нормализовать'}
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto min-w-0 sm:flex-none">
                <div className="relative flex-1 sm:w-64 min-w-0">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />

                  <Input
                    placeholder="Поиск блюда..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={`${formFieldClasses} !pl-[30px]`}
                  />
                </div>

                <Button
                  onClick={handleAddItemClick}
                  className={`${primaryActionButtonClasses} sm:h-[44px] h-[44px] px-4 shrink-0`}
                >
                  <Plus size={18} className="mr-2" />
                  Блюдо
                </Button>
              </div>
            </div>

            <div className="flex flex-col min-w-0 max-w-full">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                {localizedMenuName}
              </p>
              <div className="flex items-center gap-3 min-w-0 max-w-full">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate min-w-0">
                  {localizedCategoryName}
                </h1>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleEditCategory}
                    className={`${subtleIconButtonClasses} hover:text-brand-purple hover:bg-brand-purple/10 hover:border-brand-purple/30 shadow-sm`}
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={handleDeleteCategoryClick}
                    className={`${subtleIconButtonClasses} hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 shadow-sm`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {localizedCategoryDescription && (
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed truncate whitespace-normal line-clamp-2">
                  {localizedCategoryDescription}
                </p>
              )}

              {activeCategory.availableHours?.start && activeCategory.availableHours?.end && (
                <p className="text-xs font-semibold text-foreground/80 mt-2">
                  Доступно: {getAvailableHoursLabel(activeCategory.availableHours)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 border-b border-border/60 bg-card">
            <h1 className="text-xl font-bold text-muted-foreground">Выберите категорию</h1>
          </div>
        )}

        <MenuItemList
          items={filteredItems}
          language={editorLanguage}
          defaultLanguage={menu.defaultLanguage}
          onEditItem={handleEditItemClick}
          onDeleteItem={handleDeleteItemClick}
        />
      </div>

      <DeleteConfirmModal
        deleteConfirm={deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
      />

      <CategoryModal
        category={editingCategory}
        language={editorLanguage}
        defaultLanguage={menu.defaultLanguage}
        onChange={setEditingCategory}
        onCancel={() => setEditingCategory(null)}
        onSave={handleSaveCategory}
      />

      <MenuMetaModal
        menuMeta={editingMenuMeta}
        language={editorLanguage}
        defaultLanguage={menu.defaultLanguage}
        onChange={setEditingMenuMeta}
        onCancel={() => setEditingMenuMeta(null)}
        onSave={handleSaveMenuMeta}
      />

      <ItemModal
        item={editingItem}
        mode={modalMode}
        categories={menu.categories}
        language={editorLanguage}
        defaultLanguage={menu.defaultLanguage}
        targetCategoryId={targetCategoryId}
        onTargetCategoryChange={setTargetCategoryId}
        onChange={setEditingItem}
        onVariantChange={handleVariantChange}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onCancel={() => setEditingItem(null)}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default MenuEditor;
