import { useEffect, useState } from 'react';
import {
  Mail,
  Plus,
  Trash2,
  Play,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Sliders,
  ClipboardList,
  BarChart3,
  ExternalLink,
  Ban,
  Send,
} from 'lucide-react';
import { PageHeader } from '../components/admin/PageHeader';
import { StatCard } from '../components/admin/StatCard';
import { StatusBadge } from '../components/admin/StatusBadge';
import { DataTable } from '../components/admin/DataTable';
import { Button } from '../components/ui/Button';
import {
  fetchCampaignSteps,
  createCampaignStep,
  updateCampaignStep,
  deleteCampaignStep,
  fetchCampaignLogs,
  sendCampaignEmailNow,
  cancelCampaignEmail,
} from '../lib/adminApi';
import { formatDateTime } from '../lib/formatters';

const CUSTOMER_DASHBOARD_URL = (import.meta.env.VITE_CUSTOMER_DASHBOARD_URL || 'https://app.kwikme.nu').replace(/\/$/, '');

const EmailCampaignsPage = () => {
  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'logs' | 'stats'
  const [steps, setSteps] = useState([]);
  const [logs, setLogs] = useState({ items: [], total: 0, stats: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Logs search/filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [logsPage, setLogsPage] = useState(0);
  const limit = 25;

  // Editing state
  const [selectedStep, setSelectedStep] = useState(null);
  const [isNewStep, setIsNewStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [stepNumber, setStepNumber] = useState(1);
  const [stepName, setStepName] = useState('');
  const [delayHours, setDelayHours] = useState(0);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [conditionRule, setConditionRule] = useState('always');
  const [isActive, setIsActive] = useState(true);

  // Load steps
  const loadSteps = () => {
    setIsLoading(true);
    setError('');
    fetchCampaignSteps()
      .then((data) => {
        setSteps(data);
        if (data.length > 0 && !selectedStep) {
          selectStep(data[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  // Load logs
  const loadLogs = () => {
    setError('');
    fetchCampaignLogs(searchQuery, statusFilter, logsPage * limit, limit)
      .then(setLogs)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (activeTab === 'steps') {
      loadSteps();
    } else {
      loadLogs();
    }
  }, [activeTab, logsPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLogsPage(0);
    loadLogs();
  };

  const selectStep = (step) => {
    setSelectedStep(step);
    setIsNewStep(false);
    setStepNumber(step.step_number);
    setStepName(step.name);
    setDelayHours(step.delay_hours);
    setSubject(step.subject);
    setBodyHtml(step.body_html);
    setConditionRule(step.condition_rule);
    setIsActive(step.is_active);
  };

  const startNewStep = () => {
    const nextStepNumber = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
    setSelectedStep(null);
    setIsNewStep(true);
    setStepNumber(nextStepNumber);
    setStepName(`Новый шаг ${nextStepNumber}`);
    setDelayHours(24);
    setSubject('Тема письма');
    setBodyHtml(`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
  <h2 style="color: #6d67eb;">Привет, {{name}}!</h2>
  <p>Это шаблон вашего нового письма. Вы можете использовать макросы {{name}} и {{dashboard_url}}.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboard_url}}" style="background-color: #6d67eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Кнопка действия</a>
  </div>
</div>`);
    setConditionRule('always');
    setIsActive(true);
  };

  const handleSaveStep = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      step_number: stepNumber,
      name: stepName,
      delay_hours: delayHours,
      subject,
      body_html: bodyHtml,
      condition_rule: conditionRule,
      is_active: isActive,
    };

    try {
      if (isNewStep) {
        const created = await createCampaignStep(payload);
        loadSteps();
        selectStep(created);
      } else {
        const updated = await updateCampaignStep(selectedStep.id, payload);
        loadSteps();
        selectStep(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStep = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот шаг? Это отменит все запланированные письма для этого шага.')) {
      return;
    }
    setError('');
    try {
      await deleteCampaignStep(id);
      setSelectedStep(null);
      loadSteps();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveStep = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    setError('');
    const currentStep = steps[index];
    const targetStep = steps[targetIndex];

    try {
      // Swap step numbers
      const tempNumber = currentStep.step_number;
      await updateCampaignStep(currentStep.id, {
        step_number: targetStep.step_number,
        name: currentStep.name,
        delay_hours: currentStep.delay_hours,
        subject: currentStep.subject,
        body_html: currentStep.body_html,
        condition_rule: currentStep.condition_rule,
        is_active: currentStep.is_active,
      });

      await updateCampaignStep(targetStep.id, {
        step_number: tempNumber,
        name: targetStep.name,
        delay_hours: targetStep.delay_hours,
        subject: targetStep.subject,
        body_html: targetStep.body_html,
        condition_rule: targetStep.condition_rule,
        is_active: targetStep.is_active,
      });

      loadSteps();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendNow = async (id) => {
    if (!window.confirm('Отправить это письмо прямо сейчас?')) {
      return;
    }
    setError('');
    try {
      await sendCampaignEmailNow(id);
      loadLogs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEmail = async (id) => {
    if (!window.confirm('Отменить отправку этого письма?')) {
      return;
    }
    setError('');
    try {
      await cancelCampaignEmail(id);
      loadLogs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Compile preview body html
  const compilePreview = (html) => {
    if (!html) return '';
    return html
      .replace(/{{name}}/g, 'Константин')
      .replace(/{{dashboard_url}}/g, CUSTOMER_DASHBOARD_URL);
  };

  return (
    <>
      <PageHeader
        title="Автоматические рассылки"
        description="Настройка цепочки писем для онбординга новых клиентов и лог отправки."
        actions={
          activeTab === 'steps' && (
            <Button onClick={startNewStep}>
              <Plus size={16} />
              Добавить шаг рассылки
            </Button>
          )
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-border/70 gap-6">
        <button
          onClick={() => setActiveTab('steps')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'steps'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders size={16} />
          Шаги сценария ({steps.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList size={16} />
          История и расписание ({logs.total || 0})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'stats'
              ? 'border-brand-purple text-brand-purple'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 size={16} />
          Статистика Unisender Go
        </button>
      </div>

      {/* Tab: Steps */}
      {activeTab === 'steps' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Steps List (3 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Шаги цепочки</h3>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-purple" /></div>
            ) : steps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                Шаги рассылки еще не созданы. Нажмите "Добавить шаг", чтобы начать.
              </div>
            ) : (
              <div className="space-y-2.5">
                {steps.map((step, index) => {
                  const isSelected = selectedStep?.id === step.id;
                  return (
                    <div
                      key={step.id}
                      onClick={() => selectStep(step)}
                      className={`relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-purple bg-brand-purple/5 shadow-sm shadow-brand-purple/5'
                          : 'border-border/70 bg-card hover:bg-secondary/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded">
                            {step.step_number}
                          </span>
                          <h4 className="font-bold text-sm truncate text-foreground">{step.name}</h4>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Задержка: <span className="font-semibold text-foreground">{step.delay_hours} ч.</span>
                          {step.condition_rule !== 'always' && (
                            <span className="ml-2 px-1 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px]">
                              {step.condition_rule}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={index === 0}
                          onClick={() => handleMoveStep(index, -1)}
                        >
                          <ChevronUp size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={index === steps.length - 1}
                          onClick={() => handleMoveStep(index, 1)}
                        >
                          <ChevronDown size={14} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step Editor & Preview (8 cols) */}
          <div className="lg:col-span-8">
            {(selectedStep || isNewStep) ? (
              <div className="space-y-6">
                {/* Editor Card */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-lg font-black text-foreground mb-4">
                    {isNewStep ? 'Создать новый шаг' : `Редактировать шаг #${stepNumber}`}
                  </h3>
                  <form onSubmit={handleSaveStep} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Название шага
                        </label>
                        <input
                          type="text"
                          required
                          value={stepName}
                          onChange={(e) => setStepName(e.target.value)}
                          placeholder="Welcome email"
                          className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Задержка (в часах)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={delayHours}
                            onChange={(e) => setDelayHours(parseInt(e.target.value) || 0)}
                            className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Активно
                          </label>
                          <select
                            value={isActive ? 'true' : 'false'}
                            onChange={(e) => setIsActive(e.target.value === 'true')}
                            className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                          >
                            <option value="true">Да</option>
                            <option value="false">Нет</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Тема письма (Subject)
                        </label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Добро пожаловать в сервис!"
                          className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Условие отправки (Skip Condition)
                        </label>
                        <select
                          value={conditionRule}
                          onChange={(e) => setConditionRule(e.target.value)}
                          className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                        >
                          <option value="always">Всегда отправлять (без условий)</option>
                          <option value="no_venue">Только если НЕ создано заведение</option>
                          <option value="no_menu">Только если НЕ создано ни одного меню</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          HTML-шаблон письма
                        </label>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Поддерживается: {"{{name}}"}, {"{{dashboard_url}}"}
                        </span>
                      </div>
                      <textarea
                        required
                        rows="12"
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        placeholder="<h1>Привет, {{name}}!</h1>..."
                        className="w-full px-3.5 py-2 font-mono border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsNewStep(false);
                          if (steps.length > 0) selectStep(steps[0]);
                        }}
                      >
                        Отмена
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Eye size={14} />
                    Предпросмотр письма (Иван)
                  </h4>
                  <div className="rounded-xl border border-border bg-zinc-50 dark:bg-zinc-950 p-2 overflow-hidden">
                    <iframe
                      title="Email live preview"
                      srcDoc={compilePreview(bodyHtml)}
                      className="w-full min-h-[350px] border-0 bg-white"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                Выберите шаг слева или нажмите "Добавить шаг", чтобы открыть редактор.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Stats quick overview */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Ожидают" value={logs.stats?.pending} />
            <StatCard label="Отправлено" value={logs.stats?.sent} accent="bg-green-50 text-green-600" />
            <StatCard label="Ошибка" value={logs.stats?.failed} accent="bg-red-50 text-red-600" />
            <StatCard label="Пропущено" value={logs.stats?.skipped} accent="bg-gray-50 text-gray-500" />
            <StatCard label="Доставлено" value={logs.stats?.delivery_delivered} accent="bg-blue-50 text-blue-600" />
            <StatCard label="Открыто" value={logs.stats?.delivery_opened} accent="bg-purple-50 text-purple-600" />
          </div>

          {/* Search Filters */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 bg-card border border-border/70 p-4 rounded-2xl shadow-sm">
            <input
              type="text"
              placeholder="Поиск по email пользователя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple text-foreground"
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидает отправки</option>
              <option value="sent">Отправлено</option>
              <option value="failed">Ошибка</option>
              <option value="skipped">Пропущено по условию</option>
              <option value="cancelled">Отменено</option>
            </select>
            <Button type="submit">Найти</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setLogsPage(0);
                loadLogs();
              }}
            >
              <RefreshCw size={14} />
            </Button>
          </form>

          {/* Table */}
          <DataTable
            rows={logs.items || []}
            columns={[
              {
                key: 'user_email',
                label: 'Пользователь',
                render: (row) => (
                  <div>
                    <span className="font-bold text-foreground">{row.user_name || 'Без имени'}</span>
                    <span className="block text-xs font-semibold text-muted-foreground">{row.user_email}</span>
                  </div>
                ),
              },
              { key: 'step_name', label: 'Шаг рассылки' },
              {
                key: 'scheduled_at',
                label: 'Планируемая дата',
                render: (row) => formatDateTime(row.scheduled_at),
              },
              {
                key: 'sent_at',
                label: 'Дата отправки',
                render: (row) => (row.sent_at ? formatDateTime(row.sent_at) : '—'),
              },
              {
                key: 'status',
                label: 'Отправка',
                render: (row) => <StatusBadge value={row.status} />,
              },
              {
                key: 'delivery_status',
                label: 'Доставка',
                render: (row) => {
                  let badgeVariant = 'default';
                  let label = row.delivery_status;
                  
                  if (row.delivery_status === 'opened') {
                    badgeVariant = 'success';
                    label = 'Открыто';
                  } else if (row.delivery_status === 'delivered') {
                    badgeVariant = 'info';
                    label = 'Доставлено';
                  } else if (row.delivery_status === 'bounce') {
                    badgeVariant = 'danger';
                    label = 'Bounce';
                  } else if (row.delivery_status === 'spam') {
                    badgeVariant = 'danger';
                    label = 'Спам';
                  } else if (row.delivery_status === 'unsubscribed') {
                    badgeVariant = 'warning';
                    label = 'Отписка';
                  } else {
                    label = '—';
                  }

                  return label === '—' ? '—' : <StatusBadge value={row.delivery_status} label={label} />;
                },
              },
              {
                key: 'error_message',
                label: 'Ошибка',
                render: (row) => (
                  <span className="text-xs text-red-500 font-semibold max-w-[200px] block truncate" title={row.error_message}>
                    {row.error_message || '—'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Действия',
                render: (row) => (
                  <div className="flex items-center gap-1.5">
                    {row.status === 'pending' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleCancelEmail(row.id)}
                      >
                        <Ban size={12} />
                        Отменить
                      </Button>
                    )}
                    {row.status !== 'sent' && row.status !== 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 border-brand-purple text-brand-purple hover:bg-brand-purple/5"
                        onClick={() => handleSendNow(row.id)}
                      >
                        <Send size={12} />
                        Отправить сейчас
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs font-bold text-muted-foreground">
              Показано {logs.items?.length || 0} из {logs.total || 0} логов
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={logsPage === 0}
                onClick={() => setLogsPage((p) => p - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(logsPage + 1) * limit >= logs.total}
                onClick={() => setLogsPage((p) => p + 1)}
              >
                Вперед
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground mb-1">Конверсия рассылок (Unisender Go Webhooks)</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Конверсия рассчитывается на основе успешно отправленных писем. Подключите публичный адрес вебхука в личном кабинете Unisender Go: <code>/api/webhooks/unisender</code>
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Delivery Rate */}
              <div className="flex flex-col p-5 rounded-2xl bg-secondary/25 border border-border/70">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Доставляемость (Delivery Rate)</span>
                <span className="mt-2 text-3xl font-black text-foreground">
                  {logs.stats?.sent > 0
                    ? ((logs.stats.delivery_delivered + logs.stats.delivery_opened) / logs.stats.sent * 100).toFixed(1)
                    : '0.0'}%
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Доставлено: {logs.stats.delivery_delivered + logs.stats.delivery_opened} из {logs.stats.sent}
                </p>
              </div>

              {/* Open Rate */}
              <div className="flex flex-col p-5 rounded-2xl bg-secondary/25 border border-border/70">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Открытия (Open Rate)</span>
                <span className="mt-2 text-3xl font-black text-foreground">
                  {logs.stats?.sent > 0
                    ? (logs.stats.delivery_opened / logs.stats.sent * 100).toFixed(1)
                    : '0.0'}%
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Прочли: {logs.stats.delivery_opened} из {logs.stats.sent}
                </p>
              </div>

              {/* Bounce Rate */}
              <div className="flex flex-col p-5 rounded-2xl bg-secondary/25 border border-border/70">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Отказы (Bounce Rate)</span>
                <span className="mt-2 text-3xl font-black text-red-600">
                  {logs.stats?.sent > 0
                    ? (logs.stats.delivery_bounce / logs.stats.sent * 100).toFixed(1)
                    : '0.0'}%
                </span>
                <p className="mt-1 text-xs text-muted-foreground text-red-500 font-semibold">
                  Не доставлено: {logs.stats.delivery_bounce}
                </p>
              </div>

              {/* Spam Rate */}
              <div className="flex flex-col p-5 rounded-2xl bg-secondary/25 border border-border/70">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Жалобы на спам</span>
                <span className="mt-2 text-3xl font-black text-amber-600">
                  {logs.stats?.sent > 0
                    ? (logs.stats.delivery_spam / logs.stats.sent * 100).toFixed(1)
                    : '0.0'}%
                </span>
                <p className="mt-1 text-xs text-muted-foreground text-amber-600 font-semibold">
                  Жалоб: {logs.stats.delivery_spam}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailCampaignsPage;
