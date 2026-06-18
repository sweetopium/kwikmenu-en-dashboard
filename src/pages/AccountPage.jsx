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
        setError(nextError.message || t('account.errors.loadFailed', 'Could not load account.'));
      })
      .finally(() => setIsLoading(false));
  }, [t]);

  const providerOnly = !profile.hasPassword;
  const linkedProvidersLabel = useMemo(() => {
    const externalProviders = profile.authProviders.filter((provider) => provider !== 'password');
    if (!externalProviders.length) {
      return t('account.password.providers.external', 'via external provider');
    }

    const providerLabels = {
      google: 'Google',
      yandex: t('account.password.providers.yandex', 'Yandex'),
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
      setError(nextError.message || t('account.errors.saveFailed', 'Could not save profile.'));
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
      setError(nextError.message || t('account.errors.passwordFailed', 'Could not update password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6 sm:space-y-8">
        <SettingsPageHeader
          title={t('account.title', 'Account')}
          description={t('account.subtitle', 'Manage personal details and notifications')}
          actionLabel={null}
        />
        <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-8 text-sm text-muted-foreground">
          {t('account.loading', 'Loading account settings...')}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <SettingsPageHeader
        title={t('account.title', 'Account')}
        description={t('account.subtitle', 'Manage personal details and notifications')}
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
                <h2 className="text-lg font-bold text-foreground">{t('account.profile.title', 'Owner profile')}</h2>
                <p className="text-sm text-muted-foreground">{t('account.profile.subtitle', 'Contacts for login, notifications, and support.')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.profile.name', 'Full name')}</Label>
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
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.profile.phone', 'Phone')}</Label>
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
                {savingProfile ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            </div>
          </section>

          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('account.notifications.title', 'Notifications')}</h2>
                <p className="text-sm text-muted-foreground">{t('account.notifications.subtitle', 'Choose which emails and system notifications you want to receive.')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['productUpdates', t('account.notifications.productUpdates', 'Product updates and new features')],
                ['paymentAlerts', t('account.notifications.paymentAlerts', 'Invoices, payments, and plan renewals')],
                ['weeklyDigest', t('account.notifications.weeklyDigest', 'Weekly menu views digest')],
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
                {t('common.save', 'Save')}
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
                  {providerOnly ? t('account.password.authMethod', 'Login method') : t('account.password.title', 'Password')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {providerOnly
                    ? t('account.password.externalLogin', 'You sign in via {{provider}}. Password changes are unavailable.', { provider: linkedProvidersLabel })
                    : t('account.password.updateHint', 'Update the password used to sign in.')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.password.current', 'Current password')}</Label>
                <Input
                  type="password"
                  className={formFieldClasses}
                  value={providerOnly ? t('account.password.placeholders.unavailable', 'Unavailable') : passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  readOnly={providerOnly}
                  disabled={providerOnly}
                  placeholder={providerOnly ? t('account.password.placeholders.unavailableExternal', 'Unavailable for external login') : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.password.new', 'New password')}</Label>
                <Input
                  type="password"
                  className={formFieldClasses}
                  value={providerOnly ? t('account.password.placeholders.unavailable', 'Unavailable') : passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  readOnly={providerOnly}
                  disabled={providerOnly}
                  placeholder={providerOnly ? t('account.password.placeholders.changeUnavailable', 'Changing password is unavailable') : t('account.password.placeholders.minChars', 'Minimum 8 characters')}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('account.password.confirm', 'Confirm new password')}</Label>
                <Input
                  type="password"
                  className={formFieldClasses}
                  value={providerOnly ? t('account.password.placeholders.unavailable', 'Unavailable') : passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  readOnly={providerOnly}
                  disabled={providerOnly}
                  placeholder={providerOnly ? t('account.password.placeholders.changeUnavailable', 'Changing password is unavailable') : t('account.password.placeholders.repeat', 'Repeat password')}
                />
              </div>
            </div>

            {providerOnly ? (
              <p className="text-sm text-muted-foreground">
                {t('account.password.warningExternal', 'Password changes are unavailable because this account uses {{provider}} login.', { provider: linkedProvidersLabel })}
              </p>
            ) : null}

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button
                variant="outline"
                onClick={handlePasswordSave}
                disabled={providerOnly || savingPassword}
                className={`${secondaryActionButtonClasses} px-5`}
              >
                {savingPassword ? t('account.password.btnUpdating', 'Updating...') : t('account.password.btnUpdate', 'Update password')}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
