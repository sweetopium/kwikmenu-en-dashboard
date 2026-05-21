import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, Menu as MenuIcon } from 'lucide-react';

import { getPublicVenueMenus } from '../lib/publicMenuApi.js';
import PublicMenuTemplateRenderer from '../components/public-menu/PublicMenuTemplateRenderer.jsx';
import PublicMenuSkeletonRenderer from '../components/public-menu/PublicMenuSkeletonRenderer.jsx';
import { Button } from '../components/ui/button.jsx';
import { normalizeTemplateType } from '../lib/publicMenuUtils.js';

const MIN_PUBLIC_MENU_LOADING_MS = 3000;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastKnownTemplateType, setLastKnownTemplateType] = useState(() => getStoredTemplateType(venueId));

  useEffect(() => {
    let isCancelled = false;
    const requestStartedAt = Date.now();

    if (!venueId) {
      setError(t('publicVenueMenu.errors.invalidLink'));
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
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
        if (isCancelled) {
          return;
        }

        const elapsedMs = Date.now() - requestStartedAt;
        const remainingMs = Math.max(MIN_PUBLIC_MENU_LOADING_MS - elapsedMs, 0);

        window.setTimeout(() => {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }, remainingMs);
      });

    return () => {
      isCancelled = true;
    };
  }, [venueId, t]);

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
