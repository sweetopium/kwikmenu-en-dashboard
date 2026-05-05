import { useState } from 'react';
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

const AccountPage = () => {
  const [profile, setProfile] = useState({
    name: 'Татьяна Васильева',
    email: 'tatyana@kwikmenu.app',
    phone: '+7 925 323 29 46',
  });
  const [notifications, setNotifications] = useState({
    productUpdates: true,
    paymentAlerts: true,
    weeklyDigest: false,
  });

  return (
    <div className="mx-auto space-y-6">
      <SettingsPageHeader
        title="Аккаунт"
        description="Управляйте личными данными и уведомлениями"
        actionLabel={null}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-6">
        <div className="space-y-6">
          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Профиль владельца</h2>
                <p className="text-sm text-muted-foreground">Контакты для входа, уведомлений и связи с поддержкой.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Имя и фамилия</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className={formFieldClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className={formFieldClasses}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Телефон</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className={formFieldClasses}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button className={`${primaryActionButtonClasses} px-5`}>
                <Save size={18} className="mr-2" />
                Сохранить
              </Button>
            </div>
          </section>

          <section className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Уведомления</h2>
                <p className="text-sm text-muted-foreground">Выберите, какие письма и системные уведомления вы хотите получать.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['productUpdates', 'Новости продукта и новые функции'],
                ['paymentAlerts', 'Счета, платежи и продление тарифа'],
                ['weeklyDigest', 'Еженедельная сводка по просмотрам меню'],
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
                Сохранить
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
                <h2 className="text-lg font-bold text-foreground">Пароль</h2>
                <p className="text-sm text-muted-foreground">Обновите пароль для входа в кабинет.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Текущий пароль</Label>
                <Input type="password" className={formFieldClasses} value="password123" readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Новый пароль</Label>
                <Input type="password" className={formFieldClasses} placeholder="Минимум 8 символов" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Повторите новый пароль</Label>
                <Input type="password" className={formFieldClasses} placeholder="Повторите пароль" />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button variant="outline" className={`${secondaryActionButtonClasses} px-5`}>
                Обновить пароль
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
