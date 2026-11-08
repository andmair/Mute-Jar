import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMuteJar } from '../context/MuteJarContext';
import { PersonaType } from '../types';
import { getPhilosophyCombinedLabel } from '../utils/philosophyLabels';
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  X,
  Heart,
  Zap,
  Crown,
  Calendar,
} from 'lucide-react';

interface PersonaChangePromptModalProps {
  isOpen: boolean;
  targetPersona: PersonaType | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PersonaChangePromptModal: React.FC<PersonaChangePromptModalProps> = ({
  isOpen,
  targetPersona,
  onClose,
  onSuccess,
}) => {
  const {
    settings,
    currentCycleCoins,
    currentCycle,
    cycleNoun,
    confirmPersonaChange,
  } = useMuteJar();

  if (!isOpen || !targetPersona) return null;

  const currentInfo = getPhilosophyCombinedLabel(settings.persona, settings.philosophyLabelStyle);
  const targetInfo = getPhilosophyCombinedLabel(targetPersona, settings.philosophyLabelStyle);

  const getPersonaIcon = (type: PersonaType) => {
    switch (type) {
      case 'saint':
        return <Heart className="w-4 h-4 text-sky-500" />;
      case 'roastmaster':
        return <Crown className="w-4 h-4 text-rose-500" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleChooseMode = (mode: 'immediate' | 'wait_for_cycle_end') => {
    confirmPersonaChange(targetPersona, mode);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Change Philosophy Mid-Cycle?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Active Stakes Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Active {cycleNoun}: {currentCycle.label}</span>
              </span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                {currentCycleCoins} coins in jar
              </span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              You already have <strong>{currentCycleCoins} Mutecoins</strong> deposited in your active jar. Your redemption path is currently locked to <strong>{currentInfo.title}</strong>.
            </p>
          </div>

          {/* Persona Shift Preview */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-2xs">
                {getPersonaIcon(settings.persona)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentInfo.title}</span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400" />

            <div className="flex items-center gap-2 text-right">
              <div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Target</span>
                <span className="font-bold text-slate-900 dark:text-white">{targetInfo.title}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-2xs">
                {getPersonaIcon(targetPersona)}
              </div>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            How would you like to handle your active jar coins?
          </p>

          {/* Action Choice Buttons */}
          <div className="space-y-2 pt-1">
            {/* Option 1: Wait Until End of Cycle (Recommended) */}
            <button
              onClick={() => handleChooseMode('wait_for_cycle_end')}
              className="w-full p-3 rounded-2xl border-2 border-amber-400 dark:border-amber-500/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Wait Until End of {cycleNoun}</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Complete this {cycleNoun.toLowerCase()} under <strong>{currentInfo.title}</strong>. Your jar will automatically transition to <strong>{targetInfo.title}</strong> as soon as this cycle resets.
              </p>
            </button>

            {/* Option 2: Switch Immediately */}
            <button
              onClick={() => handleChooseMode('immediate')}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch Immediately</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Convert active coins right away. Your active redemption path switches to <strong>{targetInfo.title}</strong> immediately.
              </p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
