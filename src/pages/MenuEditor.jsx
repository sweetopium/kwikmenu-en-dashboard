import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Edit2, ExternalLink, Globe, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import CategoryModal from "../components/menu-editor/CategoryModal";
import CategorySidebar from "../components/menu-editor/CategorySidebar";
import DeleteConfirmModal from "../components/menu-editor/DeleteConfirmModal";
import ItemModal from "../components/menu-editor/ItemModal";
import MenuMetaModal from "../components/menu-editor/MenuMetaModal";
import MenuItemList from "../components/menu-editor/MenuItemList";
import TranslationModal from "../components/menu-editor/TranslationModal";
import { simpleMenuPayload } from "../data/menu_mock.js";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { loadImportedMenuFromStorage, saveImportedMenuToStorage } from "../lib/importedMenuStorage";
import { normalizeMenu } from "../lib/menuNormalization";
import { getMenu, updateMenu, publishMenu, unpublishMenu, translateMenu, updateMenuDefaultLanguage } from "../lib/menusApi";
import { Switch } from "../components/ui/switch";
import { TOP_MENU_LANGUAGES } from "../lib/languageMeta";
import { getVisibleMenuLanguages } from "../lib/publicMenuUtils";
import { trackProductEvent } from "../lib/productAnalytics";
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
  const { t } = useTranslation();
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
  const [editorLanguage, setEditorLanguage] = useState(menu.defaultLanguage || 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMenuMeta, setEditingMenuMeta] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [originalCategoryId, setOriginalCategoryId] = useState(null);
  const [targetCategoryId, setTargetCategoryId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isLoadingRemoteMenu, setIsLoadingRemoteMenu] = useState(false);
  const [remoteMenuError, setRemoteMenuError] = useState('');
  const [remoteVenueId, setRemoteVenueId] = useState(null);
  const hasLoadedRemoteMenuRef = useRef(false);
  const [menuStatus, setMenuStatus] = useState('draft');

  const currentLanguageMeta = useMemo(() => {
    return TOP_MENU_LANGUAGES.find((lang) => lang.code === editorLanguage);
  }, [editorLanguage]);


  const activeCategory = menu.categories.find((category) => category.id === activeCategoryId);
  const filteredItems = searchQuery
    ? menu.categories.flatMap((category) => {
        const categoryName = getLocalizedField(category, 'name', editorLanguage, menu.defaultLanguage);
        return (category.items || []).map((item) => ({
          ...item,
          categoryId: category.id,
          categoryName: categoryName,
        }));
      }).filter((item) =>
        getLocalizedField(item, 'name', editorLanguage, menu.defaultLanguage).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory?.items?.map((item) => ({
        ...item,
        categoryId: activeCategoryId,
      })) || [];
  const localizedMenuName = getLocalizedField(menu.menuMeta, 'name', editorLanguage, menu.defaultLanguage);
  const localizedCategoryName = getLocalizedField(activeCategory, 'name', editorLanguage, menu.defaultLanguage);
  const localizedCategoryDescription = getLocalizedField(activeCategory, 'description', editorLanguage, menu.defaultLanguage);
  const publicPreviewUrl = isRemoteMenu && remoteVenueId ? `/m/${remoteVenueId}?menu=${id}` : null;

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
          setRemoteVenueId(response.venueId || null);
          trackProductEvent('menu_editor_viewed', {
            venueId: response.venueId,
            menuId: response.id,
            properties: {
              status: response.status,
              categories_count: nextMenu.categories?.length || 0,
            },
          });
          setMenu(nextMenu);
          setMenuStatus(response.status || 'draft');
          setActiveCategoryId(nextMenu.categories[0]?.id || null);
          setEditorLanguage(nextMenu.defaultLanguage || 'en');
          setSearchQuery('');
        })
        .catch((error) => {
          if (cancelled) return;
          setRemoteMenuError(error?.message || t('menuEditor.errors.loadFailed', 'Could not load menu'));
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
    setRemoteVenueId(null);
    trackProductEvent('menu_editor_viewed', {
      menuId: isImportedMenu ? null : id,
      properties: { mode: isImportedMenu ? 'imported_local' : 'mock' },
    });
    setMenu(nextMenu);
    setMenuStatus('active');
    setActiveCategoryId(nextMenu.categories[0]?.id || null);
    setEditorLanguage(nextMenu.defaultLanguage || 'en');
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
    return <div className="rounded-3xl border border-border/60 bg-card p-8 text-sm text-muted-foreground shadow-sm">{t('common.loading', 'Loading...')}</div>;
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
    setEditingPromo(JSON.parse(JSON.stringify(menu.settings?.promo || {
      enabled: false,
      eyebrow: '',
      title: '',
      description: '',
      imageUrl: null,
      targetCategoryId: null,
      translations: {},
    })));
  };

  const handleSaveMenuMeta = () => {
    setMenu({ ...menu, menuMeta: editingMenuMeta, settings: { ...menu.settings, promo: editingPromo } });
    setEditingMenuMeta(null);
    setEditingPromo(null);
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
    const itemCategoryId = item.categoryId || activeCategoryId;
    setOriginalCategoryId(itemCategoryId);
    setTargetCategoryId(itemCategoryId);
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
    const itemCategoryId = item.categoryId || activeCategoryId;
    setDeleteConfirm({
      type: 'item',
      id: item.id,
      name: getLocalizedField(item, 'name', editorLanguage, menu.defaultLanguage),
      categoryId: itemCategoryId,
    });
  };

  const handleSaveItem = () => {
    const defaultLang = menu.defaultLanguage || 'en';
    const localizedName = getLocalizedField(editingItem, 'name', defaultLang, defaultLang) || 
                          getLocalizedField(editingItem, 'name', editorLanguage, defaultLang);
    if (!localizedName || !localizedName.trim()) {
      alert(t('menuEditor.errors.itemNameRequired', 'Please enter an item name'));
      return;
    }

    // Deep copy and clean up extra/empty properties to comply with Pydantic schemas (extra="forbid" and numeric type coersions)
    const cleanedItem = JSON.parse(JSON.stringify(editingItem));
    
    // Remove UI-only helper keys that filteredItems injects
    delete cleanedItem.categoryId;
    delete cleanedItem.categoryName;

    // Normalize empty strings to null or parsed values to meet backend validation expectations
    if (cleanedItem.price === '') {
      cleanedItem.price = null;
    }
    
    if (cleanedItem.measureValue === '') {
      cleanedItem.measureValue = null;
    } else if (cleanedItem.measureValue !== null && cleanedItem.measureValue !== undefined) {
      cleanedItem.measureValue = Number(cleanedItem.measureValue);
    }

    if (
      cleanedItem.availableHours &&
      (!cleanedItem.availableHours.start?.trim() && !cleanedItem.availableHours.end?.trim())
    ) {
      cleanedItem.availableHours = null;
    }

    // Clean up variants if any
    if (Array.isArray(cleanedItem.variants)) {
      cleanedItem.variants = cleanedItem.variants.map((variant) => {
        const cleanedVariant = { ...variant };
        delete cleanedVariant.categoryId;
        delete cleanedVariant.categoryName;
        
        if (cleanedVariant.price === '') {
          cleanedVariant.price = null;
        }
        
        if (cleanedVariant.measureValue === '') {
          cleanedVariant.measureValue = null;
        } else if (cleanedVariant.measureValue !== null && cleanedVariant.measureValue !== undefined) {
          cleanedVariant.measureValue = Number(cleanedVariant.measureValue);
        }
        
        return cleanedVariant;
      });
    }

    let newCategories = [...menu.categories];

    if (modalMode === 'add') {
      newCategories = newCategories.map((category) => {
        if (category.id === targetCategoryId) {
          return { ...category, items: [...(category.items || []), cleanedItem] };
        }
        return category;
      });
    } else if (originalCategoryId === targetCategoryId) {
      newCategories = newCategories.map((category) => {
        if (category.id === originalCategoryId) {
          return {
            ...category,
            items: category.items.map((item) => item.id === cleanedItem.id ? cleanedItem : item),
          };
        }
        return category;
      });
    } else {
      newCategories = newCategories.map((category) => {
        if (category.id === originalCategoryId) {
          return {
            ...category,
            items: category.items.filter((item) => item.id !== cleanedItem.id),
          };
        }

        if (category.id === targetCategoryId) {
          return {
            ...category,
            items: [...(category.items || []), cleanedItem],
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

  const handleToggleItemAvailability = (itemId, isAvailable) => {
    const newCategories = menu.categories.map((category) => {
      const hasItem = (category.items || []).some((item) => item.id === itemId);
      if (hasItem) {
        return {
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? { ...item, isAvailable } : item
          ),
        };
      }
      return category;
    });
    setMenu({ ...menu, categories: newCategories });
  };

  const handleToggleMenuStatus = async () => {
    if (!isRemoteMenu) return;
    const nextStatus = menuStatus === 'active' ? 'draft' : 'active';
    const prevStatus = menuStatus;
    setMenuStatus(nextStatus);
    try {
      if (nextStatus === 'active') {
        await publishMenu(id);
        trackProductEvent('menu_published_from_editor', {
          venueId: remoteVenueId,
          menuId: id,
        });
      } else {
        await unpublishMenu(id);
        trackProductEvent('menu_unpublished_from_editor', {
          venueId: remoteVenueId,
          menuId: id,
        });
      }
    } catch (error) {
      alert(t('menuEditor.errors.toggleStatusFailed', 'Could not change menu status. Please try again.'));
      setMenuStatus(prevStatus);
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
    const isFirstVariant = !(editingItem.variants && editingItem.variants.length > 0);

    const newVariant = {
      id: `var-${Date.now()}`,
      label: '',
      translations: {},
      price: isFirstVariant && editingItem.price ? editingItem.price : '',
      measureValue: isFirstVariant && editingItem.measureValue ? editingItem.measureValue : '',
      measureUnit: isFirstVariant && editingItem.measureUnit ? editingItem.measureUnit : 'ml',
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

  const handleEditorLanguageChange = (languageCode) => {
    const selectedLanguage = TOP_MENU_LANGUAGES.find((language) => language.code === languageCode);

    setEditorLanguage(languageCode);
    trackProductEvent('menu_editor_language_changed', {
      venueId: remoteVenueId,
      menuId: isRemoteMenu ? id : null,
      properties: { language: languageCode },
    });
    if (!selectedLanguage || menu.languages.some((language) => language.code === languageCode)) {
      return;
    }

    setMenu({
      ...menu,
      languages: [...menu.languages, selectedLanguage],
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
    trackProductEvent('menu_normalize_clicked', {
      venueId: remoteVenueId,
      menuId: isRemoteMenu ? id : null,
    });

    try {
      const response = await normalizeMenu(menu);
      setMenu(response.menu);
    } catch (error) {
      alert(error?.message || t('menuEditor.errors.normalizeFailed', 'Could not normalize menu'));
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleTranslateMenu = async (targetLang) => {
    if (!isRemoteMenu) {
      throw new Error(t('menuEditor.errors.remoteOnly', 'Auto-translation is available only for menus saved on the server.'));
    }

    trackProductEvent('menu_translate_clicked', {
      venueId: remoteVenueId,
      menuId: id,
      properties: { targetLang },
    });

    try {
      const response = await translateMenu(id, targetLang);
      setMenu(response.payload);
      return response.payload;
    } catch (error) {
      throw new Error(error?.message || t('menuEditor.errors.translateFailed', 'Could not translate menu'));
    }
  };

  const handleSetDefaultLanguage = async (defaultLanguage) => {
    const selectedLanguage = TOP_MENU_LANGUAGES.find((language) => language.code === defaultLanguage);
    if (!selectedLanguage) {
      throw new Error(t('menuEditor.errors.invalidLanguage', 'Unsupported language.'));
    }

    if (isRemoteMenu) {
      const response = await updateMenuDefaultLanguage(id, defaultLanguage);
      setMenu(response.payload);
      setEditorLanguage(defaultLanguage);
      return response.payload;
    }

    const nextLanguages = menu.languages.some((language) => language.code === defaultLanguage)
      ? menu.languages
      : [...menu.languages, selectedLanguage];
    const nextMenu = {
      ...menu,
      defaultLanguage,
      languages: nextLanguages,
    };
    setMenu(nextMenu);
    setEditorLanguage(defaultLanguage);
    return nextMenu;
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
          <div className="p-3 sm:p-5 lg:p-3 border-b border-border/60 flex flex-col gap-3 bg-card z-20 sticky top-0 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full min-w-0 sm:justify-end md:ml-auto md:w-auto md:max-w-full md:rounded-xl md:border md:border-border/70 md:bg-secondary/35 md:px-2.5 md:py-2.5 mb-0 md:mb-3">
              <div className="flex flex-row items-center gap-2 w-full sm:w-auto shrink-0 justify-start">
                <Button
                  variant="outline"
                  onClick={() => setIsTranslationModalOpen(true)}
                  className="sm:h-10 h-10 flex-1 sm:flex-none w-auto px-3 bg-background hover:bg-secondary border-border/60 text-foreground font-semibold text-xs sm:text-sm shrink-0 flex items-center justify-center gap-1.5"
                  title={t('menuEditor.btnTranslations', 'Translations')}
                >
                  <Globe size={14} className="text-muted-foreground" />
                  <span>{t('menuEditor.btnTranslations', 'Translations')}</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEditMenuMeta}
                  className={`${secondaryActionButtonClasses} sm:h-10 h-10 flex-1 sm:flex-none sm:w-10 shrink-0 flex items-center justify-center`}
                  title={t('menuEditor.btnEdit', 'Edit')}
                >
                  <Edit2 size={14} />
                </Button>

                {publicPreviewUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className={`${secondaryActionButtonClasses} sm:h-10 h-10 flex-1 sm:flex-none w-auto px-3 shrink-0 text-xs sm:text-sm`}
                    title={t('menuEditor.btnPreview', 'Preview')}
                  >
                    <a
                      href={publicPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackProductEvent('menu_editor_preview_clicked', {
                        venueId: remoteVenueId,
                        menuId: id,
                      })}
                      className="flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      <span>{t('menuEditor.btnPreview', 'Preview')}</span>
                    </a>
                  </Button>
                )}

                {isRemoteMenu && (
                  <div className="flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-border/60 bg-secondary/10 sm:h-10 h-10 flex-1 sm:flex-none sm:w-auto shrink-0 select-none">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {menuStatus === 'active' 
                        ? t('menuEditor.statusActiveText', 'On') 
                        : t('menuEditor.statusDraftText', 'Off')}
                    </span>
                    <Switch
                      checked={menuStatus === 'active'}
                      onCheckedChange={handleToggleMenuStatus}
                      className="scale-90 data-[state=checked]:bg-green-500"
                    />
                  </div>
                )}

                {isImportedMenu && (
                  <Button
                    variant="outline"
                    onClick={handleNormalizeMenu}
                    disabled={isNormalizing}
                    className={`${secondaryActionButtonClasses} sm:h-10 h-10 flex-1 sm:flex-none sm:w-auto px-3 shrink-0 text-xs sm:text-sm`}
                    title={isNormalizing ? t('menuEditor.btnNormalizing', 'Normalizing...') : t('menuEditor.btnNormalize', 'Normalize')}
                  >
                    <Sparkles size={14} className={isNormalizing ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">
                      {isNormalizing ? t('menuEditor.btnNormalizing', 'Normalizing...') : t('menuEditor.btnNormalize', 'Normalize')}
                    </span>
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto min-w-0 sm:flex-none">
                <div className="relative flex-1 sm:w-56 min-w-0">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={14}
                  />

                  <Input
                    placeholder={t('menuEditor.searchPlaceholder', 'Search item...')}
                    value={searchQuery}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (!searchQuery && nextValue) {
                        trackProductEvent('menu_editor_search_used', {
                          venueId: remoteVenueId,
                          menuId: isRemoteMenu ? id : null,
                        });
                      }
                      setSearchQuery(nextValue);
                    }}
                    className={`${formFieldClasses} h-10 text-xs sm:text-sm !pl-[30px]`}
                  />
                </div>

                <Button
                  onClick={() => {
                    trackProductEvent('item_create_clicked', {
                      venueId: remoteVenueId,
                      menuId: isRemoteMenu ? id : null,
                      properties: { category_id: activeCategoryId },
                    });
                    handleAddItemClick();
                  }}
                  className={`${primaryActionButtonClasses} sm:h-10 h-10 px-3.5 shrink-0 text-xs sm:text-sm`}
                >
                  <Plus size={16} className="mr-2" />
                  {t('menuEditor.btnAddItem', 'Item')}
                </Button>
              </div>
            </div>

            <div className="flex flex-col min-w-0 max-w-full">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
                {localizedMenuName}
              </p>
              <div className="flex items-center gap-2.5 min-w-0 max-w-full flex-wrap sm:flex-nowrap">
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

                {editorLanguage !== (menu.defaultLanguage || 'en') && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200/60 text-violet-700 text-xs font-bold shrink-0 shadow-sm animate-in fade-in duration-200 select-none">
                    <span>{currentLanguageMeta?.flag} {currentLanguageMeta?.nativeName}</span>
                    <button
                      type="button"
                      onClick={() => setEditorLanguage(menu.defaultLanguage || 'en')}
                      className="hover:bg-violet-100 p-0.5 rounded transition-colors text-violet-500 hover:text-violet-700 cursor-pointer"
                      title={t('menuEditor.translationModal.btnSwitchDefault', 'Edit original')}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              {localizedCategoryDescription && (
                <p className="text-xs sm:text-[13px] text-muted-foreground mt-1 max-w-2xl leading-relaxed truncate whitespace-normal line-clamp-2">
                  {localizedCategoryDescription}
                </p>
              )}

              {activeCategory.availableHours?.start && activeCategory.availableHours?.end && (
                <p className="text-[11px] font-semibold text-foreground/80 mt-1.5">
                  {t('menuEditor.availableHours', 'Available')}: {getAvailableHoursLabel(activeCategory.availableHours)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 border-b border-border/60 bg-card">
            <h1 className="text-xl font-bold text-muted-foreground">{t('menuEditor.selectCategoryPlaceholder', 'Select a category')}</h1>
          </div>
        )}

        <MenuItemList
          items={filteredItems}
          language={editorLanguage}
          defaultLanguage={menu.defaultLanguage}
          onEditItem={handleEditItemClick}
          onDeleteItem={handleDeleteItemClick}
          onToggleItemAvailability={handleToggleItemAvailability}
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
        promo={editingPromo}
        categories={menu.categories}
        language={editorLanguage}
        defaultLanguage={menu.defaultLanguage}
        onChange={setEditingMenuMeta}
        onPromoChange={setEditingPromo}
        onCancel={() => { setEditingMenuMeta(null); setEditingPromo(null); }}
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

      {isTranslationModalOpen && (
        <TranslationModal
          menu={menu}
          editorLanguage={editorLanguage}
          onClose={() => setIsTranslationModalOpen(false)}
          onSwitchLanguage={setEditorLanguage}
          onTranslate={handleTranslateMenu}
          onSetDefaultLanguage={handleSetDefaultLanguage}
        />
      )}
    </div>
  );
};

export default MenuEditor;
