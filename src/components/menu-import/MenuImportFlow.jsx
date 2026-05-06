import { useEffect, useState } from 'react';
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

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const POLL_INTERVAL_MS = 1500;

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
}) => {
  const [stage, setStage] = useState('idle');
  const [menuSource, setMenuSource] = useState('file');
  const [files, setFiles] = useState([]);
  const [menuLink, setMenuLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultPreview, setResultPreview] = useState(null);

  useEffect(() => {
    onStageChange?.(stage);
  }, [onStageChange, stage]);

  const resetFlow = () => {
    setStage('idle');
      setErrorMessage('');
      setResultPreview(null);
      setFiles([]);
      setMenuLink('');
      setMenuSource('file');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (menuSource === 'file' && files.length === 0) {
      setErrorMessage('Добавьте хотя бы один PDF или набор фотографий меню.');
      setStage('error');
      return;
    }

    if (menuSource === 'link' && !menuLink.trim()) {
      setErrorMessage('Укажите ссылку на меню, чтобы отправить ее в обработку.');
      setStage('error');
      return;
    }

    setErrorMessage('');
    setStage('uploading');

    try {
      const submission = await submitMenuImport({
        menuSource,
        files,
        menuLink,
        context,
      });

      setStage('processing');
      const finalJob = await waitForImportCompletion(submission.jobId);

      if (finalJob.status === 'failed') {
        throw new Error(finalJob.error || 'Не удалось обработать меню.');
      }

      const result = finalJob.result;
      saveImportedMenuToStorage(result.menu);
      setResultPreview({
        sourceLabel: result.sourceSummary.length > 0
          ? result.sourceSummary.map((source) => source.name).join(', ')
          : (menuSource === 'link' ? menuLink.trim() : 'Без названия'),
        detectedCategories: result.categoryCount,
        detectedItems: result.itemCount,
        documentCount: result.documentCount,
        usedFallback: result.usedFallback,
        warnings: result.warnings || [],
      });
      setStage('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отправить меню в обработку. Попробуйте еще раз.');
      setStage('error');
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
              Импорт завершен через backend job. Сущность меню пока не сохраняем в БД, поэтому после обработки ведем пользователя в существующий демо-редактор.
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
            to={successPrimaryTo}
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
            linkPlaceholder="Ссылка на Google Drive, Яндекс.Диск или сайт"
            dropzoneHeight="h-36 sm:h-40"
          />
        </div>

        {stage === 'error' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="leading-relaxed">{errorMessage}</p>
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

const waitForImportCompletion = async (jobId) => {
  while (true) {
    const job = await pollMenuImportStatus(jobId);
    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }
    await delay(POLL_INTERVAL_MS);
  }
};

export default MenuImportFlow;
