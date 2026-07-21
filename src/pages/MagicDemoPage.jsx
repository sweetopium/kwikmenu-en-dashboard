import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Sparkles, WandSparkles } from 'lucide-react';

import { CountryField, DialPhoneField } from '../components/onboarding/CountryDialFields';
import MenuSourcePicker from '../components/onboarding/MenuSourcePicker';
import OnboardingCard from '../components/onboarding/OnboardingCard';
import { COUNTRIES } from '../components/onboarding/countries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TOP_CURRENCIES } from '../lib/currencyMeta';
import { formFieldClasses, primaryActionButtonClasses, secondaryActionButtonClasses } from '../lib/uiStyles';
import {
  getStoredDemoToken,
  pollDemoMenuImport,
  storeDemoToken,
  submitDemoMenuImport,
  verifyDemoToken,
} from '../lib/demoMagicApi';

const POLL_INTERVAL_MS = 1800;
const MAX_CONSECUTIVE_POLL_FAILURES = 20;

const waitForNextPoll = (signal, delay = POLL_INTERVAL_MS) => new Promise((resolve, reject) => {
  const timeoutId = window.setTimeout(resolve, delay);
  signal.addEventListener('abort', () => {
    window.clearTimeout(timeoutId);
    reject(new DOMException('Aborted', 'AbortError'));
  }, { once: true });
});

const isRetryablePollError = (error) => (
  error instanceof TypeError
  || error?.status === 429
  || error?.status >= 500
);

