import {useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Loader2} from "lucide-react";
import {FcGoogle} from "react-icons/fc";
import {FaYandex} from "react-icons/fa6";
import {SiMaildotru} from "react-icons/si";
import {useTranslation} from "react-i18next";
import AuthShell from "../components/auth/AuthShell.jsx";
import SocialProviderButton from "../components/auth/SocialProviderButton.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import {getForgotPasswordUrl, getPostLoginRedirect, getProviderAuthUrl, loginWithEmail} from "../lib/auth.js";
import { primaryActionButtonClasses } from "../lib/uiStyles.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const { t } = useTranslation();
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
      nextErrors.email = t('login.errEmailRequired');
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = t('login.errEmailInvalid');
    }

    if (!form.password) {
      nextErrors.password = t('login.errPasswordRequired');
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
      setSubmitError(error.message || t('login.errGeneral'));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.subtitle')}
    >
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <SocialProviderButton icon={FcGoogle} label="Google" onClick={() => handleProviderClick("google")}/>
          <SocialProviderButton icon={FaYandex} label="Yandex" iconClassName="text-[#fc3f1d]" onClick={() => handleProviderClick("yandex")}/>
          <SocialProviderButton icon={SiMaildotru} label="Mail" iconClassName="text-[#005ff9]" onClick={() => handleProviderClick("mailru")}/>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
          <div className="h-px flex-1 bg-border"/>
          <span>{t('login.orEmail')}</span>
          <div className="h-px flex-1 bg-border"/>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <AuthField
            label={t('login.email')}
            type="email"
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
            value={form.email}
            onChange={updateField("email")}
            error={errors.email}
          />

          <AuthField
            label={t('login.password')}
            type="password"
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
            value={form.password}
            onChange={updateField("password")}
            error={errors.password}
            rightAction={
              <a
                href={forgotPasswordUrl}
                className="text-xs font-semibold text-brand-purple transition-colors hover:text-brand-purple/80 sm:text-sm"
              >
                {t('login.forgotPassword')}
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
            {pending ? <Loader2 className="h-5 w-5 animate-spin"/> : t('login.btnSubmit')}

          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground sm:text-sm">
          {t('login.footerLegal')}
        </p>

        <p className="text-center text-[11px] text-muted-foreground sm:text-sm">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-purple transition-colors hover:text-brand-purple/80">
            {t('login.registerLink')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
