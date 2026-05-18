import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronDown, Code2, Edit2, ExternalLink, Plus, Save, Search, Trash2 } from 'lucide-react';

import CategoryModal from '@dashboard/components/menu-editor/CategoryModal';
import CategorySidebar from '@dashboard/components/menu-editor/CategorySidebar';
import DeleteConfirmModal from '@dashboard/components/menu-editor/DeleteConfirmModal';
import ItemModal from '@dashboard/components/menu-editor/ItemModal';
import MenuItemList from '@dashboard/components/menu-editor/MenuItemList';
import MenuMetaModal from '@dashboard/components/menu-editor/MenuMetaModal';
import {
  getAvailableHoursLabel,
  getLocalizedField,
  setLocalizedField,
} from '@dashboard/components/menu-editor/menuEditorUtils';
import { TOP_MENU_LANGUAGES } from '@dashboard/lib/languageMeta';
import {
  formFieldClasses,
  formSelectClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
  subtleIconButtonClasses,
} from '@dashboard/lib/uiStyles';

import { Button } from '../components/ui/Button';
import { fetchMenuDetail, updateMenu } from '../lib/adminApi';

const makeCategory = (sortOrder) => ({
  id: `cat-${Date.now()}`,
  name: '',
  description: '',
  translations: {},
  sortOrder,
  isHidden: false,
  imageUrl: null,
  availableHours: null,
  items: [],
});

const makeItem = (sortOrder) => ({
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
  sortOrder,
  isAvailable: true,
  imageUrl: null,
  variants: [],
});

