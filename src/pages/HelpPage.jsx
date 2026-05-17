import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import OnboardingCard from "../components/onboarding/OnboardingCard";
import HelpRequestForm from "../components/onboarding/HelpRequestForm";

const HelpPage = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-10 py-3 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground bg-card border border-border/60 shadow-sm hover:shadow-md px-4 py-2.5 rounded-full transition-all group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        К выбору
      </Link>

      <OnboardingCard>
        <HelpRequestForm />
      </OnboardingCard>
    </div>
  );
};

export default HelpPage;
