import React from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import { CHARITY_AGGREGATORS, getCharityById } from '../utils/charities';
import { sanitizeUrl } from '../utils/security';
import { PHILOSOPHY_CONFIGS, getPhilosophyCombinedLabel } from '../utils/philosophyLabels';
import {
  Heart,
  Zap,
  Crown,
  Target,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Gift,
  Flame,
  Globe,
  Coins,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface PhilosophyTargetCardProps {
  onOpenEditModal: () => void;
  onOpenReviewModal: () => void;
}

export const PhilosophyTargetCard: React.FC<PhilosophyTargetCardProps> = ({
  onOpenEditModal,
  onOpenReviewModal,
}) => {
  const { settings, currentMonthCoins, formatCurrency } = useMuteJar();

  const labelInfo = getPhilosophyCombinedLabel(settings.persona, settings.philosophyLabelStyle);

  // SAINT (Charity Donation)
  if (settings.persona === 'saint') {
    const targetCoins = settings.saintTargetCoins || 20;
    const isTargetMet = currentMonthCoins >= targetCoins;
    const progressPercent = Math.min(100, Math.round((currentMonthCoins / targetCoins) * 100));
    const estimatedDonationValue = formatCurrency(currentMonthCoins * settings.perCoinValue);
    const targetDonationValue = formatCurrency(targetCoins * settings.perCoinValue);

    const charityAgg = getCharityById(settings.selectedCharityId) || CHARITY_AGGREGATORS[0];
    const charityName = settings.customCharityName || charityAgg.name;
    const charityUrl = sanitizeUrl(settings.customCharityUrl || charityAgg.url);

    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-800/80 shadow-xs flex-1 flex flex-col justify-between transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Heart className="w-3.5 h-3.5 text-sky-500 fill-sky-500/20" />
              <span>Charity Donation Target</span>
            </span>
            <button
              onClick={onOpenEditModal}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Charity</span>
            </button>
          </div>

          {/* Charity Card Info */}
          <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 mb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400">
                  Beneficiary Non-Profit / Aggregator
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {charityName}
                </h3>
              </div>
              {charityUrl && (
                <a
                  href={charityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-slate-700 border border-sky-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1 shrink-0 shadow-2xs"
                  title="Open official donation platform"
                >
                  <Globe className="w-3 h-3" />
                  <span>Visit</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
              {settings.customCharityName ? 'Direct user-chosen charitable initiative.' : charityAgg.feeInfo}
            </p>
          </div>

          {/* Target Threshold in Mutecoins & Currency */}
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-sky-500" />
              <span>Donation Threshold:</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {targetCoins} Mutecoins <span className="text-slate-400 font-normal">({targetDonationValue})</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>
              Current: <strong className="font-mono text-slate-900 dark:text-white">{currentMonthCoins}</strong> / {targetCoins} coins
            </span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              {estimatedDonationValue} pledged
            </span>
          </div>
        </div>

        {/* Milestone Callout */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {isTargetMet ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Threshold met! Ready to donate {estimatedDonationValue}.</span>
              </div>
              <button
                onClick={onOpenReviewModal}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
              >
                Donate Now
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{targetCoins - currentMonthCoins} more coins until donation trigger</span>
              <button
                onClick={onOpenEditModal}
                className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                Adjust Threshold
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PRAGMATIST (The Habit Builder - Productivity / Learning Goal)
  if (settings.persona === 'pragmatist') {
    const targetCoins = settings.pragmatistTargetCoins || 25;
    const isTargetMet = currentMonthCoins >= targetCoins;
    const progressPercent = Math.min(100, Math.round((currentMonthCoins / targetCoins) * 100));
    const goalTitle = settings.pragmatistGoalTitle || '50 Pushups & 100 Pages Read';
    const goalDesc = settings.pragmatistGoalDescription || 'Convert each Mutecoin into personal growth, fitness, and daily reading habits.';

    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800/80 shadow-xs flex-1 flex flex-col justify-between transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              <span>Habit Goal · {labelInfo.title}</span>
            </span>
            <button
              onClick={onOpenEditModal}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Goal</span>
            </button>
          </div>

          {/* Goal Display */}
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Active Productivity / Learning Goal
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {goalTitle}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
              {goalDesc}
            </p>
          </div>

          {/* Target Threshold in Mutecoins (NOT currency) */}
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>Milestone Target:</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {targetCoins} Mutecoins <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">(slip-up accountability)</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetMet
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>
              Progress: <strong className="font-mono text-slate-900 dark:text-white">{currentMonthCoins}</strong> / {targetCoins} coins
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {progressPercent}% towards milestone
            </span>
          </div>
        </div>

        {/* Milestone Callout */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {isTargetMet ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Habit milestone hit! Time to log your {goalTitle} reps.</span>
              </div>
              <button
                onClick={onOpenReviewModal}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
              >
                Log Action
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{targetCoins - currentMonthCoins} more coins to reach habit milestone</span>
              <button
                onClick={onOpenEditModal}
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Adjust Target
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ROAST MASTER (The Forfeit Master - Team Activity / Social Dare)
  const targetCoins = settings.roastTargetCoins || 15;
  const isTargetMet = currentMonthCoins >= targetCoins;
  const progressPercent = Math.min(100, Math.round((currentMonthCoins / targetCoins) * 100));
  const activityTitle = settings.roastActivityTitle || 'Friday Gourmet Donuts & Coffee for the Team';
  const activityDesc = settings.roastActivityDescription || 'Bring fresh pastries and morning coffees to Friday standup when target is reached.';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800/80 shadow-xs flex-1 flex flex-col justify-between transition-all">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span>Team Activity · {labelInfo.title}</span>
          </span>
          <button
            onClick={onOpenEditModal}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Activity</span>
          </button>
        </div>

        {/* Activity Display */}
        <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Active Team Activity / Social Dare
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {activityTitle}
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
            {activityDesc}
          </p>
        </div>

        {/* Target Threshold in Mutecoins (NOT currency) */}
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-rose-500" />
            <span>Forfeit Trigger Target:</span>
          </span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {targetCoins} Mutecoins <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">(team forfeit trigger)</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTargetMet
                ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                : 'bg-gradient-to-r from-rose-500 to-pink-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          <span>
            Accumulated: <strong className="font-mono text-slate-900 dark:text-white">{currentMonthCoins}</strong> / {targetCoins} coins
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            {progressPercent}% towards forfeit trigger
          </span>
        </div>
      </div>

      {/* Milestone Callout */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        {isTargetMet ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-[11px]">
            <div className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold">
              <Crown className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Forfeit unlocked! You owe the team {activityTitle}.</span>
            </div>
            <button
              onClick={onOpenReviewModal}
              className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
            >
              Claim Forfeit
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{targetCoins - currentMonthCoins} more coins before forfeit is triggered</span>
            <button
              onClick={onOpenEditModal}
              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              Adjust Target
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
