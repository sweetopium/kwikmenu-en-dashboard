import OnboardingCard from "../onboarding/OnboardingCard.jsx";

const AuthShell = ({
  title,
  subtitle,
  children,
}) => (
  <div className="mx-auto flex w-full max-w-2xl flex-col space-y-6 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <OnboardingCard className="px-6 py-8 sm:px-8 md:px-10">
      <div className="mb-8 border-b border-border/70 pb-8 sm:mb-10">
        <div className="max-w-xl space-y-4">
          <div className="space-y-3">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {children}
    </OnboardingCard>
  </div>
);

export default AuthShell;
