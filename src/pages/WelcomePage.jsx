import {Link} from 'react-router-dom';
import {Zap, HelpCircle, ChevronRight} from 'lucide-react';

const WelcomePage = () => (
    <div
        className="max-w-2xl mx-auto text-center space-y-10 py-3 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Заголовок */}
        <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Добро пожаловать
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
                Создадим ваше цифровое меню за пару минут. Как вам удобнее начать?
            </p>
        </div>

        {/* Карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-8">

            {/* Карточка 1: Справлюсь сам */}
            <Link
                to="/onboarding/upload"
                className="group relative flex flex-col p-8 rounded-3xl bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-purple/30 transition-all duration-300"
            >
                <div className="flex justify-between items-start">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-brand-purple text-white shadow-md group-hover:scale-105 group-hover:shadow-brand-purple/20 transition-all duration-300">
                        <Zap size={26} fill="currentColor"/>
                    </div>
                    <div
                        className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-brand-purple/10 transition-colors">
                        <ChevronRight size={18}
                                      className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-brand-purple transition-all duration-300"/>
                    </div>
                </div>
                <div className="mt-8">
                    <h3 className="font-bold text-2xl text-foreground">Справлюсь сам</h3>
                    <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                        Загружу PDF или фото, ИИ распознает, я проверю и опубликую
                    </p>
                </div>
            </Link>

            {/* Карточка 2: Нужна помощь */}
            <Link
                to="/onboarding/help"
                className="group relative flex flex-col p-8 rounded-3xl bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-foreground/20 transition-all duration-300"
            >
                <div className="flex justify-between items-start">
                    <div
                        className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground shadow-sm group-hover:scale-105 transition-all duration-300">
                        <HelpCircle size={26}/>
                    </div>
                    <div
                        className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
                        <ChevronRight size={18}
                                      className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all duration-300"/>
                    </div>
                </div>
                <div className="mt-8">
                    <h3 className="font-bold text-2xl text-foreground">Нужна помощь</h3>
                    <p className="text-base text-muted-foreground mt-3 leading-relaxed">
                        Оставьте контакт, и наша команда настроит всё за вас
                    </p>
                </div>
            </Link>

        </div>
    </div>
);

export default WelcomePage;