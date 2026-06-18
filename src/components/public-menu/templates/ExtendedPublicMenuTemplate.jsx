import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ExternalLink, Globe, Info, MapPin, Phone, Wifi, X } from 'lucide-react';

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
const SHEET_PANEL_TRANSITION = { type: 'spring', damping: 26, stiffness: 210 };
const PUBLIC_DESKTOP_BG = '#d9d9d9';

const getScheduleLabel = (availableHours) => {
  if (!availableHours?.start || !availableHours?.end) {
    return '';
  }

  return `${availableHours.start} - ${availableHours.end}`;
};

const DIETARY_TAG_LABELS = {
  ru: {
    'vegan': 'Веганское',
    'vegetarian': 'Вегетарианское',
    'gluten-free': 'Без глютена',
    'spicy': 'Острое',
    'contains-nuts': 'Содержит орехи',
    'contains-dairy': 'Содержит лактозу',
    'caffeine-free': 'Без кофеина',
    'sugar-free': 'Без сахара',
    'halal': 'Халяль',
    'lenten': 'Постное',
    'kids': 'Детское',
    'lactose-free': 'Без лактозы',
    'contains-seafood': 'Содержит морепродукты',
  },
  en: {
    'vegan': 'Vegan',
    'vegetarian': 'Vegetarian',
    'gluten-free': 'Gluten Free',
    'spicy': 'Spicy',
    'contains-nuts': 'Contains Nuts',
    'contains-dairy': 'Contains Dairy',
    'caffeine-free': 'Caffeine Free',
    'sugar-free': 'Sugar Free',
    'halal': 'Halal',
    'lenten': 'Lenten',
    'kids': 'Kids',
    'lactose-free': 'Lactose Free',
    'contains-seafood': 'Contains Seafood',
  },
};

const getDietaryTagLabel = (tagValue, language = 'en') => {
  const lang = String(language || 'en').toLowerCase().split('-')[0];
  const dict = DIETARY_TAG_LABELS[lang] || DIETARY_TAG_LABELS.ru;
  return dict[tagValue] || tagValue;
};

