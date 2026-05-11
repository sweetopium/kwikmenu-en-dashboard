const AuthField = ({
  label,
  hint,
  error,
  rightAction,
  className = '',
  ...props
}) => (
  <label className={`block space-y-3 ${className}`.trim()}>
    <div className="flex items-center justify-between gap-3">
      <span className="text-base font-semibold text-foreground">{label}</span>
      {rightAction}
    </div>
    <input
      className={`h-15 w-full rounded-3xl border bg-background px-5 text-lg text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground/85 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/15 ${error ? 'border-destructive/60 ring-4 ring-destructive/10' : 'border-border'}`}
      {...props}
    />
    {error ? (
      <p className="text-sm text-destructive">{error}</p>
    ) : hint ? (
      <p className="text-sm text-muted-foreground">{hint}</p>
    ) : null}
  </label>
);

export default AuthField;
