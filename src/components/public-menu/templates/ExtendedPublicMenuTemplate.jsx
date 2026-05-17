import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Globe, Info, MapPin, Phone, Wifi, X } from 'lucide-react';

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

const PAGE_BG = '#f5efe6';
const HERO_BG = '#faf7f2';
const SURFACE_BG = '#fffdfa';
const FALLBACK_IMAGE_BG = '#efe7dc';
const DEFAULT_PLACEHOLDER_LABEL = 'MENU';
const DEFAULT_EMPTY_ITEM_IMAGE_URL = 'https://storage.yandexcloud.net/kwikmenu-ru/empty_item.webp';
const SHEET_BACKDROP_TRANSITION = { duration: 0.2, ease: 'easeOut' };
const SHEET_PANEL_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };
const PUBLIC_DESKTOP_BG = '#d9d9d9';

const getScheduleLabel = (availableHours) => {
  if (!availableHours?.start || !availableHours?.end) {
    return '';
  }

  return `${availableHours.start} - ${availableHours.end}`;
};

const getCardPrice = (item, currencyCode) => {
  const availableVariants = (item?.variants || []).filter((variant) => variant.isAvailable !== false && isFilled(variant.price));

  if (availableVariants.length) {
    const normalized = availableVariants
      .map((variant) => {
        const formatted = formatCurrency(variant.price, currencyCode);
        const numericValue = Number.parseFloat(String(formatted.amount).replace(',', '.').replace(/[^\d.-]/g, ''));

        return {
          amount: formatted.amount,
          numericValue,
          symbol: formatted.symbol,
        };
      })
      .filter((variant) => isFilled(variant.amount));

    const minVariant = normalized
      .filter((variant) => Number.isFinite(variant.numericValue))
      .sort((left, right) => left.numericValue - right.numericValue)[0];

    return minVariant || normalized[0] || { amount: '', symbol: '' };
  }

  return formatCurrency(item?.price, currencyCode);
};

const PlaceholderImage = ({ label }) => (
  <div
    className="flex h-full w-full items-center justify-center"
    style={{
      background: 'linear-gradient(135deg, #f4ede4, #e6dbcd)',
      color: '#7e6d59',
    }}
  >
    <span className="font-serif text-[0.78rem] tracking-[0.22em] opacity-80">
      {String(label || DEFAULT_PLACEHOLDER_LABEL).slice(0, 8).toUpperCase()}
    </span>
  </div>
);

