import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowRight, Loader2} from "lucide-react";
import {FcGoogle} from "react-icons/fc";
import {FaYandex} from "react-icons/fa6";
import {SiMaildotru} from "react-icons/si";
import AuthShell from "../components/auth/AuthShell.jsx";
import SocialProviderButton from "../components/auth/SocialProviderButton.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import {getPostRegisterRedirect, getProviderAuthUrl, registerWithEmail} from "../lib/auth.js";
import { primaryActionButtonClasses } from "../lib/uiStyles.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Введите имя";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Имя должно быть не короче 2 символов";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Введите email";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Укажите корректный email";
    }

    if (!form.password) {
      nextErrors.password = "Введите пароль";
    } else if (form.password.length < 8) {
      nextErrors.password = "Пароль должен быть не короче 8 символов";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Повторите пароль";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Пароли не совпадают";
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
      const result = await registerWithEmail({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      navigate(result?.redirectUrl || getPostRegisterRedirect());
    } catch (error) {
      setSubmitError(error.message || "Не удалось создать аккаунт");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="Введите данные для регистрации в системе, это займет меньше минуты"
    >
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <SocialProviderButton icon={FcGoogle} label="Google" onClick={() => handleProviderClick("google")}/>
          <SocialProviderButton icon={FaYandex} label="Яндекс" iconClassName="text-[#fc3f1d]" onClick={() => handleProviderClick("yandex")}/>
          <SocialProviderButton icon={SiMaildotru} label="Mail.ru" iconClassName="text-[#005ff9]" onClick={() => handleProviderClick("mailru")}/>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
          <div className="h-px flex-1 bg-border"/>
          <span>или через почту</span>
          <div className="h-px flex-1 bg-border"/>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <AuthField
            label="Ваше имя"
            type="text"
            autoComplete="name"
            placeholder="Например: Александр"
            value={form.name}
            onChange={updateField("name")}
            error={errors.name}
          />

          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={updateField("email")}
            error={errors.email}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AuthField
              label="Пароль"
              type="password"
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
              value={form.password}
              onChange={updateField("password")}
              error={errors.password}
            />

            <AuthField
              label="Повторите пароль"
              type="password"
              autoComplete="new-password"
              placeholder="Повторите пароль"
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              error={errors.confirmPassword}
            />
          </div>

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
            {pending ? <Loader2 className="h-5 w-5 animate-spin"/> : "Зарегистрироваться"}

          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground sm:text-sm">
          После регистрации можно сразу перейти к загрузке первого меню и заполнению данных заведения.
        </p>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