const MagicDemoPage = () => {
  const [token, setToken] = useState(() => getStoredDemoToken());
  const [tokenInput, setTokenInput] = useState(() => getStoredDemoToken());
  const [isTokenVerified, setIsTokenVerified] = useState(Boolean(getStoredDemoToken()));
  const [tokenError, setTokenError] = useState('');
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const [menuSource, setMenuSource] = useState('file');
  const [files, setFiles] = useState([]);
  const [menuLink, setMenuLink] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDial, setSelectedDial] = useState('+1');
  const [selectedCountry, setSelectedCountry] = useState('us');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [stage, setStage] = useState('idle');
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const activeControllerRef = useRef(null);

  useEffect(() => () => {
    activeControllerRef.current?.abort();
  }, []);

  const handleVerifyToken = async (event) => {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    setTokenError('');
    setIsCheckingToken(true);
    try {
      await verifyDemoToken(nextToken);
      storeDemoToken(nextToken);
      setToken(nextToken);
      setIsTokenVerified(true);
    } catch (nextError) {
      storeDemoToken('');
      setToken('');
      setIsTokenVerified(false);
      setTokenError(nextError.message || 'Token check failed');
    } finally {
      setIsCheckingToken(false);
    }
  };

  const waitForCompletion = async (jobId, signal) => {
    let consecutivePollFailures = 0;

    while (!signal.aborted) {
      let nextJob;
      try {
        nextJob = await pollDemoMenuImport(jobId, { token, signal });
        consecutivePollFailures = 0;
      } catch (pollError) {
        if (!isRetryablePollError(pollError) || consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          throw pollError;
        }

        consecutivePollFailures += 1;
        await waitForNextPoll(signal, Math.min(POLL_INTERVAL_MS * consecutivePollFailures, 5000));
        continue;
      }

      setJob(nextJob);

      if (nextJob.status === 'completed') {
        setStage('success');
        return;
      }

      if (nextJob.status === 'failed' || nextJob.status === 'timed_out') {
        throw new Error(nextJob.error || 'Could not digitize this menu.');
      }

      await waitForNextPoll(signal);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (menuSource === 'file' && files.length === 0) {
      setError('Add at least one PDF or menu photo.');
      return;
    }
    if (menuSource === 'link' && !menuLink.trim()) {
      setError('Paste a direct menu PDF link.');
      return;
    }

    setError('');
    setJob(null);
    setStage('uploading');
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      const submission = await submitDemoMenuImport({
        token,
        menuSource,
        files,
        menuLink,
        restaurantName,
        contactPhone: `${selectedDial} ${phone}`.trim(),
        city,
        country: COUNTRIES.find((item) => item.id === selectedCountry)?.name || selectedCountry,
        currency,
        signal: controller.signal,
      });
      setJob(submission);
      setStage('processing');
      await waitForCompletion(submission.id, controller.signal);
    } catch (nextError) {
      if (nextError?.name === 'AbortError') {
        return;
      }
      setError(nextError.message || 'Demo import failed.');
      setStage('error');
    } finally {
      activeControllerRef.current = null;
    }
  };

  const handleReset = () => {
    activeControllerRef.current?.abort();
    setStage('idle');
    setJob(null);
    setError('');
    setFiles([]);
    setMenuLink('');
  };

  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);
    const country = COUNTRIES.find((item) => item.id === countryId);
    if (country) {
      setSelectedDial(country.dial);
      setCurrency(country.currency);
    }
  };

  if (!isTokenVerified) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <OnboardingCard className="space-y-7">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Magic demo access</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enter the seller token once. This browser will keep it for future demo sessions.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-token">Token</Label>
              <Input
                id="demo-token"
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                className={formFieldClasses}
                autoFocus
                required
              />
            </div>
            {tokenError ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">{tokenError}</div> : null}
            <Button type="submit" disabled={isCheckingToken} className={`${primaryActionButtonClasses} h-12 w-full`}>
              {isCheckingToken ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              Continue
            </Button>
          </form>
        </OnboardingCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl py-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingCard className="min-h-[620px]">
          {stage === 'uploading' || stage === 'processing' ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                <WandSparkles size={30} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {stage === 'uploading' ? 'Uploading source files' : 'Digitizing the menu'}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Each photo is recognized as a page and then merged into one temporary digital menu.
              </p>
              <div className="mt-8 grid w-full max-w-xl gap-3">
                {['Files saved', 'AI recognition', 'Temporary page'].map((label, index) => {
                  const done = stage === 'processing' && index === 0;
                  const active = index === 0 ? stage === 'uploading' : stage === 'processing' && index === 1;
                  return (
                    <div key={label} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${done ? 'border-green-500/20 bg-green-500/5' : active ? 'border-brand-purple/25 bg-brand-purple/5' : 'border-border/60 bg-secondary/10'}`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-purple text-white' : 'bg-secondary text-muted-foreground'}`}>
                        {done ? <CheckCircle2 size={16} /> : <LoaderCircle size={16} className={active ? 'animate-spin' : ''} />}
                      </div>
                      <span className="text-sm font-bold text-foreground">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : stage === 'success' && job ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Temporary menu is ready</h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Share this link with anyone in the venue. It stays public by URL and does not require the seller token.
              </p>
              <div className="mt-6 grid w-full max-w-xl gap-3 rounded-2xl border border-border/60 bg-secondary/15 p-4 text-left sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Categories</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{job.result?.categoryCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Items</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{job.result?.itemCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Files</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{job.result?.documentCount || 0}</p>
                </div>
              </div>
              <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                <Link to={job.publicPath} className={`${primaryActionButtonClasses} flex !h-12 !min-h-12 flex-1 items-center justify-center gap-2 px-5 text-sm leading-none sm:text-base`}>
                  Open temporary menu
                  <ArrowRight size={17} />
                </Link>
                <button type="button" onClick={handleReset} className={`${secondaryActionButtonClasses} !h-12 !min-h-12 flex-1 px-5 text-sm leading-none sm:text-base`}>
                  Digitize another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex min-h-[540px] flex-col">
              <div className="mb-7 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/15 bg-brand-purple/5 px-3 py-1 text-xs font-bold text-brand-purple">
                  <Sparkles size={14} />
                  Field demo
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Turn a paper menu into a live menu</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Upload photos or a PDF, wait for recognition, and show the venue a temporary digital menu link.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Venue name</Label>
                  <Input id="restaurant-name" value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} placeholder="Cafe name on the sign" className={formFieldClasses} />
                </div>
                <DialPhoneField
                  phone={phone}
                  selectedDial={selectedDial}
                  selectedCountryId={selectedCountry}
                  onCountryChange={handleCountryChange}
                  onPhoneChange={setPhone}
                  onDialChange={setSelectedDial}
                  label="Phone"
                  inputClassName={formFieldClasses}
                  selectClassName={formFieldClasses}
                />
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Dubai" className={formFieldClasses} />
                </div>
                <CountryField selectedCountry={selectedCountry} onCountryChange={handleCountryChange} label="Country" />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="currency">Currency</Label>
                  <div className="relative">
                    <select
                      id="currency"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className={`${formFieldClasses} cursor-pointer appearance-none pr-10`}
                    >
                      {TOP_CURRENCIES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.flag} {item.code} - {item.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <ArrowRight size={14} className="rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <MenuSourcePicker
                  menuSource={menuSource}
                  onMenuSourceChange={setMenuSource}
                  files={files}
                  onFileChange={(event) => setFiles(Array.from(event.target.files || []))}
                  menuLink={menuLink}
                  onMenuLinkChange={setMenuLink}
                  multiple
                  inputClassName={formFieldClasses}
                  fileTabLabel="Upload photos or PDF"
                  fileTabMobileLabel="Files"
                  linkPlaceholder="Direct link to a menu PDF"
                  dropzoneHeight="h-36 sm:h-40"
                />
              </div>

              {error ? <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">{error}</div> : null}

              <div className="mt-auto pt-7">
                <Button type="submit" className={`${primaryActionButtonClasses} h-12 w-full`}>
                  Digitize menu
                  <ArrowRight size={17} />
                </Button>
              </div>
            </form>
          )}
      </OnboardingCard>
    </div>
  );
};

export default MagicDemoPage;
