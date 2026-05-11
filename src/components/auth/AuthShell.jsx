import {Link} from "react-router-dom";
import {ArrowLeft, Sparkles, Zap} from "lucide-react";

const AuthShell = ({
  title,
  subtitle,
  eyebrow,
  alternateLabel,
  alternateHref,
  alternateAction,
  children,
}) => (
  <div className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="mb-6 flex items-center justify-between gap-4">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
      >
        <ArrowLeft className="h-4 w-4"/>
        На главную
      </Link>

      <div className="hidden items-center gap-3 sm:flex">
        <span className="text-sm text-muted-foreground">{alternateLabel}</span>
        <Link
          to={alternateHref}
          className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
        >
          {alternateAction}
        </Link>
      </div>
    </div>

    <div className="rounded-[2rem] border border-border/70 bg-card px-6 py-8 shadow-[0_20px_80px_rgba(55,65,81,0.06)] sm:px-10 sm:py-10">
      <div className="mb-10 flex flex-col gap-8 border-b border-border/70 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/15 bg-brand-purple/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">
            <Sparkles className="h-3.5 w-3.5"/>
            {eyebrow}
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-brand-purple text-white shadow-[0_16px_40px_rgba(115,93,255,0.28)]">
          <Zap className="h-7 w-7" fill="currentColor"/>
        </div>
      </div>

      {children}

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:hidden">
        <span>{alternateLabel}</span>
        <Link to={alternateHref} className="font-semibold text-foreground transition-colors hover:text-brand-purple">
          {alternateAction}
        </Link>
      </div>
    </div>
  </div>
);

export default AuthShell;