const MenuImage = ({ src, alt, placeholderLabel, eager = false, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = isFilled(src) ? src : DEFAULT_EMPTY_ITEM_IMAGE_URL;

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  if (hasError) {
    return (
      <div className={className} style={{ backgroundColor: FALLBACK_IMAGE_BG }}>
        <PlaceholderImage label={placeholderLabel} />
      </div>
    );
  }

  return (
    <div className={className} style={{ backgroundColor: FALLBACK_IMAGE_BG }}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

const ExtendedPublicMenuTemplate = ({
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
  const [openSheet, setOpenSheet] = useState(null);
  const sectionRefs = useRef(new Map());
  const categoryChipRefs = useRef(new Map());
  const categoryNavRef = useRef(null);
  const categoryScrollTimeoutRef = useRef(null);
  const programmaticCategoryScrollRef = useRef(false);
  const pendingCategoryIdRef = useRef(null);

  useEffect(() => {
    setLanguage(payload?.defaultLanguage || 'ru');
    setActiveCategoryId(payload?.categories?.[0]?.id || '');
    setOpenSheet(null);
  }, [payload?.defaultLanguage, payload?.categories, activeMenuId]);

  useEffect(() => {
    if (!payload?.categories?.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticCategoryScrollRef.current) {
          return;
        }

        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveCategoryId(visibleEntry.target.id.replace('public-category-', ''));
        }
      },
      {
        rootMargin: '-88px 0px -56% 0px',
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

  useEffect(() => {
    if (!openSheet) {
      document.body.style.overflow = '';
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenSheet(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openSheet]);

  const heroBorder = useMemo(() => hexToRgba(accentColor, 0.18), [accentColor]);
  const accentSoft = useMemo(() => hexToRgba(accentColor, 0.08), [accentColor]);
  const accentStrong = useMemo(() => hexToRgba(accentColor, 0.14), [accentColor]);
  const accentText = useMemo(() => getContrastColor(accentColor), [accentColor]);
  const publicFontFamily = '"Avenir Next", "Manrope", Inter, "Helvetica Neue", Arial, sans-serif';

  const visibleCategories = useMemo(
    () => (payload?.categories || []).filter((category) => !category.isHidden && (category.items || []).some((item) => item.isAvailable !== false)),
    [payload?.categories]
  );
  const visibleLanguages = useMemo(
    () => getVisibleMenuLanguages(payload, defaultLanguage),
    [payload, defaultLanguage]
  );

  const currencyCode = venue?.currency || payload?.currency || 'RUB';
  const venueName = venue?.name || payload?.venue?.name || 'Menu';
  const venueDescription = venue?.description || payload?.venue?.description || '';
  const venueLogoUrl = venue?.design?.logoUrl || payload?.venue?.logoUrl || null;

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
    const stickyTopOffset = 8;
    const extraGap = 10;
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
    }, 540);
  };

  const aboutFacts = [
    isFilled(venue?.city) ? { icon: MapPin, label: language === 'en' ? 'City' : 'Город', value: [venue.city, venue.country].filter(isFilled).join(', ') } : null,
    isFilled(venue?.phone) ? { icon: Phone, label: language === 'en' ? 'Phone' : 'Телефон', value: venue.phone } : null,
    venue?.wifi?.enabled && isFilled(venue?.wifi?.ssid) ? { icon: Wifi, label: 'Wi-Fi', value: venue.wifi.ssid } : null,
  ].filter(Boolean);

  const aboutActions = [
    venue?.phone
      ? { icon: Phone, label: language === 'en' ? 'Call' : 'Позвонить', href: `tel:${venue.phone}` }
      : { icon: Phone, label: language === 'en' ? 'Call' : 'Позвонить', href: '#' },
    { icon: Globe, label: 'Instagram', href: '#' },
    { icon: MapPin, label: language === 'en' ? 'Route' : 'Маршрут', href: '#' },
  ];

  const renderSheetContent = () => {
    if (!openSheet) {
      return null;
    }

    if (openSheet.type === 'about') {
      return (
        <div className="max-h-[78vh] overflow-y-auto px-4 pb-8 pt-5">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="font-serif text-[1.7rem] font-medium tracking-[0.18em] text-foreground">{venueName.toUpperCase()}</div>
                <div className="text-[0.58rem] font-medium uppercase tracking-[0.34em] text-muted-foreground">Bistro</div>
              </div>
              {isFilled(venueDescription) ? (
                <p className="text-[0.95rem] leading-[1.55] text-foreground/88">{venueDescription}</p>
              ) : (
                <p className="text-[0.95rem] leading-[1.55] text-foreground/88">
                  {language === 'en'
                    ? 'A calm public profile of the venue will appear here.'
                    : 'Здесь будет более подробное описание заведения для гостя.'}
                </p>
              )}
            </div>

            {aboutFacts.length ? (
              <div className="space-y-2 border-t border-black/8 pt-4">
                {aboutFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={`${fact.label}-${fact.value}`} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-black/5 p-2 text-foreground/70">
                        <Icon size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[0.76rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">{fact.label}</div>
                        <div className="text-[0.92rem] text-foreground">{fact.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2 border-t border-black/8 pt-4">
              {aboutActions.map((action) => {
                const Icon = action.icon;
                const isPlaceholder = action.href === '#';

                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target={isPlaceholder ? undefined : '_blank'}
                    rel={isPlaceholder ? undefined : 'noreferrer'}
                    onClick={(event) => {
                      if (isPlaceholder) {
                        event.preventDefault();
                      }
                    }}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1rem] border px-2 py-3 text-center text-[0.74rem] font-medium transition ${
                      isPlaceholder ? 'cursor-default opacity-70' : 'hover:border-black/15 hover:bg-black/5'
                    }`}
                    style={{ borderColor: 'rgba(162,142,121,0.18)', backgroundColor: '#fffaf2' }}
                  >
                    <Icon size={16} />
                    <span>{action.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const item = openSheet.item;
    const itemName = getLocalizedField(item, 'name', language, defaultLanguage) || item.name;
    const itemDescription = getLocalizedField(item, 'description', language, defaultLanguage);
    const itemMeasure = formatMeasure(item.measureValue, item.measureUnit);
    const itemPrice = formatCurrency(item.price, currencyCode);
    const visibleVariants = (item.variants || []).filter((variant) => variant.isAvailable !== false);
    const metaParts = [itemMeasure, getScheduleLabel(item.availableHours)].filter(isFilled);

    return (
      <div className="max-h-[76vh] overflow-y-auto px-4 pb-8 pt-4">
        <div className="space-y-4">
          <MenuImage
            src={item.imageUrl}
            alt={itemName}
            placeholderLabel={venueName}
            eager
            className="aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-black/5"
          />

          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">{itemName}</h2>
              {isFilled(itemPrice.amount) ? (
                <div className="whitespace-nowrap text-[1rem] font-semibold text-foreground">
                  {itemPrice.amount}{itemPrice.symbol ? ` ${itemPrice.symbol}` : ''}
                </div>
              ) : null}
            </div>

            {metaParts.length ? (
              <div className="flex flex-wrap gap-0 text-[0.84rem] text-muted-foreground">
                {metaParts.map((part, index) => (
                  <span key={`${part}-${index}`}>
                    {index > 0 ? <span className="px-2 text-muted-foreground/60">·</span> : null}
                    {part}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {isFilled(itemDescription) ? (
            <section className="space-y-2 border-t border-black/8 pt-4">
              <h3 className="text-[0.84rem] font-semibold text-foreground">{language === 'en' ? 'Description' : 'Описание'}</h3>
              <p className="text-[0.95rem] leading-[1.55] text-foreground/88">{itemDescription}</p>
            </section>
          ) : null}

          {visibleVariants.length ? (
            <section className="space-y-2 border-t border-black/8 pt-4">
              <h3 className="text-[0.84rem] font-semibold text-foreground">{language === 'en' ? 'Options' : 'Опции'}</h3>
              <div className="space-y-0">
                {visibleVariants.map((variant, index) => {
                  const variantLabel = getLocalizedField(variant, 'label', language, defaultLanguage) || variant.label;
                  const variantMeasure = formatMeasure(variant.measureValue, variant.measureUnit);
                  const variantPrice = formatCurrency(variant.price, currencyCode);

                  return (
                    <div
                      key={variant.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 ${index > 0 ? 'border-t' : ''}`}
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      <div className="space-y-1">
                        <div className="text-[0.94rem] text-foreground">{variantLabel}</div>
                        {isFilled(variantMeasure) ? (
                          <div className="text-[0.8rem] text-muted-foreground">{variantMeasure}</div>
                        ) : null}
                      </div>
                      <div className="whitespace-nowrap text-[0.92rem] font-medium text-foreground">
                        {variantPrice.amount}{variantPrice.symbol ? ` ${variantPrice.symbol}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {item.tags?.length ? (
            <section className="space-y-2 border-t border-black/8 pt-4">
              <h3 className="text-[0.84rem] font-semibold text-foreground">{language === 'en' ? 'Tags' : 'Теги'}</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border px-3 py-1.5 text-[0.76rem] text-muted-foreground"
                    style={{ borderColor: 'rgba(162,142,121,0.18)', backgroundColor: '#fffaf2' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  };

  const renderSheet = () => (
    <AnimatePresence>
      {openSheet ? (
        <div className="fixed inset-0 z-[120]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setOpenSheet(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SHEET_BACKDROP_TRANSITION}
          />
          <div className="pointer-events-none absolute inset-0 flex justify-center">
            <div className="relative h-full w-full max-w-[430px]">
              <motion.div
                className="pointer-events-auto absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[2rem] border border-black/5 bg-[#fffdf8] shadow-[0_-24px_72px_rgba(36,31,27,0.18)]"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={SHEET_PANEL_TRANSITION}
              >
                <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center border-b border-black/5 bg-[#fffdf8]/90 px-4 py-3 backdrop-blur-xl">
                  <div />
                  <div className="h-1 w-12 rounded-full bg-black/15" />
                  <button type="button" onClick={() => setOpenSheet(null)} className="justify-self-end rounded-full p-2 text-foreground/70 transition hover:bg-black/5 hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                {renderSheetContent()}
              </motion.div>
            </div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: PUBLIC_DESKTOP_BG, fontFamily: publicFontFamily }}>
      <div className="mx-auto w-full max-w-[430px]">
        <div className="flex min-h-screen w-full flex-col gap-4 px-4 py-4 sm:px-4 sm:py-4" style={{ backgroundColor: PAGE_BG }}>
        <section
          className="rounded-[2rem] border px-4 py-4 shadow-[0_16px_42px_rgba(55,48,41,0.05)] sm:px-5 sm:py-5"
          style={{
            background: `linear-gradient(145deg, rgba(255,253,248,0.96), rgba(248,243,235,0.88)), radial-gradient(circle at 16% 0%, ${hexToRgba(accentColor, 0.08)}, transparent 36%)`,
            borderColor: heroBorder,
          }}
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            {venueLogoUrl ? (
              <img src={venueLogoUrl} alt={venueName} className="h-auto max-h-16 w-auto shrink-0 object-contain sm:max-h-[72px]" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1rem] border border-black/8 bg-white/30 font-serif text-[2rem] font-medium leading-none tracking-[0.2em] text-foreground sm:h-[72px] sm:w-[72px] sm:text-[2.2rem]">
                {venueName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 space-y-2 self-start sm:pr-2">
              <div className="font-serif text-[1.8rem] font-medium leading-[0.96] tracking-[0.01em] text-foreground sm:text-[2.2rem]">{venueName}</div>
              {isFilled(venueDescription) ? (
                <p className="max-w-[23rem] text-[0.94rem] leading-[1.42] text-muted-foreground">{venueDescription}</p>
              ) : null}
            </div>

            <div className="col-span-2 flex items-start justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end">
              {visibleLanguages.length > 1 ? (
                <div className="flex rounded-full border border-black/10 bg-white/55 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]">
                  {visibleLanguages.map((menuLanguage) => {
                    const isSelected = menuLanguage.code === language;
                    return (
                      <button
                        key={menuLanguage.code}
                        type="button"
                        onClick={() => setLanguage(menuLanguage.code)}
                        className="rounded-full px-3 py-1.5 text-[0.68rem] font-medium transition"
                        style={{
                          backgroundColor: isSelected ? accentSoft : 'transparent',
                          color: isSelected ? '#252a2d' : '#82796f',
                        }}
                      >
                        {getLanguagePillLabel(menuLanguage)}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setOpenSheet({ type: 'about' })}
                className="inline-flex h-9 items-center gap-1 rounded-full border px-3 text-[0.76rem] font-medium text-muted-foreground transition hover:border-black/15 hover:bg-black/5 hover:text-foreground"
                style={{ borderColor: 'rgba(95,81,67,0.18)', backgroundColor: 'rgba(255,255,255,0.42)' }}
              >
                <Info size={14} />
                <span>{language === 'en' ? 'About' : 'О заведении'}</span>
              </button>
            </div>
          </div>
        </section>

        {availableMenus.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {availableMenus.map((menuOption) => {
              const isSelected = menuOption.id === activeMenuId;
              return (
                <button
                  key={menuOption.id}
                  type="button"
                  onClick={() => onMenuChange(menuOption.id)}
                  className="shrink-0 rounded-full border px-4 py-2 text-[0.82rem] font-medium transition"
                  style={isSelected ? {
                    backgroundColor: accentSoft,
                    borderColor: accentStrong,
                    color: '#252a2d',
                  } : {
                    backgroundColor: 'rgba(255,253,248,0.72)',
                    borderColor: 'rgba(162,142,121,0.16)',
                    color: '#82796f',
                  }}
                >
                  {menuOption.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {visibleCategories.length ? (
          <section
            className="sticky top-3 z-20 overflow-hidden rounded-full border px-2 py-2 shadow-[0_12px_28px_rgba(55,48,41,0.04)]"
            style={{
              backgroundColor: 'rgba(255,253,248,0.72)',
              borderColor: heroBorder,
              backdropFilter: 'blur(18px)',
            }}
          >
            <div
              ref={categoryNavRef}
              className="flex gap-[3px] overflow-x-auto [&::-webkit-scrollbar]:hidden"
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
                    className="shrink-0 rounded-full border px-3 py-2.5 text-[0.78rem] font-medium transition"
                    style={isSelected ? {
                      backgroundColor: accentSoft,
                      borderColor: 'transparent',
                      color: '#252a2d',
                    } : {
                      backgroundColor: 'transparent',
                      borderColor: 'transparent',
                      color: '#82796f',
                    }}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-8 pt-1">
          {visibleCategories.map((category) => {
            const categoryName = getLocalizedField(category, 'name', language, defaultLanguage) || category.name;
            const schedule = getScheduleLabel(category.availableHours);
            const visibleItems = (category.items || []).filter((item) => item.isAvailable !== false);

            return (
              <section
                key={category.id}
                id={`public-category-${category.id}`}
                ref={(node) => {
                  if (node) {
                    sectionRefs.current.set(category.id, node);
                  } else {
                    sectionRefs.current.delete(category.id);
                  }
                }}
                className="space-y-3.5"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-[1.05rem] font-semibold tracking-[-0.035em] text-foreground">{categoryName}</h2>
                  {isFilled(schedule) ? (
                    <div className="text-[0.84rem] font-normal text-muted-foreground">{schedule}</div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {visibleItems.map((item, itemIndex) => {
                    const itemName = getLocalizedField(item, 'name', language, defaultLanguage) || item.name;
                    const cardPrice = getCardPrice(item, currencyCode);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOpenSheet({ type: 'item', item })}
                        className="overflow-hidden rounded-[1.35rem] border text-left shadow-[0_12px_28px_rgba(55,48,41,0.05)] transition hover:border-black/15 hover:shadow-[0_14px_32px_rgba(55,48,41,0.08)]"
                        style={{ backgroundColor: SURFACE_BG, borderColor: 'rgba(162,142,121,0.16)' }}
                      >
                        <MenuImage
                          src={payload?.settings?.showItemImages === false ? null : item.imageUrl}
                          alt={itemName}
                          placeholderLabel={venueName}
                          eager={itemIndex < 6}
                          className="aspect-[4/3] overflow-hidden"
                        />
                        <div
                          className="relative z-10 -mt-[14px] grid min-h-[96px] grid-rows-[1fr_auto] gap-2 rounded-b-[1.35rem] px-3 pb-3.5 pt-3.5"
                          style={{
                            backgroundColor: SURFACE_BG
                          }}
                        >
                          <div className="text-[0.84rem] font-medium leading-[1.2] tracking-[-0.01em] text-foreground [display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                            {itemName}
                          </div>
                          {isFilled(cardPrice.amount) ? (
                            <div className="text-[0.9rem] font-medium leading-none tracking-[-0.02em] text-foreground">
                              {cardPrice.amount}{cardPrice.symbol ? ` ${cardPrice.symbol}` : ''}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </section>

          {renderSheet()}
        </div>
      </div>
    </div>
  );
};

export default ExtendedPublicMenuTemplate;
