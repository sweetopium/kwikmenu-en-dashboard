const IMPORTED_MENU_STORAGE_KEY = 'kwikmenu-imported-menu';

export const saveImportedMenuToStorage = (menu) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(IMPORTED_MENU_STORAGE_KEY, JSON.stringify(menu));
};

export const loadImportedMenuFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(IMPORTED_MENU_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    window.localStorage.removeItem(IMPORTED_MENU_STORAGE_KEY);
    return null;
  }
};

export const clearImportedMenuFromStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(IMPORTED_MENU_STORAGE_KEY);
};
