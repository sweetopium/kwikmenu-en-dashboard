import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { inputBaseClasses } from "../onboarding/countries";

const AuthField = ({
  label,
  hint,
  error,
  rightAction,
  className = '',
  type = 'text',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`block space-y-3 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="ml-1 text-[11px] font-medium text-foreground sm:text-sm cursor-pointer">{label}</label>
        {rightAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={currentType}
          className={`${inputBaseClasses} ${error ? 'border-destructive/60 ring-2 ring-destructive/10' : ''} ${isPassword ? 'pr-10' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
};

export default AuthField;
