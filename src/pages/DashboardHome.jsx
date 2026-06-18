import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Eye,
  ArrowUpRight, QrCode,
  Check, ChevronDown, ExternalLink, Pencil
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { secondaryActionButtonClasses } from "../lib/uiStyles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { getVenueAnalyticsOverview } from "../lib/analyticsApi";
import { fetchCurrentUser } from "../lib/sessionApi";
import { trackProductEvent } from "../lib/productAnalytics";

const PERIOD_OPTIONS = ['today', 'yesterday', '7d', '30d'];

const getDeltaStyles = (value) => {
  if (value >= 0) {
    return {
      text: 'text-green-500',
      bg: 'bg-green-500/10',
      sign: '+',
    };
  }

  return {
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    sign: '',
  };
};

const DashboardHome = () => {
  const { t, i18n } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [overview, setOverview] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    viewChangePercent: 0,
    uniqueVisitorsChangePercent: 0,
    series: [],
  });
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeVenueId = typeof window !== 'undefined'
    ? window.localStorage.getItem('kwikmenu-active-venue')
    : null;
  const publicMenuUrl = activeVenueId
    ? `${origin}/m/${activeVenueId}`
    : `${origin}/dashboard/venues`;
  const activeVenueQrPath = activeVenueId
    ? `/dashboard/venues/${activeVenueId}?tab=qr`
    : '/dashboard/venues';

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => setUserName(user.name || ''))
      .catch(() => setUserName(''));
  }, []);

  useEffect(() => {
    trackProductEvent('dashboard_viewed', {
      venueId: activeVenueId,
      properties: { has_active_venue: Boolean(activeVenueId) },
    });
  }, [activeVenueId]);

  useEffect(() => {
    if (!activeVenueId) {
      setIsLoading(false);
      setOverview({
        totalViews: 0,
        uniqueVisitors: 0,
        viewChangePercent: 0,
        uniqueVisitorsChangePercent: 0,
        series: [],
      });
      return;
    }

    setIsLoading(true);
    setError('');
    getVenueAnalyticsOverview({ venueId: activeVenueId, period: selectedPeriod })
      .then((payload) => {
        setOverview(payload);
      })
      .catch((nextError) => {
        setError(nextError.message || t('dashboard.errors.analyticsLoadFailed'));
        setOverview({
          totalViews: 0,
          uniqueVisitors: 0,
          viewChangePercent: 0,
          uniqueVisitorsChangePercent: 0,
          series: [],
        });
      })
      .finally(() => setIsLoading(false));
  }, [activeVenueId, selectedPeriod, t]);

  const selectedPeriodLabel = useMemo(
    () => t(`dashboard.periods.${selectedPeriod}`),
    [selectedPeriod, t]
  );
  const chartData = overview.series || [];
  const maxViews = Math.max(1, ...chartData.map((point) => point.views || 0));
  const viewDelta = getDeltaStyles(overview.viewChangePercent || 0);
  const uniqueDelta = getDeltaStyles(overview.uniqueVisitorsChangePercent || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {userName ? t('dashboard.welcomeUser', { name: userName }) : t('dashboard.analyticsOverview')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`${secondaryActionButtonClasses} bg-card shadow-sm px-5`}>
                <span className="flex items-center gap-2">
                  {selectedPeriodLabel}
                  <ChevronDown size={16} className="text-muted-foreground" />
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-[220px]">
              {PERIOD_OPTIONS.map((periodVal) => (
                <DropdownMenuItem
                  key={periodVal}
                  onSelect={() => {
                    setSelectedPeriod(periodVal);
                    trackProductEvent('analytics_period_changed', {
                      venueId: activeVenueId,
                      properties: { period: periodVal },
                    });
                  }}
                  className="justify-between"
                >
                  <span>{t(`dashboard.periods.${periodVal}`)}</span>
                  {selectedPeriod === periodVal ? <Check size={16} className="text-brand-purple" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-card border border-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm group hover:border-brand-purple/30 transition-colors min-h-[148px] sm:min-h-0">
          <div className="flex justify-between items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
              <Eye size={18} className="sm:hidden" />
              <Eye size={24} className="hidden sm:block" />
            </div>
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-bold ${viewDelta.text} ${viewDelta.bg} px-2 py-1 rounded-lg`}>
              <ArrowUpRight size={14} className="sm:hidden" />
              <ArrowUpRight size={16} className="hidden sm:block" /> {viewDelta.sign}{overview.viewChangePercent || 0}%
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.12em] sm:tracking-wider">{t('dashboard.menuViews')}</p>
            <h3 className="text-3xl sm:text-4xl font-black text-foreground mt-1 leading-none">
              {isLoading ? '...' : overview.totalViews.toLocaleString('en-US')}
            </h3>
          </div>
        </div>

        <div className="bg-card border border-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm group hover:border-blue-500/30 transition-colors min-h-[148px] sm:min-h-0">
          <div className="flex justify-between items-start">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={18} className="sm:hidden" />
              <Users size={24} className="hidden sm:block" />
            </div>
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-bold ${uniqueDelta.text} ${uniqueDelta.bg} px-2 py-1 rounded-lg`}>
              <ArrowUpRight size={14} className="sm:hidden" />
              <ArrowUpRight size={16} className="hidden sm:block" /> {uniqueDelta.sign}{overview.uniqueVisitorsChangePercent || 0}%
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.12em] sm:tracking-wider">{t('dashboard.uniqueGuests')}</p>
            <h3 className="text-3xl sm:text-4xl font-black text-foreground mt-1 leading-none">
              {isLoading ? '...' : overview.uniqueVisitors.toLocaleString('en-US')}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('dashboard.chart.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.chart.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-md bg-brand-purple"></div>{t('dashboard.chart.legendViews')}</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-md bg-secondary border border-border"></div>{t('dashboard.chart.legendUnique')}</div>
          </div>
        </div>

        <div className="flex-1 flex items-end justify-between gap-2 sm:gap-6 mt-auto pt-6 border-b border-border/50 pb-4 relative min-h-[240px] lg:min-h-[300px]">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full border-t border-dashed border-border/40"></div>
            ))}
          </div>

          {(chartData.length ? chartData : [{ label: '—', views: 0, uniqueVisitors: 0 }]).map((data, index) => {
            const heightViews = `${((data.views || 0) / maxViews) * 100}%`;
            const heightUnique = `${((data.uniqueVisitors || 0) / maxViews) * 100}%`;
            const isWeekend = data.label === 'Sat' || data.label === 'Sun' || data.label === 'Sa' || data.label === 'Su';

            return (
              <div key={`${data.date || 'empty'}-${index}`} className="flex flex-col items-center flex-1 group z-10">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap absolute -mt-12 pointer-events-none shadow-md">
                  {data.views || 0} / {data.uniqueVisitors || 0}
                </div>

                <div className="relative w-full max-w-[50px] lg:max-w-[70px] h-[200px] lg:h-[260px] flex items-end justify-center gap-1 sm:gap-1.5">
                  <div
                    className={`w-1/2 rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${isWeekend ? 'bg-brand-purple' : 'bg-brand-purple/60'}`}
                    style={{ height: heightViews }}
                  ></div>
                  <div
                    className="w-1/2 bg-secondary border border-border/50 border-b-0 rounded-t-lg transition-all duration-500 group-hover:bg-secondary/70"
                    style={{ height: heightUnique }}
                  ></div>
                </div>
                <span className={`text-sm font-bold mt-4 ${isWeekend ? 'text-brand-purple' : 'text-muted-foreground'}`}>
                  {t('days.' + data.label, { defaultValue: data.label })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/dashboard/menu"
          onClick={() => trackProductEvent('dashboard_action_clicked', {
            venueId: activeVenueId,
            properties: { action: 'open_menu_editor' },
          })}
          className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between group hover:border-foreground/20 transition-all hover:-translate-y-1 min-h-[220px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-colors">
            <Pencil size={28} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">{t('dashboard.actions.editMenu.title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.actions.editMenu.description')}</p>
          </div>
        </Link>

        <Link
          to={activeVenueQrPath}
          onClick={() => trackProductEvent('dashboard_action_clicked', {
            venueId: activeVenueId,
            properties: { action: 'download_qr' },
          })}
          className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between group hover:border-foreground/20 transition-all hover:-translate-y-1 min-h-[220px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-colors">
            <QrCode size={28} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">{t('dashboard.actions.downloadQr.title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.actions.downloadQr.description')}</p>
          </div>
        </Link>

        <a
          href={publicMenuUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackProductEvent('dashboard_action_clicked', {
            venueId: activeVenueId,
            properties: { action: 'open_public_menu' },
          })}
          className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between group hover:border-foreground/20 transition-all hover:-translate-y-1 min-h-[220px] sm:min-h-[250px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-colors">
            <ExternalLink size={28} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">{t('dashboard.actions.openPublic.title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.actions.openPublic.description')}</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default DashboardHome;
