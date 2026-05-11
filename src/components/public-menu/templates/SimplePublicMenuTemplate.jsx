import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Menu as MenuIcon } from 'lucide-react';

import {
  formatCurrency,
  formatMeasure,
  getContrastColor,
  getLanguagePillLabel,
  getLocalizedField,
  hexToRgba,
  isFilled,
} from '../../../lib/publicMenuUtils';

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
  const sectionRefs = useRef(new Map());

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

        if (visibleEntry?.target?.id) {
          setActiveCategoryId(visibleEntry.target.id.replace('public-category-', ''));
        }
      },
      {
        rootMargin: '-140px 0px -55% 0px',
        threshold: [0.1, 0.3, 0.5],
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

  const surfaceTint = useMemo(() => hexToRgba(accentColor, 0.08), [accentColor]);
  const borderTint = useMemo(() => hexToRgba(accentColor, 0.2), [accentColor]);
  const chipTint = useMemo(() => hexToRgba(accentColor, 0.12), [accentColor]);
  const heroTextColor = useMemo(() => getContrastColor(accentColor), [accentColor]);

  const visibleCategories = useMemo(
    () => (payload?.categories || []).filter((category) => !category.isHidden),
    [payload?.categories]
  );

  const localizedMenuName = getLocalizedField(payload?.menuMeta, 'name', language, defaultLanguage);
  const localizedVenueDescription = getLocalizedField(payload?.venue, 'description', language, defaultLanguage);

  const scrollToCategory = (categoryId) => {
    const element = sectionRefs.current.get(categoryId);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveCategoryId(categoryId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section
          className="overflow-hidden rounded-[2rem] border shadow-sm"
          style={{
            backgroundColor: accentColor,
            borderColor: borderTint,
            color: heroTextColor,
          }}
        >
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.6rem] border text-4xl font-black"
                style={{
                  borderColor: hexToRgba(heroTextColor, 0.22),
                  backgroundColor: hexToRgba(heroTextColor, 0.08),
                }}
              >
                {venue?.design?.logoUrl ? (
                  <img src={venue.design.logoUrl} alt={venue.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{String(venue?.name || 'M').slice(0, 1)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-1.5">
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{venue?.name || 'Menu'}</h1>
                  {isFilled(localizedMenuName) && localizedMenuName !== venue?.name ? (
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: hexToRgba(heroTextColor, 0.72) }}>
                      {localizedMenuName}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(payload?.languages || []).map((menuLanguage) => {
                    const isSelected = menuLanguage.code === language;
                    return (
                      <button
                        key={menuLanguage.code}
                        type="button"
                        onClick={() => setLanguage(menuLanguage.code)}
                        className="inline-flex h-11 min-w-[68px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all"
                        style={{
                          borderColor: isSelected ? hexToRgba(heroTextColor, 0.28) : hexToRgba(heroTextColor, 0.18),
                          backgroundColor: isSelected ? hexToRgba(heroTextColor, 0.14) : hexToRgba(heroTextColor, 0.06),
                          color: heroTextColor,
                        }}
                      >
                        <span className="text-base">{getLanguagePillLabel(menuLanguage)}</span>
                      </button>
                    );
                  })}
                </div>

                {isFilled(localizedVenueDescription) ? (
                  <p className="max-w-4xl text-base leading-8 sm:text-[1.7rem] sm:leading-[1.45] lg:text-[1.9rem]">
                    {localizedVenueDescription}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {availableMenus.length > 1 ? (
          <section className="rounded-[2rem] border border-border/60 bg-card p-2 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {availableMenus.map((menuOption) => {
                const isSelected = menuOption.id === activeMenuId;
                return (
                  <button
                    key={menuOption.id}
                    type="button"
                    onClick={() => onMenuChange(menuOption.id)}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition-all"
                    style={isSelected ? {
                      backgroundColor: accentColor,
                      borderColor: hexToRgba(accentColor, 0.45),
                      color: heroTextColor,
                    } : undefined}
                  >
                    {menuOption.name}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {visibleCategories.length ? (
          <section
            className="sticky top-3 z-20 overflow-hidden rounded-[2rem] border bg-card/95 p-2 shadow-sm backdrop-blur"
            style={{
              borderColor: borderTint,
              boxShadow: `0 16px 40px -32px ${hexToRgba(accentColor, 0.35)}`,
            }}
          >
            <div className="flex gap-2 overflow-x-auto pb-1">
              {visibleCategories.map((category) => {
                const isSelected = category.id === activeCategoryId;
                const categoryName = getLocalizedField(category, 'name', language, defaultLanguage) || category.name;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => scrollToCategory(category.id)}
                    className="shrink-0 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all sm:text-base"
                    style={isSelected ? {
                      backgroundColor: accentColor,
                      borderColor: hexToRgba(accentColor, 0.45),
                      color: heroTextColor,
                    } : {
                      backgroundColor: surfaceTint,
                      borderColor: borderTint,
                    }}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-5">
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
                className="rounded-[2rem] border border-border/60 bg-card p-5 shadow-sm sm:p-8"
              >
                <div className="mb-6 space-y-2 sm:mb-8">
                  <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{categoryName}</h2>
                  <div className="h-1 w-24 rounded-full" style={{ backgroundColor: accentColor }} />
                  {isFilled(categoryDescription) ? (
                    <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{categoryDescription}</p>
                  ) : null}
                </div>

                <div className="space-y-0">
                  {visibleItems.map((item, index) => {
                    const itemName = getLocalizedField(item, 'name', language, defaultLanguage) || item.name;
                    const itemDescription = getLocalizedField(item, 'description', language, defaultLanguage);
                    const itemMeasure = formatMeasure(item.measureValue, item.measureUnit);
                    const itemPrice = formatCurrency(item.price);
                    const visibleVariants = (item.variants || []).filter((variant) => variant.isAvailable !== false);

                    return (
                      <article
                        key={item.id}
                        className={`${index > 0 ? 'border-t border-border/50' : ''} py-5 sm:py-6`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">{itemName}</h3>
                            </div>

                            {isFilled(itemDescription) ? (
                              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{itemDescription}</p>
                            ) : null}

                            {isFilled(itemMeasure) && !visibleVariants.length ? (
                              <p className="text-sm font-medium text-muted-foreground">{itemMeasure}</p>
                            ) : null}
                          </div>

                          {isFilled(itemPrice) ? (
                            <div className="shrink-0 text-right text-xl font-black tracking-tight text-foreground sm:text-3xl">
                              {itemPrice}
                            </div>
                          ) : null}
                        </div>

                        {visibleVariants.length ? (
                          <div className="mt-4 border-l-2 pl-4" style={{ borderColor: chipTint }}>
                            <div className="space-y-2.5">
                              {visibleVariants.map((variant) => {
                                const variantLabel = getLocalizedField(variant, 'label', language, defaultLanguage) || variant.label;
                                const variantMeasure = formatMeasure(variant.measureValue, variant.measureUnit);
                                const variantMeta = variantMeasure && variantMeasure !== variantLabel
                                  ? variantMeasure
                                  : '';
                                return (
                                  <div key={variant.id} className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="text-base font-medium text-muted-foreground sm:text-[1.1rem]">{variantLabel}</div>
                                      {isFilled(variantMeta) ? (
                                        <div className="text-sm text-muted-foreground/80">{variantMeta}</div>
                                      ) : null}
                                    </div>
                                    {menu?.payload?.settings?.showVariantPrices !== false ? (
                                      <div className="shrink-0 text-right text-lg font-bold text-foreground sm:text-2xl">
                                        {formatCurrency(variant.price)}
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
            <div className="rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-sm">
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

        <footer className="rounded-[2rem] border border-border/60 bg-card px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>{venue?.city ? `${venue.city}${venue.country ? `, ${venue.country}` : ''}` : venue?.country || 'KwikMenu'}</span>
            </div>
            <div>{payload?.languages?.length || 1} язык(ов) меню</div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SimplePublicMenuTemplate;
