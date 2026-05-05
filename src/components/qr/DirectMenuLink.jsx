import { Copy } from 'lucide-react';

const DirectMenuLink = ({ displayValue, onCopy }) => (
  <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm flex items-center justify-between min-w-0">
    <div className="truncate pr-4 min-w-0">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        Прямая ссылка на меню
      </p>
      <p className="text-sm font-medium text-brand-purple truncate">
        {displayValue}
      </p>
    </div>

    <button
      onClick={onCopy}
      className="w-10 h-10 shrink-0 bg-secondary hover:bg-secondary/80 rounded-xl flex items-center justify-center text-foreground transition-colors border border-border/50 shadow-sm"
    >
      <Copy size={16} />
    </button>
  </div>
);

export default DirectMenuLink;
