import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, RefreshCw, Sparkles, WandSparkles, Clock, Layers, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import MenuSourcePicker from "../onboarding/MenuSourcePicker";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  formFieldClasses,
  primaryActionButtonClasses,
  secondaryActionButtonClasses,
} from "../../lib/uiStyles";
import { trackMenuUploadConversion } from "../../lib/conversionTracking";
import { saveImportedMenuToStorage } from "../../lib/importedMenuStorage";
import { pollMenuImportStatus, submitMenuImport } from "../../lib/menuImport";
import { trackProductEvent } from "../../lib/productAnalytics";

const getStatusMeta = (t) => ({
  uploading: {
    title: t('menuImport.statusUploadingTitle', { defaultValue: 'Retrieving files' }),
    description: t('menuImport.statusUploadingDesc', { defaultValue: 'Securely saving files and preparing them for AI recognition.' }),
  },
  processing: {
    title: t('menuImport.statusProcessingTitle', { defaultValue: 'Scanning menu' }),
    description: t('menuImport.statusProcessingDesc', { defaultValue: 'AI is reading text, finding dishes and prices, and grouping items by category.' }),
  },
});

const POLL_INTERVAL_MS = 1500;
const IMPORT_POLL_TIMEOUT_MS = 60_000;
const BACKGROUND_POLL_INTERVAL_MS = 5000;

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

const buildImportIssue = (t, { kind, message }) => {
  const defaultActions = [
    t('menuImport.errors.action1', { defaultValue: 'Check that the PDF or photos are clear, not cropped, and not rotated.' }),
    t('menuImport.errors.action2', { defaultValue: 'If the menu is large, upload it in parts, such as drinks and food separately.' }),
    t('menuImport.errors.action3', { defaultValue: 'Try uploading a smaller PDF or paste a direct link to a menu PDF.' }),
    t('menuImport.errors.action4', { defaultValue: 'If the issue repeats, contact support and send us the source menu file.' }),
  ];

  if (kind === 'timed_out') {
    return {
      title: t('menuImport.errors.timeoutTitle', { defaultValue: 'Recognition took too long' }),
      message: message || t('menuImport.errors.timeoutMessage', { defaultValue: 'AI took too long to recognize this menu. Please try again.' }),
      actions: defaultActions,
    };
  }

  return {
    title: t('menuImport.errors.generalTitle', { defaultValue: 'Could not recognize menu' }),
    message: message || t('menuImport.errors.generalMessage', { defaultValue: 'We could not process the files. Please make sure they contain readable menu text.' }),
    actions: defaultActions,
  };
};

const StageItem = ({ isActive, isDone, title, description }) => (
  <div className={`rounded-2xl border p-4 transition-all duration-300 ${
    isActive
      ? 'border-brand-purple/30 bg-brand-purple/5 shadow-sm shadow-brand-purple/5 ring-1 ring-brand-purple/10'
      : isDone
        ? 'border-green-500/20 bg-green-500/5'
        : 'border-border/60 bg-secondary/10'
  }`}>
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
        isDone
          ? 'bg-green-500 text-white shadow-sm shadow-green-500/20'
          : isActive
            ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple/20'
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

const AnimatedCounter = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return <>{count}</>;
};

