import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMuteJar } from '../context/MuteJarContext';
import { CHARITY_AGGREGATORS, getCharityById } from '../utils/charities';
import { sanitizeUrl } from '../utils/security';
import { getPhilosophyCombinedLabel } from '../utils/philosophyLabels';
import { getLocalApiUrl, getOfflinePledgeSuggestions } from '../utils/localSidecar';
import {
  Heart,
  Zap,
  Crown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  X,
  Globe,
  UploadCloud,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Calendar,
  Lock,
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MuteJarLogo } from './MuteJarLogo';

interface SuggestionItem {
  title: string;
  description: string;
  category: string;
  actionMetric: string;
}

export const MonthlyReviewModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    currentCycleCoins,
    currentCycle,
    cycleNoun,
    lastMonthCoins,
    twelveMonthAverage,
    commitPledge,
    resetCurrentMonthJar,
    formatCurrency,
  } = useMuteJar();

  // Charity Donation Flow: Step 1 (Prepare donation & open URL) -> Step 2 (Upload receipt)
  const [charityStep, setCharityStep] = useState<'checkout' | 'upload_receipt'>('checkout');

  // Charity state
  const [selectedAggregatorId, setSelectedAggregatorId] = useState<string>(
    settings.selectedCharityId || 'globalgiving'
  );
  const [useCustomCharity, setUseCustomCharity] = useState(
    settings.selectedCharityId === 'custom' || !!settings.customCharityUrl
  );
  const [customUrl, setCustomUrl] = useState(settings.customCharityUrl || '');
  const [customName, setCustomName] = useState(settings.customCharityName || '');

  // Receipt upload state
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFileSize, setReceiptFileSize] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Goal & Pledge inputs for Pragmatist & Roast Master
  const [goalTitle, setGoalTitle] = useState(
    settings.pragmatistGoalTitle || `${currentCycleCoins * 5} Pushups & Focus Sprints`
  );
  const [goalDesc, setGoalDesc] = useState(
    settings.pragmatistGoalDescription ||
      `Perform 5 pushups for every Mutecoin (${currentCycleCoins * 5} total) over this cycle.`
  );
  const [workTitle, setWorkTitle] = useState(
    settings.roastActivityTitle || 'Team Coffee & Pastries Shout'
  );
  const [workDesc, setWorkDesc] = useState(
    settings.roastActivityDescription ||
      'Bring morning donuts and coffee to team standup to thank colleagues for tolerating mute slip-ups.'
  );

  // Photo proof capture / upload for completed goals & dares
  const [proofPhotoDataUrl, setProofPhotoDataUrl] = useState<string | null>(null);
  const photoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const photoCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Gemini AI suggestions
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestionItem[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const personaInfo = getPhilosophyCombinedLabel(settings.persona, settings.philosophyLabelStyle);
  const totalValuation = formatCurrency(currentCycleCoins * settings.perCoinValue);

  // Compress photo for local storage
  const handleCompressAndSetPhoto = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setProofPhotoDataUrl(compressed);
        } else {
          setProofPhotoDataUrl(rawUrl);
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle file receipt reading
  const processUploadedFile = (file: File) => {
    if (!file) return;
    const sizeInKb = (file.size / 1024).toFixed(1);
    setReceiptFileName(file.name);
    setReceiptFileSize(`${sizeInKb} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setReceiptDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Resolve charity target details
  const resolveCharityDetails = () => {
    if (useCustomCharity && customUrl) {
      return {
        name: customName || 'Custom Charity Initiative',
        url: sanitizeUrl(customUrl) || 'https://www.globalgiving.org',
        isCustom: true,
      };
    }
    const agg = getCharityById(selectedAggregatorId) || CHARITY_AGGREGATORS[0];
    return {
      name: agg.name,
      url: agg.url,
      isCustom: false,
    };
  };

  // Charity step 1: Open charity URL in new tab & advance to upload receipt step
  const handleProceedToCharityWebsite = () => {
    const charity = resolveCharityDetails();

    // Persist charity preferences
    if (useCustomCharity) {
      updateSettings({
        selectedCharityId: 'custom',
        customCharityName: charity.name,
        customCharityUrl: charity.url,
      });
    } else {
      updateSettings({
        selectedCharityId: selectedAggregatorId,
        customCharityName: charity.name,
        customCharityUrl: charity.url,
      });
    }

    // Open charity donation URL in a new tab
    if (charity.url) {
      window.open(charity.url, '_blank', 'noopener,noreferrer');
    }

    // Move to step 2: Upload receipt
    setCharityStep('upload_receipt');
  };

  // AI brainstormer fetch with seamless offline fallback
  const handleFetchAiSuggestions = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch(getLocalApiUrl('/api/pledges/suggest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: settings.persona,
          coinCount: Math.max(1, currentCycleCoins),
          category:
            settings.persona === 'saint'
              ? 'charity'
              : settings.persona === 'roastmaster'
              ? 'work'
              : 'personal',
        }),
      });
      if (!res.ok) {
        throw new Error('Suggestion endpoint unavailable');
      }
      const data = await res.json();
      if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiSuggestions(getOfflinePledgeSuggestions(settings.persona, currentCycleCoins));
      }
    } catch {
      // Offline-first fallback when running standalone desktop bundle without sidecar
      setAiSuggestions(getOfflinePledgeSuggestions(settings.persona, currentCycleCoins));
    } finally {
      setIsLoadingAi(false);
    }
  };

  const applyAiSuggestion = (s: SuggestionItem) => {
    if (settings.persona === 'pragmatist') {
      setGoalTitle(s.title);
      setGoalDesc(`${s.description} (${s.actionMetric})`);
    } else if (settings.persona === 'roastmaster') {
      setWorkTitle(s.title);
      setWorkDesc(`${s.description} (${s.actionMetric})`);
    } else {
      setCustomName(s.title);
      setCustomUrl('https://www.globalgiving.org');
      setUseCustomCharity(true);
    }
  };

  // Final Commit Handler
  const handleCommit = (shouldResetJar: boolean) => {
    let title = '';
    let description = '';
    let donationUrl: string | undefined = undefined;

    if (settings.persona === 'saint') {
      const charity = resolveCharityDetails();
      title = `Charity Donation: ${charity.name}`;
      description = `Donated ${totalValuation} (${currentCycleCoins} Mutecoins) to ${charity.name}`;
      donationUrl = charity.url;

      commitPledge({
        type: 'charity',
        title,
        description,
        coinsCommitted: currentCycleCoins,
        estimatedValue: totalValuation,
        donationUrl,
        receiptDataUrl: receiptDataUrl || undefined,
        receiptFileName: receiptFileName || undefined,
        receiptUploadedAt: receiptDataUrl ? Date.now() : undefined,
        photoDataUrl: proofPhotoDataUrl || undefined,
        photoCapturedAt: proofPhotoDataUrl ? Date.now() : undefined,
      });
    } else if (settings.persona === 'pragmatist') {
      title = goalTitle;
      description = goalDesc;
      updateSettings({
        pragmatistGoalTitle: goalTitle,
        pragmatistGoalDescription: goalDesc,
        activeTargetTitle: title,
        activeTargetDescription: description,
      });

      commitPledge({
        type: 'goal',
        title,
        description,
        coinsCommitted: currentCycleCoins,
        estimatedValue: totalValuation,
        photoDataUrl: proofPhotoDataUrl || undefined,
        photoCapturedAt: proofPhotoDataUrl ? Date.now() : undefined,
      });
    } else {
      title = workTitle;
      description = workDesc;
      updateSettings({
        roastActivityTitle: workTitle,
        roastActivityDescription: workDesc,
        activeTargetTitle: title,
        activeTargetDescription: description,
      });

      commitPledge({
        type: 'pledge',
        title,
        description,
        coinsCommitted: currentCycleCoins,
        estimatedValue: totalValuation,
        photoDataUrl: proofPhotoDataUrl || undefined,
        photoCapturedAt: proofPhotoDataUrl ? Date.now() : undefined,
      });
    }

    // Confetti celebration
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });

    if (shouldResetJar) {
      resetCurrentMonthJar();
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header with Dynamic Cycle Label */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <MuteJarLogo className="w-8 h-8" />
            <div>
              <h2 id="review-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Mute Jar Review · {currentCycle.label}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Redeem your {currentCycleCoins} accumulated Mutecoins for this {cycleNoun.toLowerCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close review dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Stats & Cycle Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                This {cycleNoun}
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {currentCycleCoins}
              </span>
            </div>

            <div className="text-center border-x border-slate-200 dark:border-slate-700 px-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Previous Cycle
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {lastMonthCoins}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                12-Mo. Average
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {twelveMonthAverage}
              </span>
            </div>
          </div>

          {/* Persona Coupling Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-2xs shrink-0">
                {settings.persona === 'saint' ? (
                  <Heart className="w-4 h-4 text-sky-500" />
                ) : settings.persona === 'roastmaster' ? (
                  <Crown className="w-4 h-4 text-rose-500" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Redemption Path: {personaInfo.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Locked to Philosophy</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.persona === 'saint'
                    ? 'Mutecoins are cashed in for verified non-profit charity donations.'
                    : settings.persona === 'roastmaster'
                    ? 'Mutecoins are redeemed for team treats, barista shouts, and office dares.'
                    : 'Mutecoins are redeemed for personal fitness reps, focus sprints, and reading habits.'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pool</span>
              <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                {totalValuation}
              </span>
            </div>
          </div>

          {/* PATH 1: SAINT (Charity Donation + Opening URL + Receipt Upload) */}
          {settings.persona === 'saint' && (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      charityStep === 'checkout'
                        ? 'bg-sky-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    1
                  </span>
                  <span className={charityStep === 'checkout' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                    Select Charity & Open Donation Page
                  </span>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      charityStep === 'upload_receipt'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    2
                  </span>
                  <span className={charityStep === 'upload_receipt' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                    Upload Donation Receipt
                  </span>
                </div>
              </div>

              {/* Step 1: Pick Charity & Open Website */}
              {charityStep === 'checkout' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-sky-500" />
                      <span>Curated Global Aggregators & Direct Charities</span>
                    </span>
                    <button
                      onClick={() => setUseCustomCharity(!useCustomCharity)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                    >
                      {useCustomCharity ? '← Pick an Aggregator' : '+ Enter Custom Charity URL'}
                    </button>
                  </div>

                  {!useCustomCharity ? (
                    <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                      {CHARITY_AGGREGATORS.map((agg) => {
                        const isSelected = selectedAggregatorId === agg.id;
                        return (
                          <div
                            key={agg.id}
                            onClick={() => setSelectedAggregatorId(agg.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {agg.name}
                                </span>
                                {agg.highlight && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-md font-medium">
                                    Global Reach
                                  </span>
                                )}
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  · {agg.region}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                                {agg.description}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {agg.feeInfo}
                              </span>
                            </div>

                            <a
                              href={agg.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0"
                              title="Preview charity site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Charity Name / Organization
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Doctors Without Borders, Local Animal Shelter"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Charity Donation URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cash in and open URL button */}
                  <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-sky-950 dark:text-sky-200 block">
                        Ready to Cash In {currentCycleCoins} Mutecoins?
                      </span>
                      <p className="text-[11px] text-sky-800 dark:text-sky-300">
                        Total donation commitment: <strong>{totalValuation}</strong>. Clicking below opens the charity payment page in a new tab so you can make your donation.
                      </p>
                    </div>

                    <button
                      onClick={handleProceedToCharityWebsite}
                      className="px-5 py-2.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <span>Donate {totalValuation}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Upload Donation Receipt */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                        Donation Page Opened in New Tab
                      </strong>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug">
                        Please complete your donation of <strong>{totalValuation}</strong> on the charity website. Once complete, upload a copy of your receipt or confirmation screenshot below to add it directly to your verified goal log.
                      </p>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      isDragOver
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
                        : receiptDataUrl
                        ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {receiptDataUrl ? (
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {receiptFileName || 'Donation_Receipt.png'}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {receiptFileSize || 'Uploaded'} · Verified Receipt
                          </span>
                        </div>

                        {receiptDataUrl.startsWith('data:image/') && (
                          <div className="mt-2 max-h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                            <img
                              src={receiptDataUrl}
                              alt="Receipt Preview"
                              className="max-h-32 object-contain"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptDataUrl(null);
                            setReceiptFileName(null);
                            setReceiptFileSize(null);
                          }}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove & choose another file</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Click to upload receipt or drag & drop file
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Supports PNG, JPG, or PDF receipts (stored securely in local storage)
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => setCharityStep('checkout')}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline font-semibold cursor-pointer"
                    >
                      ← Back to Charity Selection
                    </button>
                    {!receiptDataUrl && (
                      <span className="text-[11px] text-slate-400 italic">
                        (You can also log now and attach your receipt later in the Goal Log)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PATH 2: PRAGMATIST (Personal Habit Milestone Goal) */}
          {settings.persona === 'pragmatist' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="pragmatist-goal-title" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Productivity / Habit Goal Title
                </label>
                <input
                  id="pragmatist-goal-title"
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>

              <div>
                <label htmlFor="pragmatist-goal-desc" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Goal Action Description ({currentCycleCoins} Mutecoins Commitment)
                </label>
                <textarea
                  id="pragmatist-goal-desc"
                  rows={2}
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>

              {/* Optional Photo Proof Capture / Upload */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Attach Photo Proof (Optional)</span>
                  </span>
                  {proofPhotoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setProofPhotoDataUrl(null)}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {proofPhotoDataUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={proofPhotoDataUrl}
                      alt="Proof preview"
                      className="w-16 h-16 rounded-xl object-cover border border-amber-400/50 shadow-xs"
                    />
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">Photo attached!</span>
                      Will be saved with this goal and shown on your shareable card.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={photoUploadInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleCompressAndSetPhoto(e.target.files[0])}
                      className="hidden"
                    />
                    <input
                      ref={photoCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleCompressAndSetPhoto(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoCameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-amber-400 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoUploadInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-amber-400 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATH 3: ROAST MASTER (Team Forfeit & Social Treat) */}
          {settings.persona === 'roastmaster' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="roast-work-title" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Workplace Team Activity / Social Shout Title
                </label>
                <input
                  id="roast-work-title"
                  type="text"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                />
              </div>

              <div>
                <label htmlFor="roast-work-desc" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Team Forfeit Action Description ({currentCycleCoins} Mutecoins)
                </label>
                <textarea
                  id="roast-work-desc"
                  rows={2}
                  value={workDesc}
                  onChange={(e) => setWorkDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                />
              </div>

              {/* Optional Photo Proof Capture / Upload */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                    <span>Attach Photo Proof (Pastries, coffee, or dare selfie)</span>
                  </span>
                  {proofPhotoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setProofPhotoDataUrl(null)}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {proofPhotoDataUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={proofPhotoDataUrl}
                      alt="Treat proof preview"
                      className="w-16 h-16 rounded-xl object-cover border border-rose-400/50 shadow-xs"
                    />
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-rose-600 dark:text-rose-400 block">Photo attached!</span>
                      Will be saved with this dare and ready to share with your team.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={photoUploadInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleCompressAndSetPhoto(e.target.files[0])}
                      className="hidden"
                    />
                    <input
                      ref={photoCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => e.target.files?.[0] && handleCompressAndSetPhoto(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoCameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-rose-400 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-500" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoUploadInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-rose-400 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Generator Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gemini AI Brainstormer ({personaInfo.title})</span>
              </div>
              <button
                onClick={handleFetchAiSuggestions}
                disabled={isLoadingAi}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                <span>{isLoadingAi ? 'Generating...' : 'Get Ideas'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Need inspiration? AI generates ideas tailored to your {personaInfo.title} path and {currentCycleCoins} coins.
            </p>

            {aiError && <div className="mt-2 text-xs text-rose-500">{aiError}</div>}

            {aiSuggestions.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => applyAiSuggestion(s)}
                    className="p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900 hover:border-amber-400 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {s.title}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold shrink-0">
                        {s.actionMetric}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Review Later
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCommit(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Log & Keep Coins
            </button>

            <button
              onClick={() => handleCommit(true)}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log & Reset Jar for Next {cycleNoun}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
