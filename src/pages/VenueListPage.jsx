import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Calendar,
  CreditCard,
  FolderOpen,
  MapPin,
  MoreHorizontal,
  Link as LinkIcon,
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { primaryActionButtonClasses, subtleIconButtonClasses } from "../lib/uiStyles";
import { listVenues } from "../lib/venuesApi";

const VenueListPage = () => {
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    listVenues()
      .then(setVenues)
      .catch(() => setVenues([]));
  }, []);

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Заведения
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Выберите заведение, чтобы открыть его профиль, Wi‑Fi и внешний вид меню.
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <Button className={`${primaryActionButtonClasses} px-5 shrink-0 cursor-pointer`}>
                Добавить заведение
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col group hover:border-brand-purple/30 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-brand-purple/10 text-brand-purple shrink-0">
                <Building2 size={18} />
              </div>

              <div className="px-3 py-1 bg-green-500/10 text-green-600 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-green-500/20">
                Активно
              </div>
            </div>

            <div className="mb-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin size={14} />
                <span>{venue.city}</span>
              </div>

              <h3 className="text-xl font-bold text-foreground group-hover:text-brand-purple transition-colors truncate">
                {venue.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {venue.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <FolderOpen size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Меню</span>
                <span className="text-xs font-black text-foreground">{venue.menusCount}</span>
              </div>

              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <LinkIcon size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Нет ссылки
                </span>
              </div>

              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
                <CreditCard size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">PRO</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 md:pt-4 border-t border-border/50 gap-4 -mb-2 md:-mb-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} />
                <span className="text-[11px] font-medium">{new Date(venue.updatedAt).toLocaleString('ru-RU')}</span>
              </div>

              <div className="flex items-center gap-2">
                <button className={`${subtleIconButtonClasses} hover:bg-secondary cursor-pointer`}>
                  <MoreHorizontal size={18} />
                </button>

                <Link
                  to={`/dashboard/venues/${venue.id}`}
                  className="h-10 sm:h-12 px-4 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  Открыть
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueListPage;
