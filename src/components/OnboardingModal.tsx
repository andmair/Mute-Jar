import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMuteJar } from '../context/MuteJarContext';
import { PersonaType } from '../types';
import {
  Shield,
  CheckCircle2,
  Lock,
  MicOff,
  Heart,
  Zap,
  Crown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { settings, updateSettings } = useMuteJar();

  // If already onboarded, do not display
  if (settings.hasCompletedOnboarding) return null;

  const [step, setStep] = useState<'privacy' | 'persona'>('privacy');
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(settings.persona || 'pragmatist');

  const handleConfirmPrivacy = () => {
    if (!consentChecked) return;
    updateSettings({
      privacyConsent: {
        hasConsented: true,
        consentedAt: Date.now(),
        version: '1.0',
      },
    });
    setStep('persona');
  };

  const handleFinishOnboarding = () => {
    const defaultTarget =
      selectedPersona === 'saint'
        ? {
            selectedCharityId: 'globalgiving',
            customCharityUrl: 'https://www.globalgiving.org',
            customCharityName: 'GlobalGiving Crisis & Education Fund',
            saintTargetCoins: 20,
            activeTargetTitle: 'Donation Target: GlobalGiving',
            activeTargetDescription: 'Donation threshold set at 20 MuteCoins for global humanitarian relief.',
          }
        : selectedPersona === 'roastmaster'
        ? {
            roastActivityTitle: 'Friday Gourmet Donuts & Coffee for the Team',
            roastActivityDescription:
              'Bring fresh artisanal pastries and barista coffees to the sprint team when threshold is reached.',
            roastTargetCoins: 15,
            activeTargetTitle: 'Friday Gourmet Donuts & Coffee for the Team',
            activeTargetDescription:
              'Treating the team to pastries & coffee for every 15 mute coins accumulated.',
          }
        : {
            pragmatistGoalTitle: '50 Pushups & 100 Pages Read',
            pragmatistGoalDescription:
              'Perform 5 pushups and read 10 book pages for every mute coin dropped this month.',
            pragmatistTargetCoins: 25,
            activeTargetTitle: '50 Pushups & 100 Pages Read',
            activeTargetDescription:
              'Convert each mute coin into personal growth, fitness, and daily reading habits.',
          };

    updateSettings({
      persona: selectedPersona,
      hasCompletedOnboarding: true,
      philosophyLabelStyle: 'improved',
      ...defaultTarget,
    });
  };

  const personas = [
    {
      id: 'saint' as PersonaType,
      title: 'The Saint',
      tagline: 'Charity & Giving',
      description: 'Turn awkward meeting slip-ups into real good. Each mute coin funds charitable donations to global causes.',
      icon: Heart,
      accent: 'border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
      badge: 'bg-sky-500 text-white',
      benefit: 'Default to GlobalGiving & Every.org donation links with 20 coin threshold',
    },
    {
      id: 'pragmatist' as PersonaType,
      title: 'The Habit Builder',
      subtitle: '(formerly The Pragmatist)',
      tagline: 'Productivity & Growth',
      description: 'Make yourself better with every mute. Convert mute coins into pushup reps, book pages, and focused habit streaks.',
      icon: Zap,
      accent: 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
      badge: 'bg-amber-500 text-white',
      benefit: 'Tracks personal growth & fitness goals with 25 mutecoin milestone',
    },
    {
      id: 'roastmaster' as PersonaType,
      title: 'The Forfeit Master',
      subtitle: '(formerly The Roast Master)',
      tagline: 'Humor & Team Fun',
      description: 'Keep the team laughing. If you speak on mute, you buy coffees, bring donuts, or do a playful lightning presentation.',
      icon: Crown,
      accent: 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
      badge: 'bg-rose-500 text-white',
      benefit: 'Sets team treat dares & funny forfeits with 15 mutecoin trigger',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Step Indicator Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl coin-shimmer flex items-center justify-center border border-amber-300 shadow-xs">
              <MicOff className="w-4 h-4 text-amber-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Welcome to Mute Jar
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'privacy'
                  ? 'Step 1 of 2 · Privacy Statement & Consent'
                  : 'Step 2 of 2 · Choose Your Mute Philosophy'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-1.5 rounded-full transition-colors ${
                step === 'privacy' ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
            <span
              className={`w-6 h-1.5 rounded-full transition-colors ${
                step === 'persona' ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'privacy' ? (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Privacy Guarantee Banner */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                    <div className="font-bold text-sm">Privacy Guarantee: 100% On-Device</div>
                    <p className="opacity-90">
                      Mute Jar is designed from the ground up to respect your confidentiality. Please review how your audio is processed:
                    </p>
                  </div>
                </div>

                {/* 3 Clear Disclosures */}
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block mb-0.5">
                        1. What Data is Stored
                      </strong>
                      Only numeric mute tallies, timestamps, meeting duration, and optional calendar meeting titles. All records are stored 100% locally in your browser’s localStorage.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <Zap className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block mb-0.5">
                        2. How Mutes are Detected
                      </strong>
                      The app uses the browser’s Web Audio API to measure audio amplitude and human vocal frequencies in volatile computer memory. Audio buffers are evaluated in real-time and immediately discarded.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block mb-0.5">
                        3. NOT a Transcription or Recording Tool
                      </strong>
                      The app contains no speech-to-text transcription engine. No words, spoken content, recordings, or meeting transcripts are ever captured, transcribed, or uploaded to any server.
                    </div>
                  </div>
                </div>

                {/* Mandatory Consent Checkbox */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-colors cursor-pointer select-none bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-amber-400">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    I understand that Mute Jar does not record or transcribe audio, and I consent to local in-memory voice activity monitoring.
                  </span>
                </label>

                {/* Continue button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleConfirmPrivacy}
                    disabled={!consentChecked}
                    className="px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-600 text-slate-950"
                  >
                    <span>Accept & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="persona"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Choose Your Mute Philosophy
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select the persona that guides your monthly mute coin pledges and jar styling. You can change this anytime.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {personas.map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedPersona === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersona(p.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? `${p.accent} shadow-md ring-2 ring-amber-400/50`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${p.badge} shadow-xs shrink-0 mt-0.5`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {p.title}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              · {p.tagline}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {p.description}
                          </p>
                          <div className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{p.benefit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setStep('privacy')}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Back to Privacy
                  </button>

                  <button
                    onClick={handleFinishOnboarding}
                    className="px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950"
                  >
                    <span>Complete Onboarding</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
