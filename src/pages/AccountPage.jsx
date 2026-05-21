import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, LockKeyhole, Save, UserRound } from 'lucide-react';

import { Button } from "../components/ui/button";
import SettingsPageHeader from "../components/settings/SettingsPageHeader";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  formFieldClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
} from "../lib/uiStyles";
import {
  changeCurrentUserPassword,
  fetchCurrentUser,
  updateCurrentUserProfile,
} from "../lib/sessionApi";

const AccountPage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    hasPassword: true,
    authProviders: [],
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    productUpdates: true,
    paymentAlerts: true,
    weeklyDigest: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          hasPassword: Boolean(user.hasPassword),
          authProviders: Array.isArray(user.authProviders) ? user.authProviders : [],
        });
      })
      .catch((nextError) => {
        setError(nextError.message || t('account.errors.loadFailed', 'Не удалось загрузить аккаунт.'));
      })
      .finally(() => setIsLoading(false));
  }, [t]);

  const providerOnly = !profile.hasPassword;
  const linkedProvidersLabel = useMemo(() => {
    const externalProviders = profile.authProviders.filter((provider) => provider !== 'password');
    if (!externalProviders.length) {
      return t('account.password.providers.external', 'через внешний провайдер');
    }

    const providerLabels = {
      google: 'Google',
      yandex: t('account.password.providers.yandex', 'Яндекс'),
      mailru: t('account.password.providers.mailru', 'Mail.ru'),
    };

    return externalProviders.map((provider) => providerLabels[provider] || provider).join(', ');
  }, [profile.authProviders, t]);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setError('');
    try {
      const user = await updateCurrentUserProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || null,
      });

      setProfile((current) => ({
        ...current,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        hasPassword: Boolean(user.hasPassword),
        authProviders: Array.isArray(user.authProviders) ? user.authProviders : current.authProviders,
      }));
    } catch (nextError) {
      setError(nextError.message || t('account.errors.saveFailed', 'Не удалось сохранить профиль.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (providerOnly) {
      return;
    }

    setSavingPassword(true);
    setError('');
    try {
      const user = await changeCurrentUserPassword(passwordForm);
      setProfile((current) => ({
        ...current,
        hasPassword: Boolean(user.hasPassword),
        authProviders: Array.isArray(user.authProviders) ? user.authProviders : current.authProviders,
      }));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (nextError) {
      setError(nextError.message || t('account.errors.passwordFailed', 'Не удалось обновить пароль.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6 sm:space-y-8">
        <SettingsPageHeader
          title={t('account.title', 'Аккаунт')}
          description={t('account.subtitle', 'Управляйте личными данными и уведомлениями')}
          actionLabel={null}
        />
        <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-8 text-sm text-muted-foreground">
          {t('account.loading', 'Загружаем настройки аккаунта...')}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title={t('account.title', 'Аккаунт')}
        description={t('account.subtitle', 'Управляйте личными данными и уведомлениями')}
        actionLabel={null}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-6">
        <div className="space-y-6">
          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('account.profile.title', 'Профиль владельца')}</h2>
                <p className="text-sm text-muted-foreground">{t('account.profile.subtitle', 'Контакты для входа, уведомлений и связи с поддержкой.')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.profile.name', 'Имя и фамилия')}</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className={formFieldClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.profile.email', 'Email')}</Label>
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className={formFieldClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.profile.phone', 'Телефон')}</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className={formFieldClasses}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button onClick={handleProfileSave} disabled={savingProfile} className={`${primaryActionButtonClasses} px-5`}>
                <Save size={18} className="mr-2" />
                {savingProfile ? t('common.saving', 'Сохраняем...') : t('common.save', 'Сохранить')}
              </Button>
            </div>
          </section>

          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('account.notifications.title', 'Уведомления')}</h2>
                <p className="text-sm text-muted-foreground">{t('account.notifications.subtitle', 'Выберите, какие письма и системные уведомления вы хотите получать.')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['productUpdates', t('account.notifications.productUpdates', 'Новости продукта и новые функции')],
                ['paymentAlerts', t('account.notifications.paymentAlerts', 'Счета, платежи и продление тарифа')],
                ['weeklyDigest', t('account.notifications.weeklyDigest', 'Еженедельная сводка по просмотрам меню')],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/15 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                  </div>
                  <Switch
                    checked={notifications[key]}
                    onCheckedChange={(value) => setNotifications({ ...notifications, [key]: value })}
                    className="data-[state=checked]:bg-brand-purple"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button className={`${primaryActionButtonClasses} px-5`}>
                <Save size={18} className="mr-2" />
                {t('common.save', 'Сохранить')}
              </Button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {providerOnly ? t('account.password.authMethod', 'Способ входа') : t('account.password.title', 'Пароль')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {providerOnly
                    ? t('account.password.externalLogin', 'Вы входите через {{provider}}. Смена пароля недоступна.', { provider: linkedProvidersLabel })
                    : t('account.password.updateHint', 'Обновите пароль для входа в кабинет.')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.password.current', 'Текущий пароль')}</Label>
                <Input
                  type="password"
                  className={formFieldClasses}
                  value={providerOnly ? t('account.password.placeholders.unavailable', 'Недоступно') : passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  readOnly={providerOnly}
                  disabled={providerOnly}
                  placeholder={providerOnly ? t('account.password.placeholders.unavailableExternal', 'Недоступно для внешнего входа') : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.password.new', 'Новый пароль')}</Label>
                <Input
                  type="password"
                  className={formFieldClasses}
                  value={providerOnly ? t('account.password.placeholders.unavailable', 'Недоступно') : passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  readOnly={providerOnly}
                  disabled={providerOnly}
                  placeholder={providerOnly ? t('account.password.placeholders.changeUnavailable', 'Смена пароля недоступна') : t('account.password.placeholders.minChars', 'Минимум 8 символов')}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.password.confirm', 'Повторите новый пароль')}</Label>
                <Input
                  type="password"
                  className={formFieldClasses}
                  value={providerOnly ? t('account.password.placeholders.unavailable', 'Недоступно') : passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  readOnly={providerOnly}
                  disabled={providerOnly}
                  placeholder={providerOnly ? t('account.password.placeholders.changeUnavailable', 'Смена пароля недоступна') : t('account.password.placeholders.repeat', 'Повторите пароль')}
                />
              </div>
            </div>

            {providerOnly ? (
              <p className="text-sm text-muted-foreground">
                {t('account.password.warningExternal', 'Смена пароля недоступна, потому что этот аккаунт использует вход через {{provider}}.', { provider: linkedProvidersLabel })}
              </p>
            ) : null}

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button
                variant="outline"
                onClick={handlePasswordSave}
                disabled={providerOnly || savingPassword}
                className={`${secondaryActionButtonClasses} px-5`}
              >
                {savingPassword ? t('account.password.btnUpdating', 'Обновляем...') : t('account.password.btnUpdate', 'Обновить пароль')}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
