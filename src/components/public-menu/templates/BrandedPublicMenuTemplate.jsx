import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  Info,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  Wifi,
  X,
} from 'lucide-react';

import {
  formatCurrency,
  formatMeasure,
  getContrastColor,
  getLocalizedField,
  getVisibleMenuLanguages,
  hexToRgba,
  isFilled,
} from '../../../lib/publicMenuUtils';

const FEATURED_BADGES = new Set(['chefs-choice', 'season', 'hit', 'new', 'special', 'promo']);
const COPY = {
  en: { 
    menu: 'Menu', 
    featured: 'Recommended', 
    search: 'Search the menu', 
    noResults: 'Nothing found', 
    about: 'About', 
    contacts: 'Contacts', 
    wifi: 'Guest Wi-Fi', 
    copied: 'Copied', 
    share: 'Share', 
    from: 'from', 
    close: 'Close', 
    powered: 'Powered by KwikMenu',
    cartTitle: 'My Order',
    cartEmpty: 'Your order is empty',
    waiterMessage: 'Show this list to the waiter to place your order',
    addToOrder: 'Add to Order',
    clearOrder: 'Clear Order'
  },
  ru: { 
    menu: 'Меню', 
    featured: 'Рекомендуем', 
    search: 'Поиск по меню', 
    noResults: 'Ничего не найдено', 
    about: 'О ресторане', 
    contacts: 'Контакты', 
    wifi: 'Wi-Fi для гостей', 
    copied: 'Скопировано', 
    share: 'Поделиться', 
    from: 'от', 
    close: 'Закрыть', 
    powered: 'Работает на KwikMenu',
    cartTitle: 'Мой Заказ',
    cartEmpty: 'В заказе пока ничего нет',
    waiterMessage: 'Покажите этот список официанту, чтобы сделать заказ',
    addToOrder: 'Добавить в заказ',
    clearOrder: 'Очистить заказ'
  },
};

const labelFor = (language, key) => COPY[String(language || 'en').split('-')[0]]?.[key] || COPY.en[key];

const getItemPrice = (item, currency) => {
  const variants = (item?.variants || []).filter((variant) => variant.isAvailable !== false && isFilled(variant.price));
  if (variants.length) {
    const sorted = [...variants].sort((a, b) => {
      const aVal = Number.parseFloat(String(a.price).replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
      const bVal = Number.parseFloat(String(b.price).replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
      return aVal - bVal;
    });
    return formatCurrency(sorted[0].price, currency);
  }
  return formatCurrency(item?.price, currency);
};

const Price = ({ item, currency, language, compact = false, color }) => {
  const variants = (item?.variants || []).filter((variant) => variant.isAvailable !== false && isFilled(variant.price));
  const price = getItemPrice(item, currency);
  if (!price.amount) return null;
  return (
    <span
      className={`${compact ? 'text-[13px] font-bold' : 'text-[16px] font-extrabold'} whitespace-nowrap`}
      style={{ color: color || '#17231d' }}
    >
      {variants.length ? `${labelFor(language, 'from')} ` : ''}{price.amount} {price.symbol}
    </span>
  );
};

const SafeImage = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`${className} bg-stone-100`} aria-hidden="true" />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
};

const InstagramIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Sheet = ({ open, onClose, children, labelledBy }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 backdrop-blur-[6px] px-0" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[30px] bg-[#fffdf9] shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out" onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </section>
    </div>
  );
};

