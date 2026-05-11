import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Menu as MenuIcon } from 'lucide-react';

import { getPublicVenueMenus } from '../lib/publicMenuApi.js';
import PublicMenuTemplateRenderer from '../components/public-menu/PublicMenuTemplateRenderer.jsx';
import { Button } from '../components/ui/button.jsx';

const PublicVenueMenuPage = () => {
  const { venueId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!venueId) {
      setError('Некорректная публичная ссылка.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    getPublicVenueMenus(venueId)
      .then((payload) => setData(payload))
      .catch((nextError) => {
        setData(null);
        setError(nextError.message || 'Не удалось загрузить публичное меню.');
      })
      .finally(() => setIsLoading(false));
  }, [venueId]);

  const menus = data?.menus || [];
  const requestedMenuId = searchParams.get('menu');
  const activeMenu = useMemo(() => {
    if (!menus.length) {
      return null;
    }

    return menus.find((menu) => menu.id === requestedMenuId) || menus[0];
  }, [menus, requestedMenuId]);

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
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
              <MenuIcon size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">Загружаем меню</h1>
            <p className="mt-2 text-sm text-muted-foreground">Подтягиваем опубликованные категории и блюда заведения.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.venue) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full rounded-[2rem] border border-destructive/20 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">Публичное меню недоступно</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || 'Не удалось открыть меню по этой ссылке.'}</p>
            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-xl border-border/60 px-4">
                <Link to="/">
                  <ArrowLeft size={16} className="mr-2" />
                  На главную
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
