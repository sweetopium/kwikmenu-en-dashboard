import {useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {ArrowRight, Loader2} from "lucide-react";
import {FcGoogle} from "react-icons/fc";
import {FaYandex} from "react-icons/fa6";
import {SiMaildotru} from "react-icons/si";
import AuthShell from "../components/auth/AuthShell.jsx";
import SocialProviderButton from "../components/auth/SocialProviderButton.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import {getForgotPasswordUrl, getPostLoginRedirect, getProviderAuthUrl, loginWithEmail} from "../lib/auth.js";
import { primaryActionButtonClasses } from "../lib/uiStyles.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const forgotPasswordUrl = useMemo(() => getForgotPasswordUrl(), []);

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Введите email";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Укажите корректный email";
    }

    if (!form.password) {
      nextErrors.password = "Введите пароль";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({...current, [field]: value}));
    setErrors((current) => ({...current, [field]: undefined}));
    setSubmitError("");
  };

  const handleProviderClick = (provider) => {
    window.location.assign(getProviderAuthUrl(provider));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setPending(true);
    setSubmitError("");

    try {
      const result = await loginWithEmail({
        email: form.email.trim(),
        password: form.password,
      });

      navigate(result?.redirectUrl || getPostLoginRedirect());
    } catch (error) {
      setSubmitError(error.message || "Не удалось выполнить вход");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="С возвращением"
      subtitle="Рады видеть вас снова. Введите данные для входа в личный кабинет"
    >
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <SocialProviderButton icon={FcGoogle} label="Google" onClick={() => handleProviderClick("google")}/>
          <SocialProviderButton icon={FaYandex} label="Яндекс" iconClassName="text-[#fc3f1d]" onClick={() => handleProviderClick("yandex")}/>
          <SocialProviderButton icon={SiMaildotru} label="Mail" iconClassName="text-[#005ff9]" onClick={() => handleProviderClick("mailru")}/>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
          <div className="h-px flex-1 bg-border"/>
          <span>или через почту</span>
          <div className="h-px flex-1 bg-border"/>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={updateField("email")}
            error={errors.email}
          />

          <AuthField
            label="Пароль"
            type="password"
            autoComplete="current-password"
            placeholder="Введите пароль"
            value={form.password}
            onChange={updateField("password")}
            error={errors.password}
            rightAction={
              <a
                href={forgotPasswordUrl}
                className="text-xs font-semibold text-brand-purple transition-colors hover:text-brand-purple/80 sm:text-sm"
              >
                Забыли пароль?
              </a>
            }
          />

          {submitError ? (
            <div className="rounded-2xl border border-destructive/15 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={`w-full ${primaryActionButtonClasses} disabled:translate-y-0 disabled:opacity-60`}
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin"/> : "Войти в систему"}

          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground sm:text-sm">
          Продолжая, вы подтверждаете согласие с условиями сервиса и политикой обработки данных.
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
