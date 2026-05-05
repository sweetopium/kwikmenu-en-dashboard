import { Button } from "../ui/button";
import { primaryActionButtonClasses } from "../../lib/uiStyles";

const SettingsPageHeader = ({ title, description, actionLabel = "Сохранить изменения", actionIcon: ActionIcon }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/60 p-6 rounded-3xl shadow-sm">
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>

    {actionLabel ? (
      <Button className={`${primaryActionButtonClasses} px-6`}>
        {ActionIcon ? <ActionIcon size={18} className="mr-2" /> : null}
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default SettingsPageHeader;
