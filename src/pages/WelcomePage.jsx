import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, HelpCircle, ChevronRight } from 'lucide-react';

import OnboardingCard from "../components/onboarding/OnboardingCard";
import HelpRequestForm from "../components/onboarding/HelpRequestForm";

const WelcomePage = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    if (!isHelpOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isHelpOpen]);

  return (
    <>
      <div className="max-w-2xl mx-auto text-center space-y-10 py-3 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Как вы хотите начать?
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Выберите удобный сценарий: пройти запуск самостоятельно или оставить заявку, и мы поможем подготовить меню и QR-код.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-8">
          <Link
            to="/register"
            className="group relative flex flex-col p-8 rounded-3xl bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-purple/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-brand-purple text-white shadow-md group-hover:scale-105 group-hover:shadow-brand-purple/20 transition-all duration-300">
                <Zap size={26} fill="currentColor" />
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-brand-purple/10 transition-colors">
                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-brand-purple transition-all duration-300"
                />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="font-bold text-2xl text-foreground">Самостоятельно</h3>
              <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                Сначала создайте аккаунт, затем загрузите действующее меню и запустите AI-разбор.
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="group relative flex flex-col p-8 rounded-3xl bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-foreground/20 transition-all duration-300 text-left"
          >
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground shadow-sm group-hover:scale-105 transition-all duration-300">
                <HelpCircle size={26} />
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all duration-300"
                />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="font-bold text-2xl text-foreground">Нужна помощь</h3>
              <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                Оставьте заявку, и менеджер поможет с переносом меню и подготовкой готового QR-кода.
              </p>
            </div>
          </button>
        </div>
      </div>

      {isHelpOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm" onClick={() => setIsHelpOpen(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <OnboardingCard className="shadow-2xl">
              <HelpRequestForm onClose={() => setIsHelpOpen(false)} />
            </OnboardingCard>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default WelcomePage;
