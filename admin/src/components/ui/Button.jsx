import { cn } from '../../lib/utils';

export const Button = ({ className, variant = 'default', size = 'default', ...props }) => {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-background hover:bg-secondary',
    ghost: 'hover:bg-secondary text-muted-foreground hover:text-foreground',
    destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  };
  const sizes = {
    default: 'h-9 px-3 text-sm',
    sm: 'h-8 px-2.5 text-xs',
    icon: 'h-9 w-9',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
};
