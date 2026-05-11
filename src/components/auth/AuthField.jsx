import { inputBaseClasses } from "../onboarding/countries";

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
      <span className="ml-1 text-[11px] font-medium text-foreground sm:text-sm">{label}</span>
      {rightAction}
    </div>
    <input
      className={`${inputBaseClasses} ${error ? 'border-destructive/60 ring-2 ring-destructive/10' : ''}`}
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
