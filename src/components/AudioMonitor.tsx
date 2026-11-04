import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMuteJar } from '../context/MuteJarContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  MonitorUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles,
  HelpCircle,
  Wand2,
  Headphones,
  Info,
} from 'lucide-react';

export const AudioMonitor: React.FC<{ onOpenCalendarModal: () => void }> = ({
  onOpenCalendarModal,
}) => {
  const {
    settings,
    updateSettings,
    audioState,
    startListening,
    stopListening,
    calibrateRoomNoise,
    toggleMeetingAudio,
    activeGraceRecord,
    graceSecondsLeft,
    undoMuteCoin,
  } = useMuteJar();

  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [calibrationSuccessMessage, setCalibrationSuccessMessage] = useState<string | null>(null);

  const handleToggleListening = async () => {
    setMicPermissionError(false);
    if (audioState.isListening) {
      stopListening();
    } else {
      const ok = await startListening();
      if (!ok) {
        setMicPermissionError(true);
      }
    }
  };

  const handleRunCalibration = async () => {
    setCalibrationSuccessMessage(null);
    try {
      const result = await calibrateRoomNoise();
      setCalibrationSuccessMessage(
        `Calibrated! Background noise floor set at ${result.averageFloor}%. Trigger threshold dynamically raised to ${result.averageFloor + (settings.noiseFloorMargin || 15)}%.`
      );
      setTimeout(() => {
        setCalibrationSuccessMessage(null);
      }, 7000);
    } catch (e) {
      console.warn('Calibration error:', e);
    }
  };

  const handleResetCalibration = () => {
    updateSettings({ calibratedNoiseFloor: 0 });
    setCalibrationSuccessMessage('Calibration reset to automatic background tracking.');
    setTimeout(() => {
      setCalibrationSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="relative w-full">
      {/* 5-Second Grace Window Toast (Floating Alert) */}
      <AnimatePresence>
        {activeGraceRecord && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                  <MicOff className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    MuteCoin Added · {activeGraceRecord.meetingTitle}
                  </div>
                  <div className="text-[11px] font-medium opacity-90">
                    Auto-confirming in {graceSecondsLeft}s...
                  </div>
                </div>
              </div>

              <button
                onClick={() => undoMuteCoin()}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Undo (I was unmuted)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Monitoring Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Left */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                audioState.isListening
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {audioState.isListening ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {audioState.isListening
                    ? 'Automated Audio Monitor Active'
                    : 'Audio Monitor Paused'}
                </span>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    audioState.isListening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                {settings.filterRadioBackground !== false && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-sky-500" />
                    <span>Background Filter Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {audioState.isListening
                  ? 'Distinguishing near-field desk speech from ambient background noise'
                  : 'Monitoring paused · Auto-starts on launch'}
              </p>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick 1-Click "Learn Background Noise" Calibration Button */}
            <button
              onClick={handleRunCalibration}
              disabled={audioState.isCalibrating}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                audioState.isCalibrating
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
              }`}
              title="Record 2 seconds of ambient room background noise to lock in the baseline filter"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {audioState.isCalibrating
                  ? `Sampling Background Noise... ${audioState.calibrationProgress}%`
                  : 'Learn Background Noise'}
              </span>
            </button>

            {/* Start / Stop Toggle Button */}
            <button
              onClick={handleToggleListening}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                audioState.isListening
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {audioState.isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start</span>
                </>
              )}
            </button>

            {/* Optional Meeting Audio Share Button */}
            <button
              onClick={toggleMeetingAudio}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                audioState.hasMeetingAudio
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={
                audioState.hasMeetingAudio
                  ? 'Meeting tab audio connected'
                  : 'Connect meeting tab audio for dual-stream detection'
              }
            >
              <MonitorUp className="w-4 h-4" />
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettingsDrawer((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showSettingsDrawer
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Radio background filter, calibration, and sensitivity"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calibration Success Notice */}
        {calibrationSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{calibrationSuccessMessage}</span>
            </div>
            {settings.calibratedNoiseFloor ? (
              <button
                onClick={handleResetCalibration}
                className="text-[11px] font-bold underline hover:text-emerald-950 dark:hover:text-white cursor-pointer shrink-0"
              >
                Reset to Auto
              </button>
            ) : null}
          </div>
        )}

        {/* Permission Error Callout */}
        {micPermissionError && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Microphone access blocked:</strong> Please allow microphone access in your
              browser address bar to detect talking on mute.
            </div>
          </div>
        )}

        {/* Live Audio Visualizer with Dual Baseline (Radio Floor vs Direct Speech) */}
        {audioState.isListening && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <span>Mic Volume</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">
                  {audioState.micLevel}%
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <Sliders className="w-3 h-3" />
                  <span>Background Floor: {audioState.noiseFloor || 10}%</span>
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Trigger Threshold: <strong className="text-rose-600 dark:text-rose-400">{audioState.threshold}%</strong>
              </span>
            </div>

            {/* Visualizer Track with Dual-Zone Display */}
            <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              {/* Background Noise Floor Zone */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-indigo-500/20 dark:bg-indigo-500/30 border-r border-indigo-400/50 transition-all duration-300"
                style={{ width: `${Math.min(100, audioState.noiseFloor || 10)}%` }}
                title={`Ambient background noise floor: ${audioState.noiseFloor}% (ignored)`}
              />

              {/* Dynamic Live Voice Volume Level Fill */}
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  audioState.micLevel >= audioState.threshold
                    ? 'bg-amber-500 shadow-sm shadow-amber-500'
                    : audioState.micLevel > (audioState.noiseFloor || 10)
                    ? 'bg-emerald-500'
                    : 'bg-indigo-400/60'
                }`}
                style={{ width: `${Math.min(100, audioState.micLevel)}%` }}
              />

              {/* Threshold indicator line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-rose-500 z-10 shadow-xs"
                style={{ left: `${audioState.threshold}%` }}
                title={`Trigger threshold: ${audioState.threshold}% (speech must exceed this line)`}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              <span>
                {audioState.micLevel < audioState.threshold ? (
                  audioState.micLevel > (audioState.noiseFloor || 10) ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Voice detected, below threshold (+{audioState.threshold - audioState.micLevel}% needed)
                    </span>
                  ) : (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      Background noise filtered out safely
                    </span>
                  )
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-bold animate-pulse">
                    ⚠️ Near-field direct speech detected!
                  </span>
                )}
              </span>

              <button
                onClick={() => setShowExplanation((prev) => !prev)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>How is background noise filtered?</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Educational Box: How Speech is Distinguished from Background Noise */}
        {showExplanation && (
          <div className="mt-4 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-100">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>How Mute Jar Distinguishes Your Voice from Background Noise</span>
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-[11px] leading-relaxed opacity-95">
              Distinguishing between a live speaker sitting at the desk and ambient background noise (such as radio, podcasts, TV, or room chatter) relies on four acoustic differences:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] mt-1">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-200/80 dark:border-indigo-900/60">
                <strong className="text-indigo-900 dark:text-indigo-200 block mb-0.5">
                  1. Adaptive Noise Floor (SNR Delta)
                </strong>
                The engine continuously learns steady room sounds (background voices, media, HVAC). The trigger threshold dynamically floats <em>above</em> the background noise, keeping ambient sounds below the trigger line.
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-200/80 dark:border-indigo-900/60">
                <strong className="text-indigo-900 dark:text-indigo-200 block mb-0.5">
                  2. Near-Field Speech Onset Dynamics
                </strong>
                When you speak into your desk mic (20–40 cm away), your voice exhibits rapid plosive bursts (+20% in &lt;40ms). In contrast, far-field background noise arrives diffuse, compressed, and reverberant.
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-200/80 dark:border-indigo-900/60">
                <strong className="text-indigo-900 dark:text-indigo-200 block mb-0.5">
                  3. Browser AGC Limiting
                </strong>
                We disable WebRTC digital Auto-Gain Control (AGC). By default, browsers amplify quiet rooms by up to +20dB, artificially boosting distant background sounds. Disabling AGC keeps distant background noise quiet.
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-200/80 dark:border-indigo-900/60">
                <strong className="text-indigo-900 dark:text-indigo-200 block mb-0.5">
                  4. One-Click "Learn Background Noise" Calibration
                </strong>
                Click <strong>"Learn Background Noise"</strong> while normal ambient sounds are present. The app samples 2 seconds of room audio and locks in the exact floor to ignore.
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Calibration & Audio Settings Drawer */}
        {showSettingsDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            {/* Row 1: Background Noise Filter Toggle & Microphone Proximity Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Background Noise Filter Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Filter Ambient Background Noise</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.filterRadioBackground !== false}
                    onChange={(e) => updateSettings({ filterRadioBackground: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically raises trigger threshold above ambient room noise, chatter, or media.
                </p>
              </div>

              {/* Microphone Proximity Profile */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <label className="font-bold text-slate-900 dark:text-white block mb-1.5">
                  Microphone Proximity Profile
                </label>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
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
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        (settings.microphoneMode || 'near_field') === mode.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div>{mode.label}</div>
                      <div className="text-[9px] opacity-70">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Sliders for Mic Sensitivity & Voice-to-Radio Margin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mic Sensitivity Slider */}
              <div>
                <div className="flex items-center justify-between mb-1 text-slate-700 dark:text-slate-300 font-medium">
                  <span>Base Sensitivity</span>
                  <span className="font-mono text-slate-500">Level {settings.sensitivity} / 10</span>
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
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Less sensitive (loud voice)</span>
                  <span>More sensitive (whispers)</span>
                </div>
              </div>

              {/* Voice-to-Background Margin Slider */}
              <div>
                <div className="flex items-center justify-between mb-1 text-slate-700 dark:text-slate-300 font-medium">
                  <span>Voice-to-Background Delta Margin</span>
                  <span className="font-mono text-slate-500">
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
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>+10% (Easier trigger)</span>
                  <span>+28% (Heavy background noise rejection)</span>
                </div>
              </div>
            </div>

            {/* Row 3: Sound FX Settings & Manual Calibration Reset */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-amber-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <div className="flex-1 min-w-[140px]">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span>Coin Chime Sound</span>
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
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={handleRunCalibration}
                  disabled={audioState.isCalibrating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Calibrate Background (2s)</span>
                </button>

                {settings.calibratedNoiseFloor ? (
                  <button
                    onClick={handleResetCalibration}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs cursor-pointer"
                  >
                    Reset Calibration
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Reassurance Banner */}
      <div className="mt-2 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>In-memory voice energy only · Not a transcription tool · No audio saved</span>
        </span>
        <button
          onClick={() => setShowExplanation((prev) => !prev)}
          className="hover:underline text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer"
        >
          Noise separation tips
        </button>
      </div>
    </div>
  );
};
