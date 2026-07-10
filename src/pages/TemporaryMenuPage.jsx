import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import PublicMenuTemplateRenderer from '../components/public-menu/PublicMenuTemplateRenderer';
import PublicMenuSkeletonRenderer from '../components/public-menu/PublicMenuSkeletonRenderer';
import { Button } from '../components/ui/button';
import { getTemporaryMenu } from '../lib/demoMagicApi';

const TemporaryMenuPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getTemporaryMenu(id, { signal: controller.signal })
      .then((payload) => {
        setData(payload);
        setError('');
      })
      .catch((nextError) => {
        if (nextError?.name !== 'AbortError') {
          setError(nextError.message || 'Temporary menu is unavailable.');
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [id]);

  const menu = useMemo(() => data?.menus?.[0] || null, [data]);

  if (isLoading) {
    return <PublicMenuSkeletonRenderer templateType="extended" />;
  }

  if (error || !data?.venue || !menu) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full rounded-[2rem] border border-destructive/20 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">Temporary menu unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error || 'This demo menu is not ready or no longer exists.'}</p>
            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-xl border-border/60 px-4">
                <Link to="/">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to KwikMenu
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
      menu={menu}
      availableMenus={data.menus}
      activeMenuId={menu.id}
      onMenuChange={() => {}}
      accentColor={data.venue.design?.accentColor || '#6d67eb'}
    />
  );
};

export default TemporaryMenuPage;
