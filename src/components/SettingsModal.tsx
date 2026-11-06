import React from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import { PersonaType, CycleFrequency } from '../types';
import { PersonaChangePromptModal } from './PersonaChangePromptModal';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Shield,
  Heart,
  Zap,
  Crown,
  Bell,
  Trash2,
  Sparkles,
  AlertTriangle,
  Monitor,
  Sliders,
  Wand2,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { POPULAR_CURRENCIES, detectLocalCurrency, getCurrencySymbol } from '../utils/localeCurrency';
import { getCurrentBuildId, purgeAllLocalCacheNow } from '../utils/buildCacheManager';

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenBackgroundGuide?: () => void;
}> = ({ isOpen, onClose, onOpenBackgroundGuide }) => {
  const {
    settings,
    updateSettings,
    formatCurrency,
    deleteUserProfileAndWipeAllData,
    calibrateRoomNoise,
    audioState,
    currentCycle,
    cycleNoun,
    requestPersonaChange,
    confirmPersonaChange,
    cancelPendingPersonaChange,
  } = useMuteJar();
  const [showWipeDialog, setShowWipeDialog] = React.useState(false);
  const [wipeConfirmWord, setWipeConfirmWord] = React.useState('');
  const [calibratedNotice, setCalibratedNotice] = React.useState<string | null>(null);
  const [promptPersona, setPromptPersona] = React.useState<PersonaType | null>(null);
  const [showPromptModal, setShowPromptModal] = React.useState(false);

  if (!isOpen) return null;

  const isImproved = settings.philosophyLabelStyle !== 'classic';

  const personas = [
    {
      id: 'saint' as PersonaType,
      title: 'The Saint',
      altTitle: 'Charity Impact',
      tagline: 'Charity & Giving',
      icon: Heart,
      accent: 'border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
      badge: 'bg-sky-500 text-white',
    },
    {
      id: 'pragmatist' as PersonaType,
      title: isImproved ? 'The Habit Builder' : 'The Pragmatist',
      altTitle: isImproved ? 'formerly The Pragmatist' : 'Habit Milestone',
      tagline: 'Habits & Productivity',
      icon: Zap,
      accent: 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
      badge: 'bg-amber-500 text-white',
    },
    {
      id: 'roastmaster' as PersonaType,
      title: isImproved ? 'The Forfeit Master' : 'The Roast Master',
      altTitle: isImproved ? 'formerly The Roast Master' : 'Team Treats & Dares',
      tagline: 'Team Dares & Treats',
      icon: Crown,
      accent: 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
      badge: 'bg-rose-500 text-white',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Mute Jar Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize your jar philosophy, audio sensitivity, and reminders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Active Persona Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 dark:text-white">
                Active Mute Philosophy
              </label>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]">
                <button
                  type="button"
                  onClick={() => updateSettings({ philosophyLabelStyle: 'improved' })}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    isImproved
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Use action-focused improved names (The Habit Builder, The Forfeit Master)"
                >
                  Action Labels
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ philosophyLabelStyle: 'classic' })}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    !isImproved
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Use original names (The Pragmatist, The Roast Master)"
                >
                  Classic Labels
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {personas.map((p) => {
                const Icon = p.icon;
                const isSelected = settings.persona === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      const res = requestPersonaChange(p.id);
                      if (res === 'confirmation_required') {
                        setPromptPersona(p.id);
                        setShowPromptModal(true);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? `${p.accent} shadow-xs ring-2 ring-amber-400/40`
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${p.badge} shadow-xs`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs">{p.title}</span>
                    <span className="text-[10px] opacity-75">{p.tagline}</span>
                  </div>
                );
              })}
            </div>

            {/* Pending Persona Change Banner if mid-cycle deferred */}
            {settings.pendingPersonaChange && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    Pending switch to <strong>{settings.pendingPersonaChange.nextPersona}</strong> at end of current {cycleNoun}.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => confirmPersonaChange(settings.pendingPersonaChange!.nextPersona, 'immediate')}
                    className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] cursor-pointer shadow-2xs"
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={cancelPendingPersonaChange}
                    className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 text-center">
              💡 Suggested naming: <strong>The Habit Builder</strong> (replaces Pragmatist for concrete habit reps) & <strong>The Forfeit Master</strong> (replaces Roast Master for team treats & dares).
            </p>
          </div>

          {/* Sound & Audio Calibration */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                Sound FX on Coin Deposit
              </span>
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className="cursor-pointer"
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Sound Volume</span>
                <span className="font-mono">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!settings.soundEnabled}
                value={settings.soundVolume}
                onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Speech Sensitivity Threshold</span>
                <span className="font-mono">Level {settings.sensitivity} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={settings.sensitivity}
                onChange={(e) => updateSettings({ sensitivity: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Background Noise Filter */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Background Noise Filter
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.filterRadioBackground !== false}
                onChange={(e) => updateSettings({ filterRadioBackground: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Distinguishes near-field speaker voice from ambient background noise, conversations, podcasts, or media. The trigger threshold dynamically floats above background noise.
            </p>

            {/* Proximity mode */}
            <div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Microphone Distance Profile
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {[
                  { id: 'near_field', label: 'Desk Mic', desc: '20-40cm' },
                  { id: 'headset', label: 'Headset', desc: '<10cm' },
                  { id: 'standard', label: 'Room Mic', desc: 'Quiet room' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      updateSettings({
                        microphoneMode: mode.id as 'near_field' | 'headset' | 'standard',
                      })
                    }
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      (settings.microphoneMode || 'near_field') === mode.id
                        ? 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div>{mode.label}</div>
                    <div className="text-[10px] opacity-70">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Delta Margin */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                <span>Voice-to-Background Margin</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  +{settings.noiseFloorMargin || 15}% above background
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                step="1"
                value={settings.noiseFloorMargin || 15}
                onChange={(e) => updateSettings({ noiseFloorMargin: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Quick 2-second calibration */}
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {settings.calibratedNoiseFloor
                  ? `Locked Background Floor: ${settings.calibratedNoiseFloor}%`
                  : 'Floor: Auto-adaptive tracking'}
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await calibrateRoomNoise();
                    setCalibratedNotice(`Background noise floor calibrated at ${res.averageFloor}%!`);
                    setTimeout(() => setCalibratedNotice(null), 4000);
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                disabled={audioState.isCalibrating}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>
                  {audioState.isCalibrating
                    ? `Calibrating ${audioState.calibrationProgress}%...`
                    : 'Learn Background Noise (2s)'}
                </span>
              </button>
            </div>

            {calibratedNotice && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {calibratedNotice}
              </p>
            )}
          </div>

          {/* Configurable Cycle Frequency & Review Scheduling */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Mute Jar Cycle Frequency
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
                Active: {currentCycle.label}
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Configure how often your Mute Jar cycles close for review and redemption (weekly, fortnightly, or monthly):
            </p>

            {/* Cycle Interval Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'weekly' as CycleFrequency, label: 'Weekly', desc: 'Every 7 Days' },
                { id: 'fortnightly' as CycleFrequency, label: 'Fortnightly', desc: 'Every 14 Days' },
                { id: 'monthly' as CycleFrequency, label: 'Monthly', desc: 'Calendar Month' },
              ].map((freq) => {
                const isSelected = (settings.cycleFrequency || 'monthly') === freq.id;
                return (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => updateSettings({ cycleFrequency: freq.id })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold shadow-2xs ring-2 ring-amber-400/40'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{freq.label}</div>
                    <div className="text-[10px] opacity-75">{freq.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/80 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Monthly Review Day (if Monthly)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.reminderDay}
                  onChange={(e) =>
                    updateSettings({
                      reminderDay: Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 28)),
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Local System Currency
                </label>
                <div className="flex gap-2">
                  <select
                    value={settings.currencyCode || 'USD'}
                    onChange={(e) => {
                      const code = e.target.value;
                      const sym = getCurrencySymbol(code);
                      updateSettings({ currencyCode: code, currency: sym });
                    }}
                    className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-xs"
                  >
                    {POPULAR_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const detected = detectLocalCurrency();
                      updateSettings({
                        currencyCode: detected.currencyCode,
                        currency: detected.symbol,
                        country: detected.countryCode,
                      });
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shrink-0"
                    title="Auto-detect currency from system settings"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Current rate: {formatCurrency(settings.perCoinValue)} per mute coin</span>
              <span className="font-mono text-[10px] text-slate-400">Code: {settings.currencyCode}</span>
            </div>
          </div>

          {/* Auto-Start Configuration (Enabled by Default) */}
          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Auto-Start & Background Modes
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Default: Enabled
              </span>
            </div>

            {/* Toggle 1: Auto-start audio monitor */}
            <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                  Auto-Start Voice Monitor on Launch
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Automatically activates speech-on-mute detection as soon as app opens.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoStartMonitoring ?? true}
                onChange={(e) => updateSettings({ autoStartMonitoring: e.target.checked })}
                className="mt-1 w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Toggle 2: OS autostart on restart */}
            <label className="flex items-start justify-between gap-3 cursor-pointer select-none pt-2 border-t border-sky-100 dark:border-sky-900/40">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                  Launch on OS Startup (Windows / macOS / ChromeOS)
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Silently starts Mute Jar in the OS tray / status bar when your computer boots up.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoStartOnOSBoot ?? true}
                onChange={(e) => updateSettings({ autoStartOnOSBoot: e.target.checked })}
                className="mt-1 w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
              />
            </label>

            {onOpenBackgroundGuide && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onOpenBackgroundGuide();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 transition-colors shrink-0 cursor-pointer"
                >
                  View OS Distribution & Autostart Guide →
                </button>
              </div>
            )}
          </div>

          {/* Privacy Statement Review */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                Privacy & Data Security
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Audio is analyzed strictly in volatile memory on this device. No speech is transcribed, saved, or sent anywhere.
              </p>
            </div>
          </div>

          {/* Build Version & Cache Management */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <HardDrive className="w-4 h-4 text-amber-500" />
                <span>Build Version &amp; Local Cache Lifecycle</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                {getCurrentBuildId()}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Automated cache clearance active:</strong> Every time a new build is deployed or launched, all locally cached data (<code className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">localStorage</code>, session cache, and service worker caches) is automatically purged to guarantee a clean slate without stale states.
            </p>
            <div className="pt-1 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Need to start completely fresh right now?
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all locally cached data and reload the app?')) {
                    purgeAllLocalCacheNow();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Cache Now</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Wipe Profile */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Immutable Ledger & Danger Zone</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              To preserve honesty and accountability, individual past mutes cannot be selectively altered or deleted. The only way to undo your mute history is to completely delete your user profile and wipe all data.
            </p>

            <button
              onClick={() => {
                setWipeConfirmWord('');
                setShowWipeDialog(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete User Profile & Wipe All Data</span>
            </button>
          </div>

          {/* Confirmation Warning Modal */}
          {showWipeDialog && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-rose-500 shadow-2xl text-xs space-y-4">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Permanent Wipe Warning</span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  This will permanently delete your user profile, all past mute event logs, custom meeting schedules, and completed pledge histories from this device.
                </p>

                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-800 dark:text-rose-300 text-[11px]">
                  Type <strong className="font-mono">WIPE</strong> below to confirm deletion:
                </div>

                <input
                  type="text"
                  placeholder='Type "WIPE" to confirm'
                  value={wipeConfirmWord}
                  onChange={(e) => setWipeConfirmWord(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase font-bold"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowWipeDialog(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={wipeConfirmWord.trim().toUpperCase() !== 'WIPE'}
                    onClick={() => {
                      deleteUserProfileAndWipeAllData();
                      setShowWipeDialog(false);
                      onClose();
                    }}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-colors cursor-pointer"
                  >
                    Permanently Wipe Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      <PersonaChangePromptModal
        isOpen={showPromptModal}
        targetPersona={promptPersona}
        onClose={() => {
          setShowPromptModal(false);
          setPromptPersona(null);
        }}
      />
    </div>
  );
};