const MenuImportFlow = ({
  context = {},
  introTitle,
  introDescription,
  submitLabel,
  successTitle,
  successDescription,
  successPrimaryLabel,
  successPrimaryTo = '/dashboard/menu/main',
  successSecondaryLabel,
  successSecondaryTo,
  onStageChange,
  venueId = null,
}) => {
  const { t } = useTranslation();
  const displayIntroTitle = introTitle !== undefined ? introTitle : t('menuImport.introTitle', { defaultValue: 'Import Menu' });
  const displayIntroDescription = introDescription !== undefined ? introDescription : t('menuImport.introDescription', { defaultValue: 'Upload PDF, photos, or paste a direct link. AI will recognize categories, items, prices, and descriptions.' });
  const displaySubmitLabel = submitLabel !== undefined ? submitLabel : t('menuImport.submitLabel', { defaultValue: 'Send for recognition' });
  const displaySuccessTitle = successTitle !== undefined ? successTitle : t('menuImport.successTitle', { defaultValue: 'Menu recognized' });
  const displaySuccessDescription = successDescription !== undefined ? successDescription : t('menuImport.successDescription', { defaultValue: 'Review the result and continue editing.' });
  const displaySuccessPrimaryLabel = successPrimaryLabel !== undefined ? successPrimaryLabel : t('menuImport.successPrimaryLabel', { defaultValue: 'Open editor' });
  const displaySuccessSecondaryLabel = successSecondaryLabel !== undefined ? successSecondaryLabel : t('menuImport.successSecondaryLabel', { defaultValue: 'Upload another menu' });

  const statusMeta = getStatusMeta(t);

  const [stage, setStage] = useState('idle');
  const [menuSource, setMenuSource] = useState('file');
  const [files, setFiles] = useState([]);
  const [menuLink, setMenuLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importIssue, setImportIssue] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [backgroundJobId, setBackgroundJobId] = useState(null);
  const [backgroundStatusMessage, setBackgroundStatusMessage] = useState('');
  const [isResumingWait, setIsResumingWait] = useState(false);
  const activeRequestRef = useRef(null);
  const trackedConversionJobIdsRef = useRef(new Set());

  useEffect(() => {
    onStageChange?.(stage);
  }, [onStageChange, stage]);

  useEffect(() => () => {
    activeRequestRef.current?.abort();
  }, []);

  const resetFlow = () => {
    trackProductEvent('menu_import_reset_clicked', { venueId });
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setStage('idle');
    setErrorMessage('');
    setImportIssue(null);
    setResultPreview(null);
    setBackgroundJobId(null);
    setBackgroundStatusMessage('');
    setIsResumingWait(false);
    setFiles([]);
    setMenuLink('');
    setMenuSource('file');
  };

  const trackMenuUploadCompletionConversion = (jobId) => {
    if (!jobId || trackedConversionJobIdsRef.current.has(jobId)) {
      return;
    }

    trackedConversionJobIdsRef.current.add(jobId);
    trackMenuUploadConversion();
  };

  const resolveImportCompletion = async ({ jobId, signal }) => {
    const completion = await waitForImportCompletion(jobId, {
      signal,
      timeoutMs: IMPORT_POLL_TIMEOUT_MS,
    });

    if (completion.status === 'deferred') {
      trackProductEvent('menu_import_background_wait_shown', {
        venueId,
        properties: { job_id: jobId },
      });
      setBackgroundJobId(jobId);
      setBackgroundStatusMessage(t('menuImport.bgStatusMonitoring', { defaultValue: 'Monitoring import status in the background.' }));
      setStage('background');
      return;
    }

    const finalJob = completion.job;
    if (finalJob.status === 'failed' || finalJob.status === 'timed_out') {
      const importError = new Error(finalJob.error || t('menuImport.errors.failedToProcess', { defaultValue: 'Failed to process the menu.' }));
      importError.importIssue = buildImportIssue(t, {
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
        : (menuSource === 'link' ? menuLink.trim() : t('menuImport.untitled', { defaultValue: 'Untitled' })),
      detectedCategories: result.categoryCount,
      detectedItems: result.itemCount,
      documentCount: result.documentCount,
      usedFallback: result.usedFallback,
      warnings: result.warnings || [],
    });
    trackProductEvent('menu_import_result_ready', {
      venueId,
      menuId: finalJob.result?.menuId,
      properties: {
        job_id: jobId,
        category_count: result.categoryCount,
        item_count: result.itemCount,
        document_count: result.documentCount,
        used_fallback: result.usedFallback,
      },
    });
    trackMenuUploadCompletionConversion(jobId);
    setBackgroundJobId(null);
    setBackgroundStatusMessage('');
    setStage('success');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (menuSource === 'file' && files.length === 0) {
      setErrorMessage(t('menuImport.errors.addFile', { defaultValue: 'Add at least one PDF or menu photo.' }));
      setStage('error');
      return;
    }

    if (menuSource === 'link' && !menuLink.trim()) {
      setErrorMessage(t('menuImport.errors.addLink', { defaultValue: 'Enter a direct link to a menu PDF to send it for processing.' }));
      setStage('error');
      return;
    }

    setErrorMessage('');
    setImportIssue(null);
    setBackgroundJobId(null);
    setBackgroundStatusMessage('');
    setStage('uploading');
    trackProductEvent('menu_import_submit_clicked', {
      venueId,
      properties: {
        menu_source: menuSource,
        files_count: files.length,
        has_link: Boolean(menuLink.trim()),
        flow: context.flow,
      },
    });

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

      const issue = error?.importIssue || buildImportIssue(t, { kind: 'failed', message: error instanceof Error ? error.message : '' });
      setImportIssue(issue);
      setErrorMessage(error instanceof Error ? error.message : t('menuImport.errors.failedToSubmit', { defaultValue: 'Failed to submit menu for processing. Please try again.' }));
      setStage('error');
    } finally {
      activeRequestRef.current = null;
    }
  };

  useEffect(() => {
    if (stage !== 'background' || !backgroundJobId) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId = null;
    const controller = new AbortController();

    const pollInBackground = async () => {
      try {
        const job = await pollMenuImportStatus(backgroundJobId, { signal: controller.signal });
        if (cancelled) {
          return;
        }

        if (job.status === 'completed') {
          const result = job.result;
          if (!result) {
            throw new Error(t('menuImport.errors.noResult', { defaultValue: 'Import finished with no menu result.' }));
          }

          if (!result.menuId) {
            saveImportedMenuToStorage(result.menu);
          }

          setResultPreview({
            menuId: result.menuId,
            sourceLabel: result.sourceSummary.length > 0
              ? result.sourceSummary.map((source) => source.name).join(', ')
              : (menuSource === 'link' ? menuLink.trim() : t('menuImport.untitled', { defaultValue: 'Untitled' })),
            detectedCategories: result.categoryCount,
            detectedItems: result.itemCount,
            documentCount: result.documentCount,
            usedFallback: result.usedFallback,
            warnings: result.warnings || [],
          });
          trackProductEvent('menu_import_result_ready', {
            venueId,
            menuId: result.menuId,
            properties: {
              job_id: backgroundJobId,
              category_count: result.categoryCount,
              item_count: result.itemCount,
              document_count: result.documentCount,
              used_fallback: result.usedFallback,
            },
          });
          trackMenuUploadCompletionConversion(backgroundJobId);
          setBackgroundJobId(null);
          setBackgroundStatusMessage('');
          setStage('success');
          return;
        }

        if (job.status === 'failed' || job.status === 'timed_out') {
          const issue = buildImportIssue(t, {
            kind: job.status === 'timed_out' ? 'timed_out' : 'failed',
            message: job.error,
          });
          setImportIssue(issue);
          setErrorMessage(job.error || t('menuImport.errors.failedToProcess', { defaultValue: 'Failed to process the menu.' }));
          setStage('error');
          setBackgroundJobId(null);
          setBackgroundStatusMessage('');
          return;
        }

        setBackgroundStatusMessage(t('menuImport.bgStatusRunning', { defaultValue: 'Import is still running. The screen will update automatically when the backend job completes.' }));
        timeoutId = window.setTimeout(pollInBackground, BACKGROUND_POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        setBackgroundStatusMessage(t('menuImport.bgStatusUpdateFailed', { defaultValue: 'Could not update status right now. We will check again automatically.' }));
        timeoutId = window.setTimeout(pollInBackground, BACKGROUND_POLL_INTERVAL_MS);
      }
    };

    timeoutId = window.setTimeout(pollInBackground, BACKGROUND_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [backgroundJobId, stage]);

  const handleResumeWaiting = async () => {
    if (!backgroundJobId) {
      return;
    }

    try {
      setIsResumingWait(true);
      trackProductEvent('menu_import_wait_resumed', {
        venueId,
        properties: { job_id: backgroundJobId },
      });
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

      const issue = error?.importIssue || buildImportIssue(t, { kind: 'failed', message: error instanceof Error ? error.message : '' });
      setImportIssue(issue);
      setErrorMessage(error instanceof Error ? error.message : t('menuImport.errors.failedToGetStatus', { defaultValue: 'Could not get import status. Please try again.' }));
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
          {statusMeta[stage].title}
        </h3>
        <p className="mt-2 max-w-md text-center text-sm sm:text-base leading-relaxed text-muted-foreground">
          {statusMeta[stage].description}
        </p>

        <div className="mt-8 grid w-full max-w-2xl gap-3">
          <StageItem
            isActive={stage === 'uploading'}
            isDone={stage === 'processing'}
            title={statusMeta.uploading.title}
            description={statusMeta.uploading.description}
          />
          <StageItem
            isActive={stage === 'processing'}
            isDone={false}
            title={statusMeta.processing.title}
            description={statusMeta.processing.description}
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
            {displaySuccessTitle}
          </h3>
          <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {displaySuccessDescription}
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Time Saved */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background to-secondary/15 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 hover:border-brand-purple/35">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('menuImport.results.timeSaved', { defaultValue: 'Time saved' })}
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  ~<AnimatedCounter value={Math.max(Math.round(resultPreview.detectedItems * 0.5), 5)} /> {t('menuImport.results.minutesSuffix', { defaultValue: 'min' })}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple transition-transform duration-300 group-hover:scale-110">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Card 2: Categories */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background to-secondary/15 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 hover:border-blue-500/35">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('menuImport.results.categories', { defaultValue: 'Categories' })}
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  <AnimatedCounter value={resultPreview.detectedCategories} />
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-transform duration-300 group-hover:scale-110">
                <Layers size={20} />
              </div>
            </div>
          </div>

          {/* Card 3: Items */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background to-secondary/15 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 hover:border-green-500/35">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('menuImport.results.items', { defaultValue: 'Items' })}
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  <AnimatedCounter value={resultPreview.detectedItems} />
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-500 transition-transform duration-300 group-hover:scale-110">
                <UtensilsCrossed size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Warning Banners (if any) & Source Metadata Footer */}
        <div className="space-y-4">
          {resultPreview.usedFallback && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700">
              {t('menuImport.results.fallbackWarning', { defaultValue: 'The menu was created using a standard template for your convenience.' })}
            </div>
          )}
          {resultPreview.warnings?.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-sm text-muted-foreground">
              {resultPreview.warnings.join(' ')}
            </div>
          )}

          {/* Subtle metadata row */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground/75 border-t border-border/40 pt-4">
            <div className="flex items-center gap-1.5">
              <span>{t('menuImport.results.documentsProcessed', { defaultValue: 'Files processed:' })}</span>
              <span className="font-bold text-foreground">{resultPreview.documentCount}</span>
            </div>
            {resultPreview.sourceLabel && (
              <div className="flex items-center gap-1.5 max-w-[280px] sm:max-w-md truncate">
                <span>{t('menuImport.results.source', { defaultValue: 'Source' })}:</span>
                <span className="font-semibold text-muted-foreground truncate" title={resultPreview.sourceLabel}>
                  {resultPreview.sourceLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={resultPreview.menuId ? `/dashboard/menu/${resultPreview.menuId}` : successPrimaryTo}
            className={`${primaryActionButtonClasses} flex h-11 sm:h-12 w-full items-center justify-center gap-2 px-5`}
          >
            {displaySuccessPrimaryLabel}
            <ArrowRight size={16} />
          </Link>

          {/*<SecondaryActionTag*/}
          {/*  {...(successSecondaryTo ? { to: successSecondaryTo } : { type: 'button', onClick: resetFlow })}*/}
          {/*  className={`${secondaryActionButtonClasses} flex h-11 sm:h-12 w-full items-center justify-center px-5`}*/}
          {/*>*/}
          {/*  {displaySuccessSecondaryLabel}*/}
          {/*</SecondaryActionTag>*/}
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
            {t('menuImport.longRunningTitle', { defaultValue: 'Import is taking longer than usual' })}
          </h3>
          <p className="mt-2 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {t('menuImport.longRunningDesc', { defaultValue: 'We are still processing the menu on the server. You can go to the dashboard and check later, or keep waiting here.' })}
          </p>
        </div>

        <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4 sm:p-5 text-sm leading-relaxed text-brand-purple/90">
          {t('menuImport.bgWarningNote', { defaultValue: 'Recognition is running in the background on the server. Closing this tab will not interrupt it.' })}
        </div>

        <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-sm text-muted-foreground">
          {backgroundStatusMessage || t('menuImport.bgStatusChecking', { defaultValue: 'Checking import status in the background...' })}
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
              {isResumingWait ? t('menuImport.checkingStatus', { defaultValue: 'Checking status...' }) : t('menuImport.resumeWaiting', { defaultValue: 'Continue waiting' })}
            </span>
          </Button>

          <SecondaryActionTag
            {...(successSecondaryTo ? { to: successSecondaryTo } : { type: 'button', onClick: resetFlow })}
            className={`${secondaryActionButtonClasses} flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center px-5`}
          >
            {successSecondaryTo ? displaySuccessSecondaryLabel : t('common.close', { defaultValue: 'Close' })}
          </SecondaryActionTag>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {displayIntroTitle}
        </h3>
        <p className="text-xs sm:text-base leading-relaxed text-muted-foreground">
          {displayIntroDescription}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-foreground font-medium ml-1 text-[11px] sm:text-sm">
            {t('menuImport.sourceLabel', { defaultValue: 'Menu source' })} <span className="text-red-500">*</span>
          </Label>

          <MenuSourcePicker
            menuSource={menuSource}
            onMenuSourceChange={(nextSource) => {
              setMenuSource(nextSource);
              trackProductEvent('menu_import_source_selected', {
                venueId,
                properties: { menu_source: nextSource, flow: context.flow },
              });
            }}
            files={files}
            onFileChange={(event) => {
              const selectedFiles = Array.from(event.target.files || []);
              const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
              const hasInvalidFile = selectedFiles.some((file) => {
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                return !allowedExtensions.includes(ext);
              });

              if (hasInvalidFile) {
                setErrorMessage(t('menuImport.errors.invalidFormat', { defaultValue: 'Only PDF files and images are supported' }));
                setStage('error');
                setImportIssue(null);
                setFiles([]);
                event.target.value = '';
                return;
              }

              setFiles(selectedFiles);
              if (stage === 'error') {
                setStage('idle');
                setErrorMessage('');
                setImportIssue(null);
              }
            }}
            menuLink={menuLink}
            onMenuLinkChange={setMenuLink}
            inputClassName={formFieldClasses}
            multiple
            fileTabLabel={t('menuSource.fileTabLabelMultiple', { defaultValue: 'Upload files' })}
            fileTabMobileLabel={t('menuSource.fileTabMobileLabelMultiple', { defaultValue: 'Files' })}
            linkPlaceholder={t('menuSource.linkPlaceholder', { defaultValue: 'Direct link to menu PDF file' })}
            dropzoneHeight="h-36 sm:h-40"
          />
        </div>

        {stage === 'error' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-red-700">{importIssue?.title || t('menuImport.errors.importFailed', { defaultValue: 'Import did not finish' })}</p>
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
              {displaySubmitLabel}
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
              {t('menuImport.reset', { defaultValue: 'Reset' })}
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