const MenuEditorPage = () => {
  const { id } = useParams();
  const [menuRecord, setMenuRecord] = useState(null);
  const [menu, setMenu] = useState(null);
  const [status, setStatus] = useState('draft');
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [editorLanguage, setEditorLanguage] = useState('ru');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMenuMeta, setEditingMenuMeta] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [originalCategoryId, setOriginalCategoryId] = useState(null);
  const [targetCategoryId, setTargetCategoryId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchMenuDetail(id)
      .then((data) => {
        setMenuRecord(data);
        setMenu(data.payload);
        setStatus(data.status);
        setActiveCategoryId(data.payload.categories?.[0]?.id || null);
        setEditorLanguage(data.payload.defaultLanguage || 'ru');
        setJsonText(JSON.stringify(data.payload, null, 2));
      })
      .catch((nextError) => setError(nextError.message));
  }, [id]);

  useEffect(() => {
    if (menu) {
      setJsonText(JSON.stringify(menu, null, 2));
    }
  }, [menu]);

  const activeCategory = useMemo(
    () => menu?.categories?.find((category) => category.id === activeCategoryId) || null,
    [menu, activeCategoryId],
  );

  const filteredItems = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return activeCategory.items || [];
    }

    return (activeCategory.items || []).filter((item) =>
      getLocalizedField(item, 'name', editorLanguage, menu.defaultLanguage).toLowerCase().includes(query)
    );
  }, [activeCategory, editorLanguage, menu, searchQuery]);

  if (!menu) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 text-sm font-semibold text-muted-foreground shadow-sm">
        {error || 'Загружаем меню...'}
      </div>
    );
  }

  const localizedMenuName = getLocalizedField(menu.menuMeta, 'name', editorLanguage, menu.defaultLanguage);
  const localizedCategoryName = getLocalizedField(activeCategory, 'name', editorLanguage, menu.defaultLanguage);
  const localizedCategoryDescription = getLocalizedField(activeCategory, 'description', editorLanguage, menu.defaultLanguage);
  const publicPreviewUrl = menuRecord?.venueId ? `https://kwik.blockranker.co/m/${menuRecord.venueId}?menu=${id}` : null;

  const handleEditorLanguageChange = (languageCode) => {
    const selectedLanguage = TOP_MENU_LANGUAGES.find((language) => language.code === languageCode);
    setEditorLanguage(languageCode);
    if (!selectedLanguage || menu.languages.some((language) => language.code === languageCode)) {
      return;
    }
    setMenu({ ...menu, languages: [...menu.languages, selectedLanguage] });
  };

  const handleAddCategory = () => {
    setEditingCategory(makeCategory(menu.categories.length + 1));
  };

  const handleEditCategory = () => {
    if (!activeCategory) return;
    setEditingCategory(JSON.parse(JSON.stringify(activeCategory)));
  };

  const handleSaveCategory = () => {
    const isExisting = menu.categories.some((category) => category.id === editingCategory.id);
    const nextCategories = isExisting
      ? menu.categories.map((category) => category.id === editingCategory.id ? editingCategory : category)
      : [...menu.categories, editingCategory];

    setMenu({ ...menu, categories: nextCategories });
    setActiveCategoryId(editingCategory.id);
    setEditingCategory(null);
  };

  const moveCategory = (index, direction) => {
    const nextCategories = [...menu.categories];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextCategories.length) {
      return;
    }

    [nextCategories[index], nextCategories[targetIndex]] = [nextCategories[targetIndex], nextCategories[index]];
    setMenu({
      ...menu,
      categories: nextCategories.map((category, categoryIndex) => ({ ...category, sortOrder: categoryIndex + 1 })),
    });
  };

  const handleEditMenuMeta = () => {
    setEditingMenuMeta(JSON.parse(JSON.stringify(menu.menuMeta)));
  };

  const handleSaveMenuMeta = () => {
    setMenu({ ...menu, menuMeta: editingMenuMeta });
    setEditingMenuMeta(null);
  };

  const handleAddItemClick = () => {
    if (!activeCategory) return;
    setModalMode('add');
    setOriginalCategoryId(null);
    setTargetCategoryId(activeCategory.id);
    setEditingItem(makeItem((activeCategory.items?.length || 0) + 1));
  };

  const handleEditItemClick = (item) => {
    setModalMode('edit');
    setOriginalCategoryId(activeCategoryId);
    setTargetCategoryId(activeCategoryId);
    setEditingItem(JSON.parse(JSON.stringify(item)));
  };

  const handleSaveItem = () => {
    if (!editingItem.name.trim()) {
      window.alert('Пожалуйста, введите название блюда');
      return;
    }

    let nextCategories = [...menu.categories];
    if (modalMode === 'add') {
      nextCategories = nextCategories.map((category) => (
        category.id === targetCategoryId
          ? { ...category, items: [...(category.items || []), editingItem] }
          : category
      ));
    } else if (originalCategoryId === targetCategoryId) {
      nextCategories = nextCategories.map((category) => (
        category.id === originalCategoryId
          ? { ...category, items: category.items.map((item) => item.id === editingItem.id ? editingItem : item) }
          : category
      ));
    } else {
      nextCategories = nextCategories.map((category) => {
        if (category.id === originalCategoryId) {
          return { ...category, items: category.items.filter((item) => item.id !== editingItem.id) };
        }
        if (category.id === targetCategoryId) {
          return { ...category, items: [...(category.items || []), editingItem] };
        }
        return category;
      });
    }

    setMenu({ ...menu, categories: nextCategories });
    setEditingItem(null);
    if (targetCategoryId !== activeCategoryId) {
      setActiveCategoryId(targetCategoryId);
    }
  };

  const handleVariantChange = (index, field, value, language = menu.defaultLanguage) => {
    const nextVariants = [...(editingItem.variants || [])];
    nextVariants[index] = field === 'label'
      ? setLocalizedField(nextVariants[index], field, value, language, menu.defaultLanguage)
      : { ...nextVariants[index], [field]: value };
    setEditingItem({ ...editingItem, variants: nextVariants });
  };

  const addVariant = () => {
    const nextVariant = {
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
      variants: editingItem.variants ? [...editingItem.variants, nextVariant] : [nextVariant],
      price: '',
      measureValue: '',
      measureUnit: 'ml',
    });
  };

  const removeVariant = (index) => {
    const nextVariants = editingItem.variants.filter((_, variantIndex) => variantIndex !== index);
    setEditingItem({
      ...editingItem,
      variants: nextVariants.length
        ? nextVariants.map((variant, variantIndex) => ({ ...variant, sortOrder: variantIndex + 1 }))
        : undefined,
    });
  };

  const handleDeleteCategoryClick = () => {
    if (!activeCategory) return;
    setDeleteConfirm({ type: 'category', id: activeCategory.id, name: localizedCategoryName });
  };

  const handleDeleteItemClick = (item) => {
    setDeleteConfirm({
      type: 'item',
      id: item.id,
      name: getLocalizedField(item, 'name', editorLanguage, menu.defaultLanguage),
      categoryId: activeCategoryId,
    });
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'category') {
      const nextCategories = menu.categories.filter((category) => category.id !== deleteConfirm.id);
      setMenu({
        ...menu,
        categories: nextCategories.map((category, index) => ({ ...category, sortOrder: index + 1 })),
      });
      setActiveCategoryId(nextCategories[0]?.id || null);
    } else if (deleteConfirm.type === 'item') {
      setMenu({
        ...menu,
        categories: menu.categories.map((category) => (
          category.id === deleteConfirm.categoryId
            ? {
                ...category,
                items: category.items
                  .filter((item) => item.id !== deleteConfirm.id)
                  .map((item, index) => ({ ...item, sortOrder: index + 1 })),
              }
            : category
        )),
      });
    }

    setDeleteConfirm(null);
  };

  const applyJsonPayload = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setMenu(parsed);
      setActiveCategoryId(parsed.categories?.[0]?.id || null);
      setError('');
      setIsJsonOpen(false);
    } catch (nextError) {
      setError(`JSON невалидный: ${nextError.message}`);
    }
  };

  const saveMenu = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = isJsonOpen ? JSON.parse(jsonText) : menu;
      const updated = await updateMenu(id, { payload, status });
      setMenuRecord(updated);
      setMenu(updated.payload);
      setStatus(updated.status);
      setNotice('Меню сохранено');
      window.setTimeout(() => setNotice(''), 2500);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link to="/menus" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
            ← Все меню
          </Link>
          <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-foreground">
            {localizedMenuName || menuRecord?.name || 'Редактор меню'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {menuRecord?.venueName} · {menuRecord?.owner?.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={`${formSelectClasses} !h-10 !w-auto !rounded-xl !text-sm`}
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="published">published</option>
          </select>

          <Button variant="outline" onClick={() => setIsJsonOpen((value) => !value)} className={secondaryActionButtonClasses}>
            <Code2 size={15} />
            JSON
          </Button>

          <Button onClick={saveMenu} disabled={isSaving} className={primaryActionButtonClasses}>
            {isSaving ? <Check size={16} /> : <Save size={16} />}
            {isSaving ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</div> : null}

      {isJsonOpen ? (
        <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Payload JSON</h2>
            <Button variant="outline" onClick={applyJsonPayload}>Применить к форме</Button>
          </div>
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            className="h-[520px] w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-xs outline-none focus:border-brand-purple"
          />
        </div>
      ) : null}

      <div className="bg-card border border-border/60 rounded-3xl shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[calc(100vh-13rem)] relative w-full max-w-full min-w-0">
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
            <div className="p-3 sm:p-5 lg:p-3 border-b border-border/60 flex flex-col gap-3 bg-card z-10 sticky top-0 min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0 sm:justify-end md:ml-auto md:w-auto md:max-w-full md:rounded-xl md:border md:border-border/70 md:bg-secondary/35 md:px-2.5 md:py-2.5 mb-0 md:mb-3">
                <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:flex-row shrink-0">
                  <div className="relative w-fit min-w-0">
                    <select
                      value={editorLanguage}
                      onChange={(event) => handleEditorLanguageChange(event.target.value)}
                      className={`${formSelectClasses} !w-auto h-10 sm:h-10 text-xs sm:text-sm !pl-2.5 !pr-8`}
                    >
                      {TOP_MENU_LANGUAGES.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.flag} {language.shortLabel}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <ChevronDown size={14} />
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleEditMenuMeta} className={`${secondaryActionButtonClasses} sm:h-10 h-10 px-4 w-full sm:w-auto shrink-0 text-xs sm:text-sm`}>
                    Редактировать
                  </Button>

                  {publicPreviewUrl ? (
                    <Button variant="outline" className={`${secondaryActionButtonClasses} sm:h-10 h-10 px-4 w-full sm:w-auto shrink-0 text-xs sm:text-sm`}>
                      <a href={publicPreviewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                        <ExternalLink size={14} />
                        Превью
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto min-w-0 sm:flex-none">
                  <div className="relative flex-1 sm:w-56 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                      placeholder="Поиск блюда..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className={`${formFieldClasses} h-10 text-xs sm:text-sm !pl-[30px]`}
                    />
                  </div>

                  <Button onClick={handleAddItemClick} className={`${primaryActionButtonClasses} sm:h-10 h-10 px-3.5 shrink-0 text-xs sm:text-sm`}>
                    <Plus size={16} />
                    Блюдо
                  </Button>
                </div>
              </div>

              <div className="flex flex-col min-w-0 max-w-full">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
                  {localizedMenuName}
                </p>
                <div className="flex items-center gap-2.5 min-w-0 max-w-full">
                  <h1 className="text-xl sm:text-[22px] font-extrabold text-foreground tracking-tight truncate min-w-0">
                    {localizedCategoryName}
                  </h1>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleEditCategory}
                      className={`${subtleIconButtonClasses} w-9 h-9 hover:text-brand-purple hover:bg-brand-purple/10 hover:border-brand-purple/30 shadow-sm`}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={handleDeleteCategoryClick}
                      className={`${subtleIconButtonClasses} w-9 h-9 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 shadow-sm`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {localizedCategoryDescription ? (
                  <p className="text-xs sm:text-[13px] text-muted-foreground mt-1 max-w-2xl leading-relaxed truncate whitespace-normal line-clamp-2">
                    {localizedCategoryDescription}
                  </p>
                ) : null}

                {activeCategory.availableHours?.start && activeCategory.availableHours?.end ? (
                  <p className="text-[11px] font-semibold text-foreground/80 mt-1.5">
                    Доступно: {getAvailableHoursLabel(activeCategory.availableHours)}
                  </p>
                ) : null}
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
      </div>

      <DeleteConfirmModal deleteConfirm={deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={executeDelete} />

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

export default MenuEditorPage;
