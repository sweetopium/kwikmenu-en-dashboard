import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import MenuSourcePicker from "../onboarding/MenuSourcePicker";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  formFieldClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
} from "../../lib/uiStyles";
import { saveImportedMenuToStorage } from "../../lib/importedMenuStorage";
import { pollMenuImportStatus, submitMenuImport } from "../../lib/menuImport";

const STATUS_META = {
  uploading: {
    title: 'Загружаем исходники',
    description: 'Создаем import job и отправляем файлы в backend.',
  },
  processing: {
    title: 'Распознаем структуру меню',
    description: 'Бэк обрабатывает документы, вызывает parser и валидирует итоговую схему.',
  },
};

const POLL_INTERVAL_MS = 1500;
const IMPORT_POLL_TIMEOUT_MS = 60_000;

const delayWithAbort = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, ms);

    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', handleAbort, { once: true });
  });

const DEFAULT_IMPORT_ACTIONS = [
  'Проверьте, что PDF или фотографии четкие, не обрезаны и не повернуты.',
  'Если меню большое, загрузите его частями: например, напитки и еду отдельно.',
  'Попробуйте загрузить более легкий PDF или вставить прямую ссылку на PDF-файл меню.',
  'Если ошибка повторяется, отправьте исходный файл в поддержку и опишите, что именно не удалось разобрать.',
];

const LONG_RUNNING_META = {
  title: 'Импорт занимает больше обычного',
  description: 'Мы продолжаем разбор меню на сервере. Можно перейти в кабинет и проверить результат позже, либо снова начать ожидание здесь.',
};

const buildImportIssue = ({ kind, message }) => {
  if (kind === 'timed_out') {
    return {
      title: 'Импорт остановлен по таймауту',
      message: message || 'Backend остановил обработку меню по лимиту времени.',
      actions: DEFAULT_IMPORT_ACTIONS,
    };
  }

  return {
    title: 'Возникла проблема с импортом меню',
    message: message || 'Мы не смогли обработать исходный файл и не создали черновик меню.',
    actions: DEFAULT_IMPORT_ACTIONS,
  };
};

