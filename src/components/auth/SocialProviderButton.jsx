import { formFieldClasses } from "../../lib/uiStyles";

const SocialProviderButton = ({icon: Icon, label, iconClassName = '', ...props}) => (
  <button
    type="button"
    className={`${formFieldClasses} h-11 justify-center gap-3 bg-card font-semibold text-[11px] text-foreground hover:border-border/80 hover:bg-background hover:shadow-md sm:h-12 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:shadow-none disabled:hover:border-border/60`}
    {...props}
  >
    <Icon className={`h-4 w-4 -ml-1 -mr-1 shrink-0 ${iconClassName}`.trim()}/>
    <span>{label}</span>
  </button>
);

export default SocialProviderButton;
