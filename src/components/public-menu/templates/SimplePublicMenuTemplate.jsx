import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Menu as MenuIcon, Wifi } from 'lucide-react';

import {
  formatCurrency,
  formatMeasure,
  getContrastColor,
  getLanguagePillLabel,
  getLocalizedField,
  getVisibleMenuLanguages,
  hexToRgba,
  isFilled,
} from '../../../lib/publicMenuUtils';

const SURFACE_COLOR = '#fff7ea';

const SimplePublicMenuTemplate = ({
  venue,
  menu,
  accentColor,
  activeMenuId,
  onMenuChange,
  availableMenus = [],
}) => {
  const payload = menu?.payload;
  const defaultLanguage = payload?.defaultLanguage || 'ru';
  const [language, setLanguage] = useState(defaultLanguage);
  const [activeCategoryId, setActiveCategoryId] = useState(payload?.categories?.[0]?.id || '');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const sectionRefs = useRef(new Map());
  const categoryChipRefs = useRef(new Map());
  const categoryNavRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);
  const categoryScrollTimeoutRef = useRef(null);
  const programmaticCategoryScrollRef = useRef(false);
  const pendingCategoryIdRef = useRef(null);

  useEffect(() => {
    setLanguage(payload?.defaultLanguage || 'ru');
    setActiveCategoryId(payload?.categories?.[0]?.id || '');
  }, [payload?.defaultLanguage, payload?.categories, activeMenuId]);

  useEffect(() => {
    if (!payload?.categories?.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (programmaticCategoryScrollRef.current) {
          return;
        }

        if (visibleEntry?.target?.id) {
          setActiveCategoryId(visibleEntry.target.id.replace('public-category-', ''));
        }
      },
      {
        rootMargin: '-96px 0px -55% 0px',
        threshold: [0.12, 0.24, 0.4],
      }
    );

    payload.categories.forEach((category) => {
      const element = sectionRefs.current.get(category.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [payload?.categories]);

  useEffect(() => () => {
    if (copyResetTimeoutRef.current) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }
    if (categoryScrollTimeoutRef.current) {
      window.clearTimeout(categoryScrollTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const activeChip = categoryChipRefs.current.get(activeCategoryId);
    if (!activeChip) {
      return;
    }

    activeChip.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeCategoryId]);

  const pageTint = useMemo(() => hexToRgba(accentColor, 0.13), [accentColor]);
  const panelBorder = useMemo(() => hexToRgba(accentColor, 0.16), [accentColor]);
  const heroTextColor = useMemo(() => getContrastColor(accentColor), [accentColor]);
  const heroBorder = useMemo(() => hexToRgba(heroTextColor, 0.18), [heroTextColor]);
  const heroControlFill = useMemo(() => hexToRgba(heroTextColor, 0.08), [heroTextColor]);
  const heroControlSelectedFill = useMemo(() => hexToRgba(heroTextColor, 0.16), [heroTextColor]);
  const heroMutedColor = useMemo(() => hexToRgba(heroTextColor, 0.76), [heroTextColor]);
  const publicFontFamily = '"Avenir Next", "Manrope", Inter, "Helvetica Neue", Arial, sans-serif';

  const visibleCategories = useMemo(
    () => (payload?.categories || []).filter((category) => !category.isHidden),
    [payload?.categories]
  );
  const visibleLanguages = useMemo(
    () => getVisibleMenuLanguages(payload, defaultLanguage),
    [payload, defaultLanguage]
  );

  const venueDescription = venue?.description || '';
  const showWifiCard = Boolean(venue?.wifi?.enabled && venue?.wifi?.ssid && venue?.wifi?.password);
  const currencyCode = venue?.currency || payload?.currency || 'RUB';

  useEffect(() => {
    if (!visibleLanguages.length) {
      return;
    }

    const hasCurrentLanguage = visibleLanguages.some((menuLanguage) => menuLanguage.code === language);
    if (!hasCurrentLanguage) {
      setLanguage(defaultLanguage);
    }
  }, [defaultLanguage, language, visibleLanguages]);

  const scrollToCategory = (categoryId) => {
    const element = sectionRefs.current.get(categoryId);
    if (!element) {
      return;
    }

    const navRect = categoryNavRef.current?.getBoundingClientRect();
    const navHeight = navRect?.height || 0;
    const stickyTopOffset = 12;
    const extraGap = 12;
    const targetTop = window.scrollY + element.getBoundingClientRect().top - navHeight - stickyTopOffset - extraGap;

    programmaticCategoryScrollRef.current = true;
    pendingCategoryIdRef.current = categoryId;
    if (categoryScrollTimeoutRef.current) {
      window.clearTimeout(categoryScrollTimeoutRef.current);
    }

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: 'smooth',
    });
    categoryScrollTimeoutRef.current = window.setTimeout(() => {
      if (pendingCategoryIdRef.current) {
        setActiveCategoryId(pendingCategoryIdRef.current);
      }
      pendingCategoryIdRef.current = null;
      programmaticCategoryScrollRef.current = false;
    }, 520);
  };

  const handleCopyWifiPassword = async () => {
    const password = venue?.wifi?.password;
    if (!password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      setPasswordCopied(true);
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setPasswordCopied(false);
      }, 1400);
    } catch {}
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageTint, fontFamily: publicFontFamily }}>
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6">
        <section
          className="overflow-hidden rounded-[2rem] border p-4 shadow-[0_16px_38px_rgba(18,54,47,0.12)] sm:p-5"
          style={{
            backgroundColor: accentColor,
            borderColor: heroBorder,
            color: heroTextColor,
          }}
        >
          <div className="flex gap-3">
            <div
              className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border text-[2rem] font-extrabold tracking-[-0.04em] sm:h-[72px] sm:w-[72px] sm:text-[2.2rem]"
              style={{ borderColor: hexToRgba(heroTextColor, 0.72) }}
            >
              {venue?.design?.logoUrl ? (
                <img src={venue.design.logoUrl} alt={venue.name} className="h-full w-full object-contain p-2.5" />
              ) : (
                <span>{String(venue?.name || 'M').slice(0, 1)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="text-[1.5rem] font-extrabold leading-none tracking-[-0.045em] sm:text-[1.9rem]">
                {venue?.name || 'Menu'}
              </h1>

              {visibleLanguages.length > 1 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {visibleLanguages.map((menuLanguage) => {
                    const isSelected = menuLanguage.code === language;
                    return (
                      <button
                        key={menuLanguage.code}
                        type="button"
                        onClick={() => setLanguage(menuLanguage.code)}
                        className="inline-flex h-8 min-w-[3.35rem] items-center justify-center rounded-[0.5rem] border px-2.5 text-[0.76rem] font-medium transition-all"
                        style={{
                          borderColor: isSelected ? hexToRgba(heroTextColor, 0.28) : hexToRgba(heroTextColor, 0.18),
                          backgroundColor: isSelected ? heroControlSelectedFill : heroControlFill,
                          color: heroTextColor,
                        }}
                      >
                        {getLanguagePillLabel(menuLanguage)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {isFilled(venueDescription) ? (
            <p
              className="mt-3 max-w-[92%] text-[0.84rem] font-normal leading-[1.5] tracking-[-0.01em] sm:text-[0.95rem]"
              style={{ color: heroMutedColor }}
            >
              {venueDescription}
            </p>
          ) : null}
        </section>

        {availableMenus.length > 1 ? (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto">
            {availableMenus.map((menuOption) => {
              const isSelected = menuOption.id === activeMenuId;
              return (
                <button
                  key={menuOption.id}
                  type="button"
                  onClick={() => onMenuChange(menuOption.id)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-[0.82rem] font-medium transition-all"
                  style={isSelected ? {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    color: SURFACE_COLOR,
                  } : {
                    backgroundColor: SURFACE_COLOR,
                    borderColor: panelBorder,
                    color: '#121815',
                  }}
                >
                  {menuOption.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {visibleCategories.length ? (
          <section className="sticky top-3 z-20">
            <div
              ref={categoryNavRef}
              className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {visibleCategories.map((category) => {
                const isSelected = category.id === activeCategoryId;
                const categoryName = getLocalizedField(category, 'name', language, defaultLanguage) || category.name;
                return (
                  <button
                    key={category.id}
                    ref={(node) => {
                      if (node) {
                        categoryChipRefs.current.set(category.id, node);
                      } else {
                        categoryChipRefs.current.delete(category.id);
                      }
                    }}
                    type="button"
                    onClick={() => scrollToCategory(category.id)}
                    className="shrink-0 rounded-full border px-3 py-1.5 text-[0.62rem] font-medium transition-all sm:px-3.5 sm:text-[0.68rem]"
                    style={isSelected ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      boxShadow: `0 6px 14px ${hexToRgba(accentColor, 0.12)}`,
                      color: SURFACE_COLOR,
                    } : {
                      backgroundColor: SURFACE_COLOR,
                      borderColor: panelBorder,
                      color: '#121815',
                    }}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          {visibleCategories.length ? visibleCategories.map((category) => {
            const categoryName = getLocalizedField(category, 'name', language, defaultLanguage) || category.name;
            const categoryDescription = getLocalizedField(category, 'description', language, defaultLanguage);
            const visibleItems = (category.items || []).filter((item) => item.isAvailable !== false);

            return (
              <div
                key={category.id}
                id={`public-category-${category.id}`}
                ref={(node) => {
                  if (node) {
                    sectionRefs.current.set(category.id, node);
                  } else {
                    sectionRefs.current.delete(category.id);
                  }
                }}
                className="rounded-[2rem] border p-5 shadow-[0_14px_34px_rgba(18,54,47,0.09)] sm:p-6"
                style={{
                  backgroundColor: SURFACE_COLOR,
                  borderColor: panelBorder,
                }}
              >
                <div className="mb-4 space-y-1.5 sm:mb-5">
                  <h2 className="text-[0.82rem] font-bold tracking-[-0.02em] text-foreground sm:text-[0.92rem]">{categoryName}</h2>
                  <div className="h-[2px] w-[54px] rounded-full" style={{ backgroundColor: accentColor }} />
                  {isFilled(categoryDescription) ? (
                    <p className="max-w-3xl text-[0.92rem] leading-7 text-muted-foreground">{categoryDescription}</p>
                  ) : null}
                </div>

                <div className="space-y-0">
                  {visibleItems.map((item, index) => {
                    const itemName = getLocalizedField(item, 'name', language, defaultLanguage) || item.name;
                    const itemDescription = getLocalizedField(item, 'description', language, defaultLanguage);
                    const itemMeasure = formatMeasure(item.measureValue, item.measureUnit);
                    const itemPrice = formatCurrency(item.price, currencyCode);
                    const visibleVariants = (item.variants || []).filter((variant) => variant.isAvailable !== false);

                    return (
                      <article
                        key={item.id}
                        className={`${index > 0 ? 'border-t' : ''} py-5`}
                        style={{ borderColor: 'rgba(18, 54, 47, 0.1)' }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <h3 className="text-[1.02rem] font-medium tracking-[-0.01em] text-foreground sm:text-[1.12rem]">{itemName}</h3>

                            {isFilled(itemDescription) ? (
                              <p className="max-w-3xl text-[0.88rem] leading-[1.45] text-muted-foreground">{itemDescription}</p>
                            ) : null}

                            {isFilled(itemMeasure) && !visibleVariants.length ? (
                              <p className="text-[0.83rem] leading-[1.4] text-muted-foreground">{itemMeasure}</p>
                            ) : null}
                          </div>

                          {isFilled(itemPrice.amount) ? (
                            <div className="shrink-0 text-right text-[1.02rem] font-bold tracking-[-0.01em] text-foreground sm:text-[1.12rem]">
                              {itemPrice.amount}{itemPrice.symbol ? ` ${itemPrice.symbol}` : ''}
                            </div>
                          ) : null}
                        </div>

                        {visibleVariants.length ? (
                          <div className="mt-2.5 border-l-2 pl-3" style={{ borderColor: 'rgba(18, 54, 47, 0.14)' }}>
                            <div className="space-y-1.5">
                              {visibleVariants.map((variant) => {
                                const variantLabel = getLocalizedField(variant, 'label', language, defaultLanguage) || variant.label;
                                const variantMeasure = formatMeasure(variant.measureValue, variant.measureUnit);
                                const variantMeta = variantMeasure && variantMeasure !== variantLabel ? variantMeasure : '';

                                return (
                                  <div key={variant.id} className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="text-[0.83rem] font-medium leading-[1.4] text-muted-foreground">{variantLabel}</div>
                                      {isFilled(variantMeta) ? (
                                        <div className="text-[0.8rem] text-muted-foreground/80">{variantMeta}</div>
                                      ) : null}
                                    </div>
                                    {menu?.payload?.settings?.showVariantPrices !== false ? (
                                      <div className="shrink-0 text-right text-[1.02rem] font-medium text-foreground">
                                        {(() => {
                                          const variantPrice = formatCurrency(variant.price, currencyCode);
                                          return `${variantPrice.amount}${variantPrice.symbol ? ` ${variantPrice.symbol}` : ''}`;
                                        })()}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div
              className="rounded-[2rem] border p-8 text-center shadow-sm"
              style={{ backgroundColor: SURFACE_COLOR, borderColor: panelBorder }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
                <MenuIcon size={24} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">Меню пока пустое</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Для этого заведения еще не опубликованы активные разделы.
              </p>
            </div>
          )}
        </section>

        {showWifiCard ? (
          <section
            className="rounded-[2rem] border p-5 shadow-[0_14px_34px_rgba(18,54,47,0.09)] sm:p-6"
            style={{
              backgroundColor: SURFACE_COLOR,
              borderColor: panelBorder,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: hexToRgba(accentColor, 0.12), color: accentColor }}
                  >
                    <Wifi size={16} />
                  </div>
                  <h2 className="text-[1rem] font-bold tracking-[-0.02em] text-foreground sm:text-[1.08rem]">
                    Гостевой Wi‑Fi
                  </h2>
                </div>
                <p className="mt-2 text-[0.84rem] leading-[1.45] text-muted-foreground">
                  Подключение доступно прямо из цифрового меню.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'rgba(18, 54, 47, 0.1)' }}>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[0.8rem] uppercase tracking-[0.12em] text-muted-foreground">Сеть</span>
                <span className="text-right text-[0.96rem] font-medium text-foreground">{venue.wifi.ssid}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[0.8rem] uppercase tracking-[0.12em] text-muted-foreground">Пароль</span>
                <button
                  type="button"
                  onClick={handleCopyWifiPassword}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-right transition-all hover:bg-black/3"
                  style={{ borderColor: 'rgba(18, 54, 47, 0.12)' }}
                >
                  <span className="font-mono text-[0.92rem] font-medium tracking-[0.16em] text-foreground">
                    {venue.wifi.password}
                  </span>
                  <span className="text-muted-foreground">
                    {passwordCopied ? <Check size={14} /> : <Copy size={14} />}
                  </span>
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default SimplePublicMenuTemplate;
