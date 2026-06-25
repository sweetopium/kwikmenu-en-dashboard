import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Loader2} from "lucide-react";
import {FcGoogle} from "react-icons/fc";
import {useTranslation} from "react-i18next";
import AuthShell from "../components/auth/AuthShell.jsx";
import AuthField from "../components/auth/AuthField.jsx";
import SocialProviderButton from "../components/auth/SocialProviderButton.jsx";
import {getPostRegisterRedirect, getProviderAuthUrl, registerWithEmail} from "../lib/auth.js";
import { trackRegistrationConversion } from "../lib/conversionTracking.js";
import { primaryActionButtonClasses } from "../lib/uiStyles.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeLegal, setAgreeLegal] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t('register.errNameRequired');
    } else if (form.name.trim().length < 2) {
      nextErrors.name = t('register.errNameShort');
    }

    if (!form.email.trim()) {
      nextErrors.email = t('register.errEmailRequired');
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = t('register.errEmailInvalid');
    }

    if (!form.password) {
      nextErrors.password = t('register.errPasswordRequired');
    } else if (form.password.length < 8) {
      nextErrors.password = t('register.errPasswordShort');
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = t('register.errConfirmRequired');
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = t('register.errPasswordsDontMatch');
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
    if (!agreeLegal) {
      setSubmitError(t('register.errAgreeRequired'));
      return;
    }

    window.location.assign(getProviderAuthUrl(provider));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    if (!agreeLegal) {
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

      trackRegistrationConversion();

      navigate(result?.redirectUrl || getPostRegisterRedirect());
    } catch (error) {
      setSubmitError(error.message || t('register.errGeneral'));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title={t('register.title')}
      subtitle={t('register.subtitle')}
    >
      <div className="space-y-6 sm:space-y-8">
        <SocialProviderButton icon={FcGoogle} label="Continue with Google" onClick={() => handleProviderClick("google")}/>

        <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
          <div className="h-px flex-1 bg-border"/>
          <span>{t('register.orEmail')}</span>
          <div className="h-px flex-1 bg-border"/>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <AuthField
            id="register-name"
            label={t('register.name')}
            type="text"
            autoComplete="name"
            placeholder={t('register.namePlaceholder')}
            value={form.name}
            onChange={updateField("name")}
            error={errors.name}
          />

          <AuthField
            id="register-email"
            label={t('register.email')}
            type="email"
            autoComplete="email"
            placeholder={t('register.emailPlaceholder')}
            value={form.email}
            onChange={updateField("email")}
            error={errors.email}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <AuthField
              id="register-password"
              label={t('register.password')}
              type="password"
              autoComplete="new-password"
              placeholder={t('register.passwordPlaceholder')}
              value={form.password}
              onChange={updateField("password")}
              error={errors.password}
            />

            <AuthField
              id="register-confirm-password"
              label={t('register.confirmPassword')}
              type="password"
              autoComplete="new-password"
              placeholder={t('register.confirmPasswordPlaceholder')}
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              error={errors.confirmPassword}
            />
          </div>

          <div className="flex items-start gap-3 mt-1 select-none">
            <input
              id="agree-legal"
              type="checkbox"
              checked={agreeLegal}
              onChange={(e) => setAgreeLegal(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-border text-brand-purple focus:ring-brand-purple/30 accent-brand-purple cursor-pointer"
            />
            <label htmlFor="agree-legal" className="text-xs text-muted-foreground leading-normal cursor-pointer text-left mt-[4px]">
              {t('register.agreeLabel')}{' '}
              <a
                href="https://kwikme.nu/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-purple font-semibold hover:underline"
              >
                {t('register.termsLink')}
              </a>{' '}
              {t('register.andWord')}{' '}
              <a
                href="https://kwikme.nu/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-purple font-semibold hover:underline"
              >
                {t('register.privacyLink')}
              </a>
            </label>
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-destructive/15 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending || !agreeLegal}
            className={`w-full flex items-center justify-center ${primaryActionButtonClasses} disabled:translate-y-0 disabled:opacity-60`}
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin"/> : t('register.btnSubmit')}
          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground sm:text-sm">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-purple transition-colors hover:text-brand-purple/80">
            {t('register.loginLink')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
