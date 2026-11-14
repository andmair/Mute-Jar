import React from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import { getPhilosophyCombinedLabel } from '../utils/philosophyLabels';
import { CHARITY_AGGREGATORS, getCharityById } from '../utils/charities';
import { sanitizeUrl } from '../utils/security';
import {
  Coins,
  Plus,
  RotateCcw,
  Target,
  Heart,
  Crown,
  Zap,
  Gift,
  ExternalLink,
  Edit3,
  Mic,
  MicOff,
  Play,
  Pause,
  Moon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LiveActionGoalHubProps {
  onOpenTargetModal: () => void;
  onOpenReviewModal: () => void;
  onOpenSettingsModal?: () => void;
}

export const LiveActionGoalHub: React.FC<LiveActionGoalHubProps> = ({
  onOpenTargetModal,
  onOpenReviewModal,
  onOpenSettingsModal,
}) => {
  const {
    settings,
    currentMonthCoins,
    currentCycle,
    cycleNoun,
    formatCurrency,
    audioState,
    startListening,
    stopListening,
    addMuteCoin,
    undoMuteCoin,
    activeGraceRecord,
    graceSecondsLeft,
  } = useMuteJar();

  const philosophyInfo = getPhilosophyCombinedLabel(settings.persona, settings.philosophyLabelStyle);

  const handleToggleListening = async () => {
    if (audioState.isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  // Persona Target & Progress Calculations
  const saintTargetCoins = settings.saintTargetCoins || 20;
  const pragmatistTargetCoins = settings.pragmatistTargetCoins || 25;
  const roastTargetCoins = settings.roastTargetCoins || 15;

  let activeTargetCoins = pragmatistTargetCoins;
  let isTargetReached = false;
  let progressPercent = 0;

  if (settings.persona === 'saint') {
    activeTargetCoins = saintTargetCoins;
    isTargetReached = currentMonthCoins >= saintTargetCoins;
    progressPercent = Math.min(100, Math.round((currentMonthCoins / saintTargetCoins) * 100));
  } else if (settings.persona === 'roastmaster') {
    activeTargetCoins = roastTargetCoins;
    isTargetReached = currentMonthCoins >= roastTargetCoins;
    progressPercent = Math.min(100, Math.round((currentMonthCoins / roastTargetCoins) * 100));
  } else {
    activeTargetCoins = pragmatistTargetCoins;
    isTargetReached = currentMonthCoins >= pragmatistTargetCoins;
    progressPercent = Math.min(100, Math.round((currentMonthCoins / pragmatistTargetCoins) * 100));
  }

  const remainingCoins = Math.max(0, activeTargetCoins - currentMonthCoins);

  // Charity information for Saint
  const charityAgg = getCharityById(settings.selectedCharityId) || CHARITY_AGGREGATORS[0];
  const charityName = settings.customCharityName || charityAgg.name;
  const charityUrl = sanitizeUrl(settings.customCharityUrl || charityAgg.url);

  return (
    <div className="w-full flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Top Status Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        {/* Audio Monitor Glance */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              audioState.isListening
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title={audioState.isListening ? 'Click to pause audio monitor' : 'Click to start audio monitor'}
            aria-label={audioState.isListening ? 'Pause audio monitor' : 'Start audio monitor'}
          >
            {audioState.isListening ? (
              <Mic className="w-4 h-4 animate-pulse" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <span>{audioState.isListening ? 'Voice Monitor Active' : 'Voice Monitor Paused'}</span>
              {audioState.isDoNotDisturbActive && (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5">
                  <Moon className="w-2.5 h-2.5" />
                  <span>DND</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {audioState.isListening ? 'Detecting speech while muted' : 'Click mic to resume'}
            </div>
          </div>
        </div>

        {/* Cycle Date Glance */}
        <div className="text-right shrink-0 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            {currentCycle.label}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
            {currentCycle.daysRemaining} days remaining
          </span>
        </div>
      </div>

      {/* Task #1: Instant Meeting Action (Quick Drop + Undo) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Spoke on Mute?</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            1 Mutecoin = {formatCurrency(settings.perCoinValue)}
          </span>
        </div>

        {/* Primary Action Button Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Tactile +1 Coin Drop Button */}
          <button
            type="button"
            onClick={() => addMuteCoin(undefined, 'manual')}
            className="w-full h-12 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-tight flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/25 transition-all cursor-pointer active:scale-98"
            title="Log a mute event manually (adds 1 Mutecoin to jar)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Drop Coin (+1)</span>
          </button>

          {/* Instant 5-Second Undo Button / State */}
          {activeGraceRecord ? (
            <button
              type="button"
              onClick={() => undoMuteCoin()}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 dark:bg-amber-400 text-amber-300 dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 border border-amber-400/50 shadow-md transition-all cursor-pointer animate-pulse active:scale-98"
              title="Cancel last coin deposit (Press ⌘Z / Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
              <div className="text-left leading-tight">
                <div>Undo Last Coin</div>
                <div className="text-[10px] opacity-80 font-mono">
                  Auto-locks in {graceSecondsLeft}s · ⌘Z
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => undoMuteCoin()}
              className="w-full h-12 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Undo the most recent coin deposit from history"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Undo Last Drop</span>
            </button>
          )}
        </div>
      </div>

      {/* Task #3: Goal Milestone Progress Bar & Payout Shortcut */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              {settings.persona === 'saint' ? (
                <Heart className="w-3.5 h-3.5 text-sky-500 fill-sky-500/20" />
              ) : settings.persona === 'roastmaster' ? (
                <Crown className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {settings.persona === 'saint'
                  ? 'Charity Donation Goal'
                  : settings.persona === 'roastmaster'
                  ? 'Team Dare Challenge'
                  : 'Milestone Goal'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate block text-xs">
                {settings.persona === 'saint'
                  ? charityName
                  : settings.persona === 'roastmaster'
                  ? (settings.roastActivityTitle || 'Sing meeting intro in standup')
                  : (settings.pragmatistGoalTitle || 'Team Coffee & Treats')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTargetModal}
            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {/* Progress Meter Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-600 dark:text-slate-400">
              {currentMonthCoins} of {activeTargetCoins} coins
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetReached
                  ? 'bg-emerald-500'
                  : settings.persona === 'saint'
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Milestone Narrative & Action */}
        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isTargetReached ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Target reached! Ready to redeem</span>
              </span>
            ) : (
              <span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{remainingCoins}</strong> more {remainingCoins === 1 ? 'coin' : 'coins'} to unlock
              </span>
            )}
          </span>

          {settings.persona === 'saint' && charityUrl && (
            <a
              href={charityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Visit Platform</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Bottom Summary & Review CTA */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs">
          <span className="text-slate-400 text-[11px] block">Cycle Total</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-base">
            {currentMonthCoins} Coins
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono ml-1.5 font-bold">
            ({formatCurrency(currentMonthCoins * settings.perCoinValue)})
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenReviewModal}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Gift className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
          <span>Review Jar</span>
        </button>
      </div>
    </div>
  );
};