const BrandedPublicMenuTemplate = ({ venue, menu, accentColor = '#25392f', activeMenuId, onMenuChange, availableMenus = [] }) => {
  const payload = menu?.payload || {};
  const config = venue?.design?.branded || {};
  const defaultLanguage = payload.defaultLanguage || 'en';
  const [language, setLanguage] = useState(defaultLanguage);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Virtual Cart State loaded from/saved to localStorage with 24h expiration
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(`kwikmenu-cart:${venue?.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.items || [];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        `kwikmenu-cart:${venue?.id}`,
        JSON.stringify({ timestamp: Date.now(), items: cart })
      );
    } catch (e) {
      console.error(e);
    }
  }, [cart, venue?.id]);

  const sectionRefs = useRef(new Map());
  const navRef = useRef(null);
  const languageRef = useRef(null);
  const menuPickerRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);

  const currency = payload.currency || venue?.currency || 'USD';
  const secondary = config.secondaryColor || '#d49a5b';
  const ink = '#17231d';
  const onAccent = getContrastColor(accentColor);
  const languages = getVisibleMenuLanguages(payload, defaultLanguage);
  const categories = useMemo(() => (payload.categories || []).filter((category) => !category.isHidden), [payload.categories]);
  const allItems = useMemo(() => categories.flatMap((category) => (category.items || []).filter((item) => item.isAvailable !== false).map((item) => ({ item, category }))), [categories]);
  const featured = useMemo(() => allItems.filter(({ item }) => FEATURED_BADGES.has(item.badge) && item.imageUrl).slice(0, 6), [allItems]);
  const promo = payload.settings?.promo || {};
  const promoEyebrow = getLocalizedField(promo, 'eyebrow', language, defaultLanguage);
  const promoTitle = getLocalizedField(promo, 'title', language, defaultLanguage);
  const promoDescription = getLocalizedField(promo, 'description', language, defaultLanguage);
  const heroImage = config.coverImageUrl || payload.venue?.coverImageUrl;
  const venueName = getLocalizedField(payload.venue, 'name', language, defaultLanguage) || venue?.name || '';
  const venueDescription = getLocalizedField(payload.venue, 'description', language, defaultLanguage) || venue?.description || '';
  const logoUrl = venue?.design?.logoUrl || payload.venue?.logoUrl;

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(language);
    if (!needle) return allItems;
    return allItems.filter(({ item, category }) => [
      getLocalizedField(item, 'name', language, defaultLanguage),
      getLocalizedField(item, 'description', language, defaultLanguage),
      getLocalizedField(category, 'name', language, defaultLanguage),
      ...(item.tags || []),
    ].join(' ').toLocaleLowerCase(language).includes(needle));
  }, [allItems, defaultLanguage, language, query]);

  // Selected Item Variant & Quantity
  const availableVariants = useMemo(() => {
    return (selectedItem?.variants || []).filter((v) => v.isAvailable !== false);
  }, [selectedItem]);

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (availableVariants.length) {
      setSelectedVariantId(availableVariants[0].id);
    } else {
      setSelectedVariantId(null);
    }
    setQuantity(1);
  }, [selectedItem, availableVariants]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setLanguage(defaultLanguage);
      setActiveCategoryId(categories[0]?.id || '');
      setSelectedItem(null);
      setSearchOpen(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [activeMenuId, categories, defaultLanguage]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.dataset?.categoryId) setActiveCategoryId(visible.target.dataset.categoryId);
    }, { rootMargin: '-124px 0px -55% 0px', threshold: [0.05, 0.2] });
    sectionRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector(`[data-chip-id="${activeCategoryId}"]`);
    if (!nav || !chip) return;

    const centeredLeft = chip.offsetLeft - ((nav.clientWidth - chip.offsetWidth) / 2);
    const maxLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
    nav.scrollTo({
      left: Math.min(Math.max(0, centeredLeft), maxLeft),
      behavior: 'smooth',
    });
  }, [activeCategoryId]);

  // Click outside listener for custom dropdowns
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (languageOpen && languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
      if (menuPickerOpen && menuPickerRef.current && !menuPickerRef.current.contains(event.target)) {
        setMenuPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [languageOpen, menuPickerOpen]);

  // Lock background scroll when overlays are active
  useEffect(() => {
    if (selectedItem || searchOpen || aboutOpen || cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem, searchOpen, aboutOpen, cartOpen]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const scrollToCategory = (categoryId) => {
    setActiveCategoryId(categoryId);
    sectionRefs.current.get(categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddToCart = (item, variantId, qty) => {
    setCart((current) => {
      const existingIndex = current.findIndex(
        (c) => c.item.id === item.id && c.variantId === variantId
      );
      if (existingIndex > -1) {
        const updated = [...current];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [...current, { item, variantId, quantity: qty }];
    });
    setSelectedItem(null);
  };

  const handleUpdateQty = (itemId, variantId, change) => {
    setCart((current) => {
      return current.map((c) => {
        if (c.item.id === itemId && c.variantId === variantId) {
          const nextQty = c.quantity + change;
          return { ...c, quantity: nextQty };
        }
        return c;
      }).filter((c) => c.quantity > 0);
    });
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchOpen(false);
  };

  const cartTotal = useMemo(() => {
    const totalVal = cart.reduce((sum, c) => {
      const priceVal = c.variantId
        ? c.item.variants.find((v) => v.id === c.variantId)?.price
        : c.item.price;
      return sum + (Number(priceVal || 0) * c.quantity);
    }, 0);
    return formatCurrency(totalVal, currency);
  }, [cart, currency]);

  const cartCount = useMemo(() => cart.reduce((sum, c) => sum + c.quantity, 0), [cart]);

  const handleCopyWifiPassword = async () => {
    const password = venue?.wifi?.password;
    if (!password) return;
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

  const renderCard = ({ item }, compact = false) => {
    const name = getLocalizedField(item, 'name', language, defaultLanguage);
    const description = getLocalizedField(item, 'description', language, defaultLanguage);
    const measure = formatMeasure(item.measureValue, item.measureUnit, language);
    if (compact) {
      return (
        <button key={item.id} onClick={() => handleSelectItem(item)} className="grid w-full grid-cols-[1fr_auto] gap-4 border-b border-black/[0.08] py-4 text-left last:border-0 transition-all duration-200 active:opacity-60">
          <span>
            <span className="block text-[15px] font-bold leading-tight" style={{ color: ink }}>{name}</span>
            {description ? <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-black/55">{description}</span> : null}
            {measure ? <span className="mt-1 block text-[11px] text-black/40">{measure}</span> : null}
          </span>
          <Price item={item} currency={currency} language={language} compact color={accentColor} />
        </button>
      );
    }
    return (
      <button key={item.id} onClick={() => handleSelectItem(item)} className="w-full h-full flex flex-col overflow-hidden rounded-[20px] bg-white text-left shadow-sm transition-all duration-300 active:scale-[0.97] hover:-translate-y-0.5">
        <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0 bg-stone-100">
          <SafeImage src={item.imageUrl} alt={name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
          {item.badge ? <span className="absolute left-2.5 top-2.5 rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: ink }}>{item.badge.replace('-', ' ')}</span> : null}
        </div>
        <span className="flex-1 flex flex-col justify-between p-3.5">
          <span className="block text-[13px] font-bold leading-tight line-clamp-2" style={{ color: ink }}>{name}</span>
          <span className="mt-2 flex items-end justify-between gap-2 text-black/70 shrink-0"><Price item={item} currency={currency} language={language} compact color={accentColor} />{measure ? <span className="text-[10px] text-black/35">{measure}</span> : null}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#d8d8d6]" style={{ color: ink }}>
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#f6f1e9] shadow-[0_0_50px_rgba(0,0,0,0.14)]">
        <header className="relative min-h-[320px] overflow-hidden px-5 pb-8 pt-5 text-white" style={{ backgroundColor: accentColor }}>
          {heroImage ? <><SafeImage src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/72" /></> : <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 78% 18%, ${secondary} 0, transparent 34%), linear-gradient(145deg, ${accentColor}, #111914)` }} />}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/35 bg-white/95 text-xl font-black shadow-lg" style={{ color: accentColor }}>
              {logoUrl ? <SafeImage src={logoUrl} alt={venueName} className="h-full w-full object-cover" /> : venueName.slice(0, 1).toUpperCase()}
            </div>
            <div ref={languageRef} className="relative flex gap-2">
              {languages.length > 1 ? <button aria-label="Language" onClick={() => setLanguageOpen((value) => !value)} className="flex h-10 items-center gap-1.5 rounded-full border border-white/25 bg-black/20 px-3 text-xs font-bold backdrop-blur transition-all duration-200 active:scale-95"><Globe2 size={15} />{language.toUpperCase()}</button> : null}
              {config.showAbout !== false ? <button aria-label={labelFor(language, 'about')} onClick={() => setAboutOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 backdrop-blur transition-all duration-200 active:scale-95"><Info size={17} /></button> : null}
              {languageOpen ? <div className="absolute right-0 top-12 w-40 overflow-hidden rounded-2xl bg-white p-1 text-sm text-black shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">{languages.map((entry) => <button key={entry.code} onClick={() => { setLanguage(entry.code); setLanguageOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-black/5"><span>{entry.nativeName}</span>{entry.code === language ? <Check size={14} /> : null}</button>)}</div> : null}
            </div>
          </div>
          <div className="relative z-[1] mt-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">{labelFor(language, 'menu')}</p>
            <h1 className="mt-2 font-serif text-[36px] font-semibold leading-[1.02] tracking-[-0.02em]">{venueName}</h1>
            {venueDescription ? (
              <button
                onClick={() => setAboutOpen(true)}
                className="mt-3 max-w-[330px] text-left text-sm leading-relaxed text-white/75 hover:text-white transition-colors active:opacity-80 block"
              >
                <span className="line-clamp-3">
                  {venueDescription}
                </span>
              </button>
            ) : null}
          </div>
        </header>

        {availableMenus.length > 1 ? (
          <div className="mx-4 -mt-[22px] p-1 bg-[#eae4d8] rounded-full flex flex-nowrap overflow-x-auto [scrollbar-width:none] border border-black/[0.04] shadow-sm relative z-20">
            {availableMenus.map((entry) => {
              const isActive = entry.id === activeMenuId;
              return (
                <button
                  key={entry.id}
                  onClick={() => onMenuChange?.(entry.id)}
                  className="flex-1 shrink-0 py-2.5 px-5 text-center text-xs font-extrabold rounded-full transition-all duration-300 active:scale-95 truncate"
                  style={isActive ? {
                    backgroundColor: '#fff',
                    color: ink,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
                  } : {
                    color: 'rgba(0,0,0,0.5)'
                  }}
                >
                  {entry.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {config.showPromo !== false && promo.enabled && promoTitle ? <button onClick={() => promo.targetCategoryId && scrollToCategory(promo.targetCategoryId)} className="relative mx-4 mt-5 flex min-h-[145px] w-[calc(100%-2rem)] overflow-hidden rounded-[24px] p-5 text-left text-white shadow-sm transition-all duration-300 active:scale-[0.99] hover:brightness-[1.03]" style={{ backgroundColor: accentColor }}><div className="relative z-10 max-w-[62%]"><span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/65">{promoEyebrow || 'Special'}</span><span className="mt-2 block font-serif text-[25px] font-bold leading-[1.02]">{promoTitle}</span>{promoDescription ? <span className="mt-2 line-clamp-2 block text-xs leading-relaxed text-white/70">{promoDescription}</span> : null}<span className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">Explore <ArrowRight size={13} /></span></div>{promo.imageUrl ? <><SafeImage src={promo.imageUrl} alt="" className="absolute inset-y-0 right-0 h-full w-[48%] object-cover" /><div className="absolute inset-y-0 right-[35%] w-[20%] bg-gradient-to-r from-[var(--promo)] to-transparent" style={{ '--promo': accentColor }} /></> : <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-50" style={{ backgroundColor: secondary }} />}</button> : null}

        <div className="sticky top-0 z-30 mt-5 border-y border-black/[0.06] bg-[#f6f1e9]/95 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-4">
            <div ref={navRef} className="flex flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">{categories.map((category) => <button key={category.id} data-chip-id={category.id} onClick={() => scrollToCategory(category.id)} className="shrink-0 rounded-full px-4 py-2 text-[11px] font-extrabold transition-all duration-300 active:scale-95" style={activeCategoryId === category.id ? { backgroundColor: accentColor, color: onAccent } : { backgroundColor: '#fff', color: ink }}>{getLocalizedField(category, 'name', language, defaultLanguage)}</button>)}</div>
            {config.showSearch !== false ? <button aria-label={labelFor(language, 'search')} onClick={() => setSearchOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 active:scale-90"><Search size={16} /></button> : null}
          </div>
        </div>

        {config.showFeatured !== false && featured.length ? (
          <section className="pt-7">
            <div className="mb-4 flex items-end justify-between px-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: secondary }}>{venueName}</p>
                <h2 className="mt-1 font-serif text-[27px] font-bold">{labelFor(language, 'featured')}</h2>
              </div>
            </div>
            <div className="overflow-x-auto [scrollbar-width:none] pb-3">
              <div className="flex snap-x gap-3 px-4">
                {featured.map((entry) => (
                  <div key={entry.item.id} className="w-[164px] shrink-0 snap-start flex flex-col">
                    {renderCard(entry)}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="px-4 pb-14 pt-4">{categories.map((category) => {
          const items = (category.items || []).filter((item) => item.isAvailable !== false);
          if (!items.length) return null;

          const renderOrderedCategoryItems = () => {
            const elements = [];
            let textGroup = [];

            const flushTextGroup = (key) => {
              if (textGroup.length > 0) {
                elements.push(
                  <div key={`text-group-${key}`} className="col-span-2 mt-2 rounded-[20px] bg-white px-4 shadow-sm">
                    {textGroup.map((item) => renderCard({ item }, true))}
                  </div>
                );
                textGroup = [];
              }
            };

            items.forEach((item, index) => {
              if (item.imageUrl) {
                flushTextGroup(index);
                elements.push(
                  <div key={item.id} className="col-span-1">
                    {renderCard({ item })}
                  </div>
                );
              } else {
                textGroup.push(item);
              }
            });
            flushTextGroup(items.length);
            return elements;
          };

          return (
            <section
              key={category.id}
              data-category-id={category.id}
              ref={(node) => sectionRefs.current.set(category.id, node)}
              className="scroll-mt-[72px] border-t border-black/[0.08] py-8 first:border-0"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: secondary }}>
                {payload.menuMeta?.name}
              </p>
              <h2 className="mt-1 font-serif text-[30px] font-bold leading-tight">
                {getLocalizedField(category, 'name', language, defaultLanguage)}
              </h2>
              {getLocalizedField(category, 'description', language, defaultLanguage) ? (
                <p className="mt-2 text-sm leading-relaxed text-black/50">
                  {getLocalizedField(category, 'description', language, defaultLanguage)}
                </p>
              ) : null}
              <div className="mt-5 grid grid-cols-2 gap-3 items-stretch">
                {renderOrderedCategoryItems()}
              </div>
            </section>
          );
        })}</div>

        <footer className="border-t border-black/[0.05] bg-transparent px-5 py-8 text-center flex flex-col items-center justify-center">
          <button
            onClick={() => setAboutOpen(true)}
            className="font-serif text-[18px] font-extrabold tracking-tight transition-colors hover:text-black/60"
            style={{ color: ink }}
          >
            {venueName}
          </button>
          {config.showKwikMenuBranding !== false ? (
            <div className="mt-6 flex flex-row items-center justify-center gap-1.5 text-[11px] text-black/35 font-medium">
              <span>Made in</span>
              <a
                className="flex items-center gap-1.5 font-bold tracking-tight transition-all duration-200 hover:scale-105"
                href="https://kwikme.nu?utm_source=menu_footer"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
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
                    className="lucide lucide-zap h-3 w-3"
                    aria-hidden="true"
                  >
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1-.78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                  </svg>
                </div>
                <span className="text-zinc-900 font-extrabold">KwikMenu</span>
              </a>
            </div>
          ) : null}
        </footer>

        {/* Floating Cart Button */}
        <div className="pointer-events-none sticky bottom-3 z-40 flex justify-end px-3 h-0">
          {cartCount > 0 ? (
            <button
              onClick={() => setCartOpen(true)}
              className="pointer-events-auto flex h-14 items-center gap-2.5 rounded-full px-5 text-white shadow-xl transition-all duration-300 active:scale-95 hover:brightness-110 hover:shadow-2xl animate-in fade-in zoom-in duration-200 -translate-y-full"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingCart size={18} />
              <span className="text-sm font-extrabold">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </button>
          ) : null}
        </div>
      </main>

      {/* Item Details modal with Variant picker & Quantity Selector & Add to Order action */}
      <Sheet open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} labelledBy="branded-item-title">{selectedItem ? <><div className="relative w-full aspect-[5/4] overflow-hidden bg-stone-100"><SafeImage src={selectedItem.imageUrl} alt="" className="h-full w-full object-cover" /><button aria-label={labelFor(language, 'close')} onClick={() => setSelectedItem(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow transition-all duration-200 active:scale-90"><X size={19} /></button></div><div className="p-6 pb-9">
              <div className="flex flex-col gap-2">
                <h2 id="branded-item-title" className="font-serif text-[30px] font-bold leading-tight" style={{ color: ink }}>
                  {getLocalizedField(selectedItem, 'name', language, defaultLanguage)}
                </h2>
                <div className="flex items-center gap-2.5">
                  <Price item={selectedItem} currency={currency} language={language} color={accentColor} />
                  {formatMeasure(selectedItem.measureValue, selectedItem.measureUnit, language) ? (
                    <span className="h-3.5 w-[1px] bg-black/10 shrink-0" />
                  ) : null}
                  {formatMeasure(selectedItem.measureValue, selectedItem.measureUnit, language) ? (
                    <p className="text-xs text-black/40 font-medium">
                      {formatMeasure(selectedItem.measureValue, selectedItem.measureUnit, language)}
                    </p>
                  ) : null}
                </div>
              </div>{getLocalizedField(selectedItem, 'description', language, defaultLanguage) ? <p className="mt-4 text-sm leading-relaxed text-black/55">{getLocalizedField(selectedItem, 'description', language, defaultLanguage)}</p> : null}{(selectedItem.variants || []).filter((variant) => variant.isAvailable !== false).length ? <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.08]">{selectedItem.variants.filter((variant) => variant.isAvailable !== false).map((variant) => { const price = formatCurrency(variant.price, currency); const isSelected = selectedVariantId === variant.id; const showPrice = menu?.payload?.settings?.showVariantPrices !== false; return <button key={variant.id} onClick={() => setSelectedVariantId(variant.id)} className="flex w-full items-center justify-between border-b border-black/[0.06] px-4 py-3 last:border-0 text-left transition-colors hover:bg-black/[0.02]" style={isSelected ? { backgroundColor: hexToRgba(accentColor, 0.08) } : undefined}><span className="text-sm font-semibold flex items-center gap-2"><div className="h-4 w-4 rounded-full border flex items-center justify-center" style={{ borderColor: accentColor }}>{isSelected && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />}</div><span>{getLocalizedField(variant, 'label', language, defaultLanguage)} <span className="text-xs font-normal text-black/35">{formatMeasure(variant.measureValue, variant.measureUnit, language)}</span></span></span>{showPrice && <span className="text-sm font-bold">{price.amount} {price.symbol}</span>}</button>; })}</div> : null}{selectedItem.tags?.length ? <div className="mt-5 flex flex-wrap gap-2">{selectedItem.tags.map((tag) => <span key={tag} className="rounded-full px-3 py-1.5 text-[10px] font-bold capitalize" style={{ backgroundColor: hexToRgba(accentColor, 0.09), color: accentColor }}>{tag.replace('-', ' ')}</span>)}</div> : null}<div className="mt-7 flex items-center gap-3"><div className="flex h-12 items-center gap-3 rounded-2xl border border-black/[0.08] px-3 bg-black/[0.02]"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="text-lg font-bold px-2 transition-all duration-200 active:scale-75">-</button><span className="w-6 text-center font-bold text-sm">{quantity}</span><button onClick={() => setQuantity((q) => q + 1)} className="text-lg font-bold px-2 transition-all duration-200 active:scale-75">+</button></div><button onClick={() => handleAddToCart(selectedItem, selectedVariantId, quantity)} className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] hover:brightness-110 shadow-md hover:shadow-lg" style={{ backgroundColor: accentColor, color: onAccent }}>{labelFor(language, 'addToOrder')}</button></div></div></> : null}</Sheet>

      {/* Cart Drawer Panel */}
      <Sheet open={cartOpen} onClose={() => setCartOpen(false)} labelledBy="branded-cart-title">
        <div className="flex items-center justify-between p-6 pb-3 border-b border-black/[0.06]">
          <div>
            <h2 id="branded-cart-title" className="font-serif text-2xl font-bold">{labelFor(language, 'cartTitle')}</h2>
          </div>
          <button onClick={() => setCartOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] transition-all duration-200 active:scale-90"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60dvh]">
          {cart.length > 0 ? (
            <div className="divide-y divide-black/[0.06]">
              {cart.map((cartItem, index) => {
                const { item, variantId, quantity: itemQty } = cartItem;
                const name = getLocalizedField(item, 'name', language, defaultLanguage);
                const variant = variantId ? item.variants.find((v) => v.id === variantId) : null;
                const variantLabel = variant ? getLocalizedField(variant, 'label', language, defaultLanguage) : '';
                const priceVal = variant ? variant.price : item.price;
                const price = formatCurrency(priceVal, currency);
                const totalFormatted = formatCurrency(priceVal * itemQty, currency);

                return (
                  <div key={`${item.id}-${variantId}-${index}`} className="flex items-center justify-between py-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="block text-sm font-bold leading-tight">{name}</span>
                      {variantLabel ? <span className="block text-[11px] text-black/45 mt-0.5">{variantLabel}</span> : null}
                      <span className="block text-xs font-semibold text-black/55 mt-1">{price.amount} {price.symbol}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.08] px-2 py-1 bg-black/[0.02]">
                        <button onClick={() => handleUpdateQty(item.id, variantId, -1)} className="font-bold text-xs px-1.5 transition-all duration-200 active:scale-75">-</button>
                        <span className="w-4 text-center font-bold text-xs">{itemQty}</span>
                        <button onClick={() => handleUpdateQty(item.id, variantId, 1)} className="font-bold text-xs px-1.5 transition-all duration-200 active:scale-75">+</button>
                      </div>
                      <span className="w-16 text-right text-sm font-extrabold">{totalFormatted.amount} {totalFormatted.symbol}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-black/40">{labelFor(language, 'cartEmpty')}</p>
          )}

          {cart.length > 0 ? (
            <div className="border-t border-black/[0.08] pt-4 mt-6">
              <div className="flex items-center justify-between text-base font-extrabold">
                <span>Total:</span>
                <span>{cartTotal.amount} {cartTotal.symbol}</span>
              </div>
              <div className="mt-4 rounded-2xl bg-black/[0.03] p-4 text-center">
                <p className="text-xs font-medium text-black/60 leading-relaxed">
                  {labelFor(language, 'waiterMessage')}
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setCart([])} className="flex-1 h-12 rounded-2xl border border-black/[0.1] font-bold text-xs text-black/60 hover:bg-black/[0.02] transition-colors">
                  {labelFor(language, 'clearOrder')}
                </button>
                <button onClick={() => setCartOpen(false)} className="flex-1 h-12 rounded-2xl font-bold text-xs text-white hover:brightness-110 transition-colors" style={{ backgroundColor: accentColor }}>
                  {labelFor(language, 'close')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Sheet>

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} labelledBy="branded-search-title">
        <div className="sticky top-0 z-10 border-b border-black/[0.06] bg-[#fffdf9] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 flex-1 items-center gap-2 rounded-2xl bg-black/[0.05] px-4">
              <Search size={17} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labelFor(language, 'search')} className="w-full bg-transparent text-sm outline-none" />
            </div>
            <button onClick={() => setSearchOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] transition-all duration-200 active:scale-90"><X size={18} /></button>
          </div>
        </div>
        <div className="min-h-[45dvh] p-4">
          <h2 id="branded-search-title" className="sr-only">{labelFor(language, 'search')}</h2>
          {filteredItems.length ? (
            <div className="space-y-4">
              {(() => {
                const photoResults = filteredItems.filter((entry) => entry.item.imageUrl);
                const textResults = filteredItems.filter((entry) => !entry.item.imageUrl);
                return (
                  <>
                    {photoResults.length ? (
                      <div className="grid grid-cols-2 gap-3">
                        {photoResults.map((entry) => (
                          <div key={entry.item.id} className="flex flex-col">
                            {renderCard(entry)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {textResults.length ? (
                      <div className="rounded-[20px] bg-white px-4 shadow-sm">
                        {textResults.map((entry) => renderCard(entry, true))}
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-black/40">{labelFor(language, 'noResults')}</p>
          )}
        </div>
      </Sheet>

      <Sheet open={aboutOpen} onClose={() => setAboutOpen(false)} labelledBy="branded-about-title"><div className="flex items-center justify-between p-6 pb-3"><div><p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: secondary }}>{labelFor(language, 'about')}</p><h2 id="branded-about-title" className="mt-1 font-serif text-[30px] font-bold">{venueName}</h2></div><button onClick={() => setAboutOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] transition-all duration-200 active:scale-90"><X size={18} /></button></div><div className="space-y-3 p-6 pt-2">{venueDescription ? <p className="mb-5 text-sm leading-relaxed text-black/55">{venueDescription}</p> : null}{venue?.phone ? <a href={`tel:${venue.phone}`} className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4 transition-all duration-200 active:scale-[0.98] hover:bg-black/[0.06]"><Phone size={18} /><span className="text-sm font-semibold">{venue.phone}</span></a> : null}{venue?.websiteUrl ? <a href={venue.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4 transition-all duration-200 active:scale-[0.98] hover:bg-black/[0.06]"><ExternalLink size={18} /><span className="text-sm font-semibold">Website</span></a> : null}{venue?.instagramUrl ? <a href={venue.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4 transition-all duration-200 active:scale-[0.98] hover:bg-black/[0.06]"><InstagramIcon size={18} /><span className="text-sm font-semibold">Instagram</span></a> : null}{venue?.addressLine || venue?.city || venue?.country ? <div className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4"><MapPin size={18} /><span className="text-sm font-semibold">{venue.addressLine || [venue.city, venue.country].filter(Boolean).join(', ')}</span></div> : null}{venue?.businessHoursText ? <div className="flex items-center gap-3 rounded-2xl bg-black/[0.035] p-4"><Clock3 size={18} /><span className="text-sm font-semibold">{venue.businessHoursText}</span></div> : null}{venue?.wifi?.enabled ? <button onClick={handleCopyWifiPassword} className="flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] hover:bg-black/[0.06]" style={{ backgroundColor: hexToRgba(accentColor, 0.08) }}><span className="flex items-center gap-3"><Wifi size={18} /><span><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-black/45">{labelFor(language, 'wifi')}</span><span className="mt-0.5 block text-sm font-extrabold">{venue.wifi.ssid}</span></span></span><span className="text-xs font-bold flex items-center gap-1.5" style={{ color: accentColor }}>{passwordCopied ? <><Check size={14} />{labelFor(language, 'copied')}</> : venue.wifi.password}</span></button> : null}</div></Sheet>
    </div>
  );
};

export default BrandedPublicMenuTemplate;
