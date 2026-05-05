const OnboardingCard = ({ children, className = '' }) => (
  <div
    className={`bg-card border border-border/60 p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm relative overflow-hidden ${className}`}
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
    {children}
  </div>
);

export default OnboardingCard;