const StageItem = ({ isActive, isDone, title, description }) => (
  <div className={`rounded-2xl border p-4 transition-colors ${
    isActive
      ? 'border-brand-purple/30 bg-brand-purple/5'
      : isDone
        ? 'border-green-500/20 bg-green-500/5'
        : 'border-border/60 bg-secondary/10'
  }`}>
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isDone
          ? 'bg-green-500 text-white'
          : isActive
            ? 'bg-brand-purple text-white'
            : 'bg-secondary text-muted-foreground'
      }`}>
        {isDone ? <CheckCircle2 size={16} /> : <LoaderCircle size={16} className={isActive ? 'animate-spin' : ''} />}
      </div>

      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const MenuImportFlow = ({
  context = {},
  introTitle,
  introDescription,
  submitLabel = 'Распознать меню',
  successTitle = 'Меню распознано',
  successDescription = 'Проверьте результат и переходите к редактированию.',
  successPrimaryLabel = 'Открыть редактор',
  successPrimaryTo = '/dashboard/menu/main',
  successSecondaryLabel = 'Загрузить еще одно меню',
  successSecondaryTo,
  onStageChange,
  venueId = null,
}) => {
  const [stage, setStage] = useState('idle');
  const [menuSource, setMenuSource] = useState('file');
  const [files, setFiles] = useState([]);
  const [menuLink, setMenuLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importIssue, setImportIssue] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [backgroundJobId, setBackgroundJobId] = useState(null);
  const [isResumingWait, setIsResumingWait] = useState(false);
  const activeRequestRef = useRef(null);

  useEffect(() => {
    onStageChange?.(stage);
  }, [onStageChange, stage]);

  useEffect(() => () => {
    activeRequestRef.current?.abort();
  }, []);

  const resetFlow = () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setStage('idle');
    setErrorMessage('');
    setImportIssue(null);
    setResultPreview(null);
    setBackgroundJobId(null);
    setIsResumingWait(false);
    setFiles([]);
    setMenuLink('');
    setMenuSource('file');
  };

  const resolveImportCompletion = async ({ jobId, signal }) => {
    const completion = await waitForImportCompletion(jobId, {
      signal,
      timeoutMs: IMPORT_POLL_TIMEOUT_MS,
    });

    if (completion.status === 'deferred') {
      setBackgroundJobId(jobId);
      setStage('background');
      return;
    }

    const finalJob = completion.job;
    if (finalJob.status === 'failed' || finalJob.status === 'timed_out') {
      const importError = new Error(finalJob.error || 'Не удалось обработать меню.');
      importError.importIssue = buildImportIssue({
        kind: finalJob.status === 'timed_out' ? 'timed_out' : 'failed',
        message: finalJob.error,
      });
      throw importError;
    }

    const result = finalJob.result;
    if (!result.menuId) {
      saveImportedMenuToStorage(result.menu);
    }
    setResultPreview({
      menuId: result.menuId,
      sourceLabel: result.sourceSummary.length > 0
        ? result.sourceSummary.map((source) => source.name).join(', ')
        : (menuSource === 'link' ? menuLink.trim() : 'Без названия'),
      detectedCategories: result.categoryCount,
      detectedItems: result.itemCount,
      documentCount: result.documentCount,
      usedFallback: result.usedFallback,
      warnings: result.warnings || [],
    });
    setBackgroundJobId(null);
    setStage('success');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (menuSource === 'file' && files.length === 0) {
      setErrorMessage('Добавьте хотя бы один PDF или набор фотографий меню.');
      setStage('error');
      return;
    }

    if (menuSource === 'link' && !menuLink.trim()) {
      setErrorMessage('Укажите прямую ссылку на PDF-файл меню, чтобы отправить его в обработку.');
      setStage('error');
      return;
    }

    setErrorMessage('');
    setImportIssue(null);
    setBackgroundJobId(null);
    setStage('uploading');

    try {
      activeRequestRef.current?.abort();
      const requestController = new AbortController();
      activeRequestRef.current = requestController;
      const submission = await submitMenuImport({
        menuSource,
        files,
        menuLink,
        venueId,
        context,
        signal: requestController.signal,
      });

      setStage('processing');
      await resolveImportCompletion({
        jobId: submission.jobId,
        signal: requestController.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      const issue = error?.importIssue || buildImportIssue({ kind: 'failed', message: error instanceof Error ? error.message : '' });
      setImportIssue(issue);
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отправить меню в обработку. Попробуйте еще раз.');
      setStage('error');
    } finally {
      activeRequestRef.current = null;
    }
  };

  const handleResumeWaiting = async () => {
    if (!backgroundJobId) {
      return;
    }

    try {
      setIsResumingWait(true);
      setErrorMessage('');
      setImportIssue(null);
      setStage('processing');

      activeRequestRef.current?.abort();
      const requestController = new AbortController();
      activeRequestRef.current = requestController;

      await resolveImportCompletion({
        jobId: backgroundJobId,
        signal: requestController.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      const issue = error?.importIssue || buildImportIssue({ kind: 'failed', message: error instanceof Error ? error.message : '' });
      setImportIssue(issue);
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось получить статус импорта. Попробуйте еще раз.');
      setStage('error');
    } finally {
      activeRequestRef.current = null;
      setIsResumingWait(false);
    }
  };

  if (stage === 'uploading' || stage === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-10 sm:py-14">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-brand-purple/10 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-brand-purple/20 bg-brand-purple/5">
            <WandSparkles size={32} className="text-brand-purple" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground text-center">
          {STATUS_META[stage].title}
        </h3>
        <p className="mt-2 max-w-md text-center text-sm sm:text-base leading-relaxed text-muted-foreground">
          {STATUS_META[stage].description}
        </p>

        <div className="mt-8 grid w-full max-w-2xl gap-3">
          <StageItem
            isActive={stage === 'uploading'}
            isDone={stage === 'processing'}
            title={STATUS_META.uploading.title}
            description={STATUS_META.uploading.description}
          />
          <StageItem
            isActive={stage === 'processing'}
            isDone={false}
            title={STATUS_META.processing.title}
            description={STATUS_META.processing.description}
          />
        </div>
      </div>
    );
  }

  if (stage === 'success' && resultPreview) {
    const SecondaryActionTag = successSecondaryTo ? Link : 'button';

    return (
      <div className="space-y-6 py-2 sm:py-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {successTitle}
          </h3>
          <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {successDescription}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Источник</p>
            <p className="mt-2 text-sm font-semibold text-foreground break-words">{resultPreview.sourceLabel}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Категории</p>
            <p className="mt-2 text-2xl font-black text-foreground">{resultPreview.detectedCategories}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Позиции</p>
            <p className="mt-2 text-2xl font-black text-foreground">{resultPreview.detectedItems}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-brand-purple" />
            <p className="text-sm leading-relaxed text-brand-purple/90">
              Импорт завершен через backend job. Результат сохранен как черновик меню и готов к открытию в редакторе.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-sm text-muted-foreground">
            Документов обработано: <span className="font-bold text-foreground">{resultPreview.documentCount}</span>
          </div>
          {resultPreview.usedFallback && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700">
              OpenRouter key не настроен, поэтому backend вернул schema-valid scaffold вместо LLM-парсинга.
            </div>
          )}
          {resultPreview.warnings?.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-sm text-muted-foreground">
              {resultPreview.warnings.join(' ')}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={resultPreview.menuId ? `/dashboard/menu/${resultPreview.menuId}` : successPrimaryTo}
            className={`${primaryActionButtonClasses} flex h-11 sm:h-12 w-full items-center justify-center gap-2 px-5`}
          >
            {successPrimaryLabel}
            <ArrowRight size={16} />
          </Link>

          <SecondaryActionTag
            {...(successSecondaryTo ? { to: successSecondaryTo } : { type: 'button', onClick: resetFlow })}
            className={`${secondaryActionButtonClasses} flex h-11 sm:h-12 w-full items-center justify-center px-5`}
          >
            {successSecondaryLabel}
          </SecondaryActionTag>
        </div>
      </div>
    );
  }

  if (stage === 'background') {
    const SecondaryActionTag = successSecondaryTo ? Link : 'button';

    return (
      <div className="space-y-6 py-2 sm:py-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
            <LoaderCircle size={32} className="animate-spin" />
          </div>
          <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {LONG_RUNNING_META.title}
          </h3>
          <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {LONG_RUNNING_META.description}
          </p>
        </div>

        <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4 sm:p-5 text-sm leading-relaxed text-brand-purple/90">
          Импорт не остановлен: backend job все еще обрабатывает документ. Ошибку покажем только если сервер вернет статус `failed` или `timed_out`.
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            onClick={handleResumeWaiting}
            disabled={isResumingWait}
            className={`w-full sm:w-auto sm:min-w-[220px] ${primaryActionButtonClasses}`}
          >
            <span className="flex items-center gap-2">
              <RefreshCw size={16} className={isResumingWait ? 'animate-spin' : ''} />
              {isResumingWait ? 'Проверяем статус...' : 'Продолжить ожидание'}
            </span>
          </Button>

          <SecondaryActionTag
            {...(successSecondaryTo ? { to: successSecondaryTo } : { type: 'button', onClick: resetFlow })}
            className={`${secondaryActionButtonClasses} flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center px-5`}
          >
            {successSecondaryTo ? successSecondaryLabel : 'Закрыть'}
          </SecondaryActionTag>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {introTitle}
        </h3>
        <p className="text-xs sm:text-base leading-relaxed text-muted-foreground">
          {introDescription}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-foreground font-medium ml-1 text-[11px] sm:text-sm">
            Исходник меню <span className="text-red-500">*</span>
          </Label>

          <MenuSourcePicker
            menuSource={menuSource}
            onMenuSourceChange={setMenuSource}
            files={files}
            onFileChange={(event) => setFiles(Array.from(event.target.files || []))}
            menuLink={menuLink}
            onMenuLinkChange={setMenuLink}
            inputClassName={formFieldClasses}
            multiple
            fileTabLabel="Загрузить файлы"
            fileTabMobileLabel="Файлы"
            linkPlaceholder="Прямая ссылка на PDF-файл меню"
            dropzoneHeight="h-36 sm:h-40"
          />
        </div>

        {stage === 'error' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-red-700">{importIssue?.title || 'Импорт не завершен'}</p>
                  <p className="leading-relaxed">{importIssue?.message || errorMessage}</p>
                </div>
                {importIssue?.actions?.length ? (
                  <div className="space-y-1 text-red-700/90">
                    {importIssue.actions.map((action) => (
                      <p key={action} className="leading-relaxed">- {action}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            className={`w-full sm:w-auto sm:min-w-[220px] ${primaryActionButtonClasses}`}
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              {submitLabel}
            </span>
          </Button>

          {(files.length > 0 || menuLink.trim()) && (
            <Button
              type="button"
              variant="outline"
              onClick={resetFlow}
              className={`w-full sm:w-auto ${secondaryActionButtonClasses}`}
            >
              <RefreshCw size={16} className="mr-2" />
              Сбросить
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

const waitForImportCompletion = async (jobId, { signal, timeoutMs }) => {
  const startedAt = Date.now();

  while (true) {
    if (Date.now() - startedAt >= timeoutMs) {
      return { status: 'deferred' };
    }

    const job = await pollMenuImportStatus(jobId, { signal });
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'timed_out') {
      return { status: 'resolved', job };
    }
    await delayWithAbort(POLL_INTERVAL_MS, signal);
  }
};

export default MenuImportFlow;
