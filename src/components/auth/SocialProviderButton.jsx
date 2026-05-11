const SocialProviderButton = ({icon: Icon, label, iconClassName = '', ...props}) => (
  <button
    type="button"
    className="flex h-15 w-full items-center justify-center gap-3 rounded-3xl border border-border bg-background px-5 text-base font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-purple/25 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    {...props}
  >
    <Icon className={`h-5 w-5 shrink-0 ${iconClassName}`.trim()}/>
    <span>{label}</span>
  </button>
);

export default SocialProviderButton;
