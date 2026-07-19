import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { getPublicVenueMenus } from '../lib/publicMenuApi.js';
import PublicMenuTemplateRenderer from '../components/public-menu/PublicMenuTemplateRenderer.jsx';
import PublicMenuSkeletonRenderer from '../components/public-menu/PublicMenuSkeletonRenderer.jsx';
import { Button } from '../components/ui/button.jsx';
import { normalizeTemplateType } from '../lib/publicMenuUtils.js';

const getStoredTemplateType = (venueId) => {
  if (!venueId || typeof window === 'undefined') {
    return 'simple';
  }

  return normalizeTemplateType(window.sessionStorage.getItem(`kwikmenu-public-template:${venueId}`) || 'simple');
};

const PublicVenueMenuPage = () => {
  const { t } = useTranslation();
  const { venueId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [error, setError] = useState('');
  const [lastKnownTemplateType, setLastKnownTemplateType] = useState(() => getStoredTemplateType(venueId));

  useEffect(() => {
    let isCancelled = false;

    if (!venueId) {
      setError(t('publicVenueMenu.errors.invalidLink'));
      setDataLoaded(true);
      return undefined;
    }

    setDataLoaded(false);
    setError('');
    getPublicVenueMenus(venueId)
      .then((payload) => {
        if (isCancelled) {
          return;
        }

        setData(payload);
      })
      .catch((nextError) => {
        if (isCancelled) {
          return;
        }

        setData(null);
        setError(nextError.message || t('publicVenueMenu.errors.loadFailed'));
      })
      .finally(() => {
        if (!isCancelled) {
          setDataLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [venueId, t]);

  useEffect(() => {
    if (!dataLoaded) return undefined;

    let active = true;
    const failsafeTimeout = setTimeout(() => {
      if (active) {
        setFontsLoaded(true);
      }
    }, 850);

    if (typeof document !== 'undefined' && document.fonts) {
      Promise.all([
        document.fonts.load('1em "Playfair Display"'),
        document.fonts.load('1em "Geist Variable"'),
      ])
        .then(() => {
          clearTimeout(failsafeTimeout);
          if (active) {
            setFontsLoaded(true);
          }
        })
        .catch(() => {
          clearTimeout(failsafeTimeout);
          if (active) {
            setFontsLoaded(true);
          }
        });
    } else {
      clearTimeout(failsafeTimeout);
      setFontsLoaded(true);
    }

    return () => {
      active = false;
      clearTimeout(failsafeTimeout);
    };
  }, [dataLoaded]);

  // Preload critical images to prevent layout shift (CLS) under bad network conditions
  useEffect(() => {
    const activeMenuId = searchParams.get('menu');
    if (!dataLoaded || !data || imagesLoaded || (data.menus?.length > 0 && !activeMenuId)) return undefined;

    const urlsToPreload = new Set();

    // 1. Venue cover image and logos
    if (data.venue?.coverImageUrl) urlsToPreload.add(data.venue.coverImageUrl);
    if (data.venue?.logoUrl) urlsToPreload.add(data.venue.logoUrl);
    if (data.venue?.design?.logoUrl) urlsToPreload.add(data.venue.design.logoUrl);

    // 2. Active menu promo banner image
    const activeMenu = data.menus?.find((m) => m.id === activeMenuId) || data.menus?.[0];
    if (activeMenu?.payload?.settings?.promo?.imageUrl) {
      urlsToPreload.add(activeMenu.payload.settings.promo.imageUrl);
    }

    // 3. Item images from all categories in the active menu
    if (activeMenu?.payload?.categories) {
      activeMenu.payload.categories.forEach((category) => {
        if (category.items) {
          category.items.forEach((item) => {
            if (item.imageUrl && item.isAvailable !== false) {
              urlsToPreload.add(item.imageUrl);
            }
          });
        }
      });
    }

    const uniqueUrls = Array.from(urlsToPreload).filter((url) => typeof url === 'string' && url.trim());

    if (uniqueUrls.length === 0) {
      setImagesLoaded(true);
      return undefined;
    }

    let loadedCount = 0;
    let active = true;

    // Failsafe timeout: if connection is slow, show page after 15s anyway and load the rest lazily
    const failsafeTimeout = setTimeout(() => {
      if (active) {
        setImagesLoaded(true);
      }
    }, 15000);

    const handleLoadComplete = () => {
      loadedCount++;
      if (loadedCount >= uniqueUrls.length) {
        clearTimeout(failsafeTimeout);
        if (active) {
          setImagesLoaded(true);
        }
      }
    };

    uniqueUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = handleLoadComplete;
      img.onerror = handleLoadComplete; // Count failed loads to avoid hanging
    });

    return () => {
      active = false;
      clearTimeout(failsafeTimeout);
    };
  }, [dataLoaded, data, searchParams, imagesLoaded]);

  const isLoading = !error && (!dataLoaded || !fontsLoaded || !imagesLoaded);
  const menus = data?.menus || [];
  const requestedMenuId = searchParams.get('menu');
  const activeMenu = useMemo(() => {
    if (!menus.length) {
      return null;
    }

    return menus.find((menu) => menu.id === requestedMenuId) || menus[0];
  }, [menus, requestedMenuId]);

  useEffect(() => {
    const nextTemplateType = normalizeTemplateType(
      data?.venue?.design?.template || activeMenu?.payload?.settings?.templateType || 'simple'
    );
    setLastKnownTemplateType(nextTemplateType);

    if (venueId && typeof window !== 'undefined') {
      window.sessionStorage.setItem(`kwikmenu-public-template:${venueId}`, nextTemplateType);
    }
  }, [activeMenu?.payload?.settings?.templateType, data?.venue?.design?.template, venueId]);

  useEffect(() => {
    if (!activeMenu) {
      return;
    }

    if (requestedMenuId === activeMenu.id) {
      return;
    }

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('menu', activeMenu.id);
      return next;
    }, { replace: true });
  }, [activeMenu, requestedMenuId, setSearchParams]);

  const handleMenuChange = (menuId) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('menu', menuId);
      return next;
    });
  };

  if (isLoading) {
    return <PublicMenuSkeletonRenderer templateType={lastKnownTemplateType} />;
  }

  if (error || !data?.venue) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full rounded-[2rem] border border-destructive/20 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">{t('publicVenueMenu.errors.unavailableTitle')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || t('publicVenueMenu.errors.unavailableSubtitle')}</p>
            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-xl border-border/60 px-4">
                <Link to="/">
                  <ArrowLeft size={16} className="mr-2" />
                  {t('publicVenueMenu.backToHome')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicMenuTemplateRenderer
      venue={data.venue}
      menu={activeMenu}
      availableMenus={menus}
      activeMenuId={activeMenu?.id}
      onMenuChange={handleMenuChange}
      accentColor={data.venue.design?.accentColor || '#6d67eb'}
    />
  );
};

export default PublicVenueMenuPage;