const getItemBadge = (item, language) => {
  const isEn = language === 'en';

  if (item?.badge) {
    const badgeVal = item.badge.toLowerCase().trim();
    if (badgeVal === 'hit') {
      return isEn ? 'HIT' : 'ХИТ';
    }
    if (badgeVal === 'new') {
      return isEn ? 'NEW' : 'НОВИНКА';
    }
    if (badgeVal === 'chefs-choice') {
      return isEn ? 'CHEF' : 'ОТ ШЕФА';
    }
    if (badgeVal === 'season') {
      return isEn ? 'SEASON' : 'СЕЗОН';
    }
    if (badgeVal === 'promo') {
      return isEn ? 'PROMO' : 'АКЦИЯ';
    }
    if (badgeVal === 'special') {
      return isEn ? 'SPECIAL' : 'ФИРМЕННОЕ';
    }
  }

  if (!item?.tags?.length) {
    return null;
  }
  for (const tag of item.tags) {
    const lower = tag.toLowerCase().trim();
    if (lower === 'хит' || lower === 'hit' || lower === 'popular' || lower === 'популярное') {
      return isEn ? 'HIT' : 'ХИТ';
    }
    if (lower === 'new' || lower === 'новинка') {
      return isEn ? 'NEW' : 'НОВИНКА';
    }
    if (lower === 'острое' || lower === 'spicy' || lower === 'hot' || lower === 'острый') {
      return isEn ? 'SPICY' : 'ОСТРОЕ';
    }
    if (lower === 'vegan' || lower === 'веган' || lower === 'постное' || lower === 'вегетарианское') {
      return isEn ? 'VEGAN' : 'ВЕГАН';
    }
    if (lower === 'шеф' || lower === 'chef' || lower === 'рекомендуем' || lower === 'recommend') {
      return isEn ? 'CHEF' : 'ОТ ШЕФА';
    }
  }
  return null;
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

const getOptionsText = (count, lang) => {
  if (lang === 'en') {
    return `${count} option${count > 1 ? 's' : ''}`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} вариант`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} варианта`;
  }
  return `${count} вариантов`;
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
  const defaultLanguage = payload?.defaultLanguage || 'en';
  const [language, setLanguage] = useState(defaultLanguage);
  const [activeCategoryId, setActiveCategoryId] = useState(payload?.categories?.[0]?.id || '');
  const [openSheet, setOpenSheet] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const copyResetTimeoutRef = useRef(null);
  const sectionRefs = useRef(new Map());
  const categoryChipRefs = useRef(new Map());
  const categoryNavRef = useRef(null);
  const categoryScrollTimeoutRef = useRef(null);
  const programmaticCategoryScrollRef = useRef(false);
  const pendingCategoryIdRef = useRef(null);

  useEffect(() => {
    setLanguage(payload?.defaultLanguage || 'en');
    setActiveCategoryId(payload?.categories?.[0]?.id || '');
    setOpenSheet(null);
    setIsDescExpanded(false);
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
    () => (payload?.categories || []).filter((category) => !category.isHidden && (category.items || []).length > 0),
    [payload?.categories]
  );
  const visibleLanguages = useMemo(
    () => getVisibleMenuLanguages(payload, defaultLanguage),
    [payload, defaultLanguage]
  );

  const currencyCode = venue?.currency || payload?.currency || 'USD';
  const venueName = getLocalizedField(payload?.venue, 'name', language, defaultLanguage) || venue?.name || payload?.venue?.name || 'Menu';
  const venueDescription = getLocalizedField(payload?.venue, 'description', language, defaultLanguage) || venue?.description || payload?.venue?.description || '';
  const venueLogoUrl = venue?.design?.logoUrl || payload?.venue?.logoUrl || null;
  const venueInstagramUrl = venue?.instagramUrl || payload?.venue?.instagramUrl || null;

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

  const hasWifi = Boolean(venue?.wifi?.enabled && venue?.wifi?.ssid && venue?.wifi?.password);

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
      }, 2000);
    } catch (e) {
      // ignore
    }
  };

  const aboutFacts = [
    isFilled(venue?.city) ? { icon: MapPin, label: language === 'en' ? 'City' : 'Город', value: [venue.city, venue.country].filter(isFilled).join(', ') } : null,
    isFilled(venue?.phone) ? { icon: Phone, label: language === 'en' ? 'Phone' : 'Телефон', value: venue.phone } : null,
    hasWifi ? { icon: Wifi, label: language === 'en' ? 'Wi-Fi Network' : 'Сеть Wi-Fi', value: venue.wifi.ssid } : null,
  ].filter(Boolean);

  const aboutActions = [
    {
      icon: Phone,
      label: language === 'en' ? 'Call' : 'Позвонить',
      href: venue?.phone ? `tel:${venue.phone.replace(/[^\d+]/g, '')}` : undefined,
    },
    {
      icon: Globe,
      label: language === 'en' ? 'Website' : 'Сайт',
      href: venueInstagramUrl || undefined,
    },
    {
      icon: passwordCopied ? Check : Wifi,
      label: passwordCopied 
        ? (language === 'en' ? 'Copied!' : 'Скопировано!') 
        : (language === 'en' ? 'WiFi Pass' : 'Пароль Wi-Fi'),
      onClick: hasWifi ? handleCopyWifiPassword : undefined,
    },
  ];

  const renderSheetContent = () => {
    if (!openSheet) {
      return null;
    }

    if (openSheet.type === 'about') {
      return (
        <div className="max-h-[78vh] overflow-y-auto px-4 pb-8 pt-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.24, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="font-serif text-[1.7rem] font-medium tracking-[0.18em] text-foreground">{venueName.toUpperCase()}</div>
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
                const isPlaceholder = !action.href && !action.onClick;

                const content = (
                  <>
                    <Icon size={16} />
                    <span>{action.label}</span>
                  </>
                );

                const baseClass = `flex min-h-16 flex-col items-center justify-center gap-1 rounded-[1rem] border px-2 py-3 text-center text-[0.74rem] font-medium transition ${
                  isPlaceholder ? 'cursor-default opacity-70' : 'hover:border-black/15 hover:bg-black/5 cursor-pointer'
                }`;
                const baseStyle = { borderColor: 'rgba(162,142,121,0.18)', backgroundColor: '#fffaf2' };

                if (isPlaceholder) {
                  return (
                    <div key={action.label} className={baseClass} style={baseStyle}>
                      {content}
                    </div>
                  );
                }

                if (action.onClick) {
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className={baseClass}
                      style={baseStyle}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className={baseClass}
                    style={baseStyle}
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          </motion.div>
        </div>
      );
    }

    const item = openSheet.item;
    const itemName = getLocalizedField(item, 'name', language, defaultLanguage) || item.name;
    const itemDescription = getLocalizedField(item, 'description', language, defaultLanguage);
    const itemMeasure = formatMeasure(item.measureValue, item.measureUnit, language);
    const itemPrice = formatCurrency(item.price, currencyCode);
    const visibleVariants = (item.variants || []).filter((variant) => variant.isAvailable !== false);
    const metaParts = [itemMeasure].filter(isFilled);
    const badge = getItemBadge(item, language);

    return (
      <div className="max-h-[76vh] overflow-y-auto px-4 pb-8 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.24, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-black/5">
            <MenuImage
              src={item.imageUrl}
              alt={itemName}
              placeholderLabel={venueName}
              eager
              className="h-full w-full"
            />
            {badge && (
              <div
                className="absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase border border-white/20"
                style={{ backgroundColor: accentColor, color: accentText }}
              >
                {badge}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">{itemName}</h2>
              {isFilled(itemPrice.amount) ? (
                <div className="whitespace-nowrap text-[1.1rem] font-bold" style={{ color: accentColor }}>
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
                  const variantMeasure = formatMeasure(variant.measureValue, variant.measureUnit, language);
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
                      <div className="whitespace-nowrap text-[0.92rem] font-semibold" style={{ color: accentColor }}>
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
                    {getDietaryTagLabel(tag, language)}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </motion.div>
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
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-[2rem] border px-4 py-4 shadow-[0_16px_42px_rgba(55,48,41,0.05)] sm:px-5 sm:py-5"
          style={{
            background: `linear-gradient(145deg, rgba(255,253,248,0.96), rgba(248,243,235,0.88)), radial-gradient(circle at 16% 0%, ${hexToRgba(accentColor, 0.08)}, transparent 36%)`,
            borderColor: heroBorder,
          }}
        >
          <div className="flex flex-col gap-4">
            {/* Top row: Logo + Name on the left (80%), Language switcher on the right */}
            <div className="flex items-center justify-between gap-4">
              {/* Logo + Name */}
              <div className="flex items-center gap-3 min-w-0 max-w-[80%]">
                {venueLogoUrl ? (
                  <img src={venueLogoUrl} alt={venueName} className="h-12 w-12 shrink-0 rounded-2xl border border-black/8 bg-white/50 object-contain shadow-sm" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white/30 font-serif text-[1.4rem] font-bold tracking-[0.05em] text-foreground shadow-sm">
                    {venueName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <h1 className="font-serif text-[1.12rem] font-semibold leading-tight tracking-[0.02em] text-foreground uppercase truncate sm:text-[1.3rem]">
                  {venueName}
                </h1>
              </div>

              {/* Language Switcher Dropdown */}
              {visibleLanguages.length > 1 && (
                <div className="relative shrink-0 select-none">
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="appearance-none rounded-full border border-black/10 bg-white/55 pl-3.5 pr-8 py-1.5 text-[0.7rem] font-bold text-[#82796f] outline-none cursor-pointer shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] transition-all hover:bg-white/70"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2382796f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '10px',
                    }}
                  >
                    {visibleLanguages.map((menuLanguage) => (
                      <option key={menuLanguage.code} value={menuLanguage.code} className="text-foreground bg-[#fffdf8]">
                        {menuLanguage.code === 'ru' ? 'РУ' : String(menuLanguage.code).toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bottom row: Description on the left, About link on the right */}
            <div className="flex items-end justify-between gap-4 pt-1">
              <div className="min-w-0 flex-1">
                {isFilled(venueDescription) ? (
                  <p className="text-[0.88rem] leading-[1.4] text-[#82796f] break-words line-clamp-3">
                    {venueDescription}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 pb-0.5">
                <button
                  type="button"
                  onClick={() => setOpenSheet({ type: 'about' })}
                  className="text-[0.82rem] font-medium text-[#82796f] border-b border-dashed border-[#82796f]/60 pb-0.5 hover:text-foreground hover:border-foreground/80 transition-colors duration-200"
                >
                  {language === 'en' ? 'About' : 'О заведении'}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

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
                    backgroundColor: accentColor,
                    borderColor: 'transparent',
                    color: accentText,
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
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="sticky top-3 z-20 overflow-hidden rounded-full border px-2 py-2 shadow-[0_12px_28px_rgba(55,48,41,0.04)]"
            style={{
              backgroundColor: 'rgba(255,253,248,0.72)',
              borderColor: heroBorder,
              backdropFilter: 'blur(18px)',
            }}
          >
            <div
              ref={categoryNavRef}
              className="flex gap-[3px] overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden"
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
                    className="relative shrink-0 rounded-full px-3.5 py-2.5 text-[0.78rem] font-medium transition-colors duration-250 select-none"
                    style={{
                      color: isSelected ? accentText : '#82796f',
                    }}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="activeCategoryBg"
                        className="absolute inset-0 rounded-full z-0 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.08)]"
                        style={{ backgroundColor: accentColor }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">{categoryName}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="space-y-8 pt-1"
        >
          {visibleCategories.map((category) => {
            const categoryName = getLocalizedField(category, 'name', language, defaultLanguage) || category.name;
            const schedule = getScheduleLabel(category.availableHours);
            const visibleItems = category.items || [];

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
                    const isItemAvailable = item.isAvailable !== false;
                    const badge = getItemBadge(item, language);
                    const availableVariants = (item?.variants || []).filter((variant) => variant.isAvailable !== false && isFilled(variant.price));
                    const hasVariants = availableVariants.length > 0;

                    return (
                      <motion.div
                        key={item.id}
                        role="button"
                        tabIndex={isItemAvailable ? 0 : -1}
                        onClick={isItemAvailable ? () => setOpenSheet({ type: 'item', item }) : undefined}
                        onKeyDown={(event) => {
                          if (isItemAvailable && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            setOpenSheet({ type: 'item', item });
                          }
                        }}
                        whileHover={isItemAvailable ? { y: -3 } : undefined}
                        whileTap={isItemAvailable ? { scale: 0.97 } : undefined}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className={`flex flex-col h-full overflow-hidden rounded-[1.35rem] border text-left shadow-[0_12px_28px_rgba(55,48,41,0.05)] transition-all ${isItemAvailable ? 'cursor-pointer hover:border-black/15 hover:shadow-[0_14px_32px_rgba(55,48,41,0.08)]' : 'opacity-60 grayscale-[15%] cursor-default'}`}
                        style={{ backgroundColor: SURFACE_BG, borderColor: 'rgba(162,142,121,0.16)' }}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0">
                          <MenuImage
                            src={item.imageUrl}
                            alt={itemName}
                            placeholderLabel={venueName}
                            eager={itemIndex < 6}
                            className="h-full w-full"
                          />
                          {isItemAvailable && badge && (
                            <div
                              className="absolute left-2.5 top-2.5 z-10 rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase border border-white/20"
                              style={{ backgroundColor: accentColor, color: accentText }}
                            >
                              {badge}
                            </div>
                          )}
                          {!isItemAvailable && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2.5px]">
                              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[#252a2d] shadow-md border border-white/10">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>
                        <div
                          className="relative z-10 -mt-[14px] flex-grow flex-1 grid min-h-[96px] grid-rows-[1fr_auto] gap-2 rounded-b-[1.35rem] px-3 pb-3.5 pt-3.5"
                          style={{
                            backgroundColor: SURFACE_BG
                          }}
                        >
                          <div className="text-[0.84rem] font-medium leading-[1.2] tracking-[-0.01em] text-foreground flex flex-col gap-1 min-w-0">
                            <div className="[display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:2] break-words">
                              {itemName}
                            </div>
                            {hasVariants && (
                              <div className="text-[0.72rem] text-muted-foreground truncate pt-0.5 font-normal">
                                {getOptionsText(availableVariants.length, language)}
                              </div>
                            )}
                          </div>
                          {isFilled(cardPrice.amount) ? (
                            <div className="text-[0.9rem] font-semibold leading-none tracking-[-0.02em]" style={{ color: accentColor }}>
                              {hasVariants && (language === 'en' ? 'from ' : 'от ')}
                              {cardPrice.amount}
                              {cardPrice.symbol ? ` ${cardPrice.symbol}` : ''}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </motion.section>

        <div className="mt-8 mb-6 flex flex-row items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground/60">
          <span>{language === 'en' ? 'Made in' : 'Сделано в'}</span>
          <a
            className="flex items-center gap-1.5 text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 transition-transform hover:scale-105"
            href="https://kwikme.nu?utm_source=menu_footer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-violet-600 text-white shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-zap h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
            </div>
            <span className="text-zinc-900 dark:text-zinc-100">KwikMenu</span>
          </a>
        </div>

          {renderSheet()}
        </div>
      </div>
    </div>
  );
};

export default ExtendedPublicMenuTemplate;
