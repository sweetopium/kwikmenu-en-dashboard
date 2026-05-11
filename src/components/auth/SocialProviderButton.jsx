import { formFieldClasses } from "../../lib/uiStyles";

const SocialProviderButton = ({icon: Icon, label, iconClassName = '', ...props}) => (
  <button
    type="button"
    className={`${formFieldClasses} h-11 justify-center gap-3 bg-card font-semibold text-foreground shadow-sm hover:border-border/80 hover:bg-background hover:shadow-md sm:h-12`}
    {...props}
  >
    <Icon className={`h-5 w-5 shrink-0 ${iconClassName}`.trim()}/>
    <span>{label}</span>
  </button>
);

export default SocialProviderButton;
