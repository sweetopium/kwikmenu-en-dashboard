import {Link} from "react-router-dom";
import {ArrowLeft, Sparkles, Zap} from "lucide-react";

const AuthShell = ({
  title,
  subtitle,
  children,
}) => (
  <div className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="mb-6 flex items-center justify-between gap-4">

    </div>

    <div className="rounded-[2rem] border border-border/70 bg-card px-6 py-8 shadow-[0_20px_80px_rgba(55,65,81,0.06)] sm:px-10 sm:py-10">
      <div className="mb-10 flex flex-col gap-8 border-b border-border/70 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-4">

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

      </div>

      {children}


    </div>
  </div>
);

export default AuthShell;
