import { Copy, ExternalLink } from 'lucide-react';

import { subtleIconButtonClasses } from "../../lib/uiStyles";

const DirectMenuLink = ({ displayValue, onCopy, onOpen, href, action = 'copy', embedded = false }) => (
  <div className={`${embedded ? 'bg-secondary/20 border border-border/60' : 'bg-card border border-border/60 shadow-sm'} rounded-2xl p-4 flex items-center justify-between min-w-0`}>
    <div className="truncate pr-4 min-w-0">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        Прямая ссылка на меню
      </p>
      <p className="text-sm font-medium text-brand-purple truncate">
        {displayValue}
      </p>
    </div>

    {action === 'open' ? (
      <a
        href={href || '#'}
        target="_blank"
        rel="noreferrer"
        onClick={onOpen}
        className={`${subtleIconButtonClasses} shrink-0 hover:bg-secondary/80 text-foreground shadow-sm`}
        aria-label="Открыть меню в новой вкладке"
      >
        <ExternalLink size={16} />
      </a>
    ) : (
      <button
        onClick={onCopy}
        className={`${subtleIconButtonClasses} shrink-0 hover:bg-secondary/80 text-foreground shadow-sm`}
        aria-label="Скопировать ссылку на меню"
      >
        <Copy size={16} />
      </button>
    )}
  </div>
);

export default DirectMenuLink;
