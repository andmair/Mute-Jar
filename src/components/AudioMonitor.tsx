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
  ChevronDown,
  Activity,
  UserCheck,
  Waves,
  Trash2,
  Fingerprint,
  Moon,
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
    calibrateVoiceProfile,
    clearVoiceProfile,
    toggleMeetingAudio,
    activeGraceRecord,
    graceSecondsLeft,
    undoMuteCoin,
  } = useMuteJar();

  const [showControls, setShowControls] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [calibrationSuccessMessage, setCalibrationSuccessMessage] = useState<string | null>(null);
  const [voiceTrainingSuccessMessage, setVoiceTrainingSuccessMessage] = useState<string | null>(null);

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

  const handleTrainVoice = async () => {
    setVoiceTrainingSuccessMessage(null);
    try {
      const profile = await calibrateVoiceProfile(3500);
      setVoiceTrainingSuccessMessage(
        `Voice pattern captured! Dominant pitch: ${profile.medianPitchHz} Hz (${profile.pitchRangeHz[0]}–${profile.pitchRangeHz[1]} Hz). Background talkers and radio voices are now rejected.`
      );
      setTimeout(() => {
        setVoiceTrainingSuccessMessage(null);
      }, 8000);
    } catch (e) {
      console.warn('Voice training error:', e);
    }
  };

  const handleClearVoice = () => {
    clearVoiceProfile();
    setVoiceTrainingSuccessMessage('Voice pattern cleared. All voices above volume threshold will now be detected.');
    setTimeout(() => {
      setVoiceTrainingSuccessMessage(null);
    }, 4000);
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
                    Mutecoin Added · {activeGraceRecord.meetingTitle}
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Status Left: Clean Title 'Audio Monitor', Mic Icon, Status Badge with Color */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                audioState.isListening
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {audioState.isListening ? (
                <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Audio Monitor
                </span>
                {/* Audio monitor status indicated by color and icon */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    audioState.isListening
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      audioState.isListening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{audioState.isListening ? 'Live' : 'Paused'}</span>
                </span>

                {/* OS Focus / Do Not Disturb Mode Active Badge */}
                {audioState.isDoNotDisturbActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    <Moon className="w-3 h-3 text-purple-500 animate-pulse" />
                    <span>Focus / DND Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {audioState.isListening
                  ? 'Distinguishing near-field desk speech from ambient background noise'
                  : audioState.isDoNotDisturbActive && settings.pauseOnDoNotDisturb !== false
                  ? 'Paused automatically by OS Focus / Do Not Disturb Mode'
                  : 'Monitoring off by default · Click Start to begin tracking'}
              </p>
            </div>
          </div>

          {/* Action Buttons Right: All neatly aligned on the SAME horizontal level */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Background Filter Toggle Button (replacing the misaligned active box) */}
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  filterRadioBackground: settings.filterRadioBackground === false ? true : false,
                })
              }
              className={`h-9 px-3 text-xs font-semibold rounded-xl border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                settings.filterRadioBackground !== false
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle ambient background noise filter on/off"
            >
              <Sliders
                className={`w-3.5 h-3.5 ${
                  settings.filterRadioBackground !== false
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-400'
                }`}
              />
              <span>Background Filter:</span>
              <span
                className={`font-bold ${
                  settings.filterRadioBackground !== false
                    ? 'text-sky-700 dark:text-sky-300'
                    : 'text-slate-400'
                }`}
              >
                {settings.filterRadioBackground !== false ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Voice Pattern / Voiceprint Quick Action Button */}
            <button
              type="button"
              onClick={() => {
                if (!settings.userVoiceProfile) {
                  handleTrainVoice();
                } else {
                  updateSettings({
                    voiceProfileEnabled: settings.voiceProfileEnabled === false ? true : false,
                  });
                }
              }}
              disabled={audioState.isVoiceCalibrating}
              className={`h-9 px-3 text-xs font-semibold rounded-xl border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                audioState.isVoiceCalibrating
                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 animate-pulse'
                  : settings.userVoiceProfile && settings.voiceProfileEnabled !== false
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                  : settings.userVoiceProfile
                  ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
              }`}
              title={
                !settings.userVoiceProfile
                  ? 'Capture your personal voice pattern (3.5s)'
                  : settings.voiceProfileEnabled !== false
                  ? 'Personal voice filter active · Click to pause voice matching'
                  : 'Personal voice filter paused · Click to enable voice matching'
              }
            >
              <Fingerprint className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Voiceprint:</span>
              <span className="font-bold">
                {audioState.isVoiceCalibrating
                  ? `${audioState.voiceCalibrationProgress}%`
                  : !settings.userVoiceProfile
                  ? 'Train (3.5s)'
                  : settings.voiceProfileEnabled !== false
                  ? 'ON'
                  : 'OFF'}
              </span>
            </button>

            {/* Quick 1-Click "Learn Background Noise" Calibration Button */}
            <button
              onClick={handleRunCalibration}
              disabled={audioState.isCalibrating}
              className={`h-9 px-3 text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer ${
                audioState.isCalibrating
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
              }`}
              title="Record 2 seconds of ambient room background noise to lock in the baseline filter"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {audioState.isCalibrating
                  ? `Sampling... ${audioState.calibrationProgress}%`
                  : 'Learn Noise'}
              </span>
            </button>

            {/* Start / Stop Toggle Button */}
            <button
              onClick={handleToggleListening}
              className={`h-9 px-3.5 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer ${
                audioState.isListening
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40'
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

            {/* Controls Button to Hide/Reveal Mic Volume Meter & Filter Controls */}
            <button
              type="button"
              onClick={() => setShowControls((prev) => !prev)}
              className={`h-9 px-3 text-xs font-semibold rounded-xl border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                showControls
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={
                showControls
                  ? 'Hide mic volume meter & filter controls'
                  : 'Reveal mic volume meter & filter controls'
              }
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>Controls</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showControls ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Optional Meeting Audio Share Button */}
            <button
              onClick={toggleMeetingAudio}
              className={`h-9 px-2.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center justify-center cursor-pointer ${
                audioState.hasMeetingAudio
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className={`h-9 px-2.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center justify-center cursor-pointer ${
                showSettingsDrawer
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="More audio options: mic proximity profile & chime sound"
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

        {/* Voice Profile Calibration Live Progress Banner */}
        {audioState.isVoiceCalibrating && (
          <div className="mt-3 p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 rounded-xl text-xs space-y-2 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span>Capturing your personal voice pattern... Please speak naturally for 3.5 seconds</span>
              </span>
              <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300">
                {audioState.voiceCalibrationProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-purple-200 dark:bg-purple-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${audioState.voiceCalibrationProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-300 flex items-center justify-between opacity-90">
              <span>Say: &quot;Hey team, I think we should check the deployment pipeline status...&quot;</span>
              <span>Say anything at your normal speaking volume</span>
            </div>
          </div>
        )}

        {/* Voice Profile Success Notice */}
        {voiceTrainingSuccessMessage && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>{voiceTrainingSuccessMessage}</span>
            </div>
            <button
              onClick={() => setVoiceTrainingSuccessMessage(null)}
              className="text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
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

        {/* Collapsible Mic Volume Meter & Filter Controls */}
        {showControls && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-fade-in">
            {/* Top row of meter: Real-time readouts and detection feedback */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Mic Volume:</span>
                  <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {audioState.micLevel}%
                  </span>
                </span>

                {/* Real-time status feedback */}
                {!audioState.isListening ? (
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    Monitoring paused (click Start above to detect speech)
                  </span>
                ) : audioState.micLevel >= audioState.threshold ? (
                  settings.userVoiceProfile && settings.voiceProfileEnabled !== false ? (
                    audioState.isSpeakerMatch ? (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                        ⚠️ Your voice detected on mute! ({audioState.voiceMatchScore}% match)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Fingerprint className="w-3.5 h-3.5 text-purple-600" />
                        Background voice filtered (Match: {audioState.voiceMatchScore}% &lt; {settings.voiceMatchThreshold || 65}%)
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                      ⚠️ Near-field voice detected!
                    </span>
                  )
                ) : audioState.micLevel > (audioState.noiseFloor || 10) ? (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                    Voice below threshold (+{audioState.threshold - audioState.micLevel}% needed)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                    Background noise filtered safely
                  </span>
                )}
              </div>

              {/* Dynamic Filter Readout Badges */}
              <div className="flex items-center gap-2 text-[11px] font-mono shrink-0 flex-wrap">
                {/* Voice Profile Match Badge */}
                {settings.userVoiceProfile && settings.voiceProfileEnabled !== false && (
                  <span
                    className={`px-2 py-0.5 rounded-md border flex items-center gap-1 font-semibold ${
                      audioState.isSpeakerMatch && audioState.micLevel > (audioState.noiseFloor || 10)
                        ? 'bg-purple-500/15 border-purple-400 text-purple-700 dark:text-purple-300'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                    title={`Real-time voice match score: ${audioState.voiceMatchScore}% (Target: >= ${settings.voiceMatchThreshold || 65}%). Live pitch: ${audioState.detectedPitchHz ? `${audioState.detectedPitchHz} Hz` : 'Scanning'}`}
                  >
                    <Fingerprint className="w-3 h-3 text-purple-500" />
                    <span>Match: {audioState.voiceMatchScore}%</span>
                    {audioState.detectedPitchHz ? (
                      <span className="text-[9px] opacity-75">({audioState.detectedPitchHz}Hz)</span>
                    ) : null}
                  </span>
                )}
                {settings.filterRadioBackground !== false && (
                  <span
                    className="px-2 py-0.5 rounded-md border flex items-center gap-1 font-semibold bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                    title="Learned ambient background noise floor"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Floor: {audioState.noiseFloor || 10}%
                  </span>
                )}
                <span
                  className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1"
                  title="Dynamic trigger threshold (speech must surpass this line to register)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Trigger: {audioState.threshold}%
                </span>
              </div>
            </div>

            {/* Visualizer Track with Dual-Zone Display */}
            <div className="space-y-1">
              <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
                {/* Background Noise Floor Zone */}
                {settings.filterRadioBackground !== false && (
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-indigo-500/25 dark:bg-indigo-500/35 border-r-2 border-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, audioState.noiseFloor || 10)}%` }}
                    title={`Ambient background noise floor: ${audioState.noiseFloor}% (ignored)`}
                  />
                )}

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
                  className="absolute top-0 bottom-0 w-1.5 bg-rose-500 z-10 shadow-xs rounded-full -translate-x-1/2"
                  style={{ left: `${audioState.threshold}%` }}
                  title={`Trigger threshold: ${audioState.threshold}% (speech must exceed this line)`}
                />
              </div>

              {/* Legend row */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 font-mono">
                <span>0% (Silence)</span>
                {settings.filterRadioBackground !== false && (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    ◀ Filtered Noise Floor ({audioState.noiseFloor || 10}%)
                  </span>
                )}
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Trigger Line ({audioState.threshold}%) ▶
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Direct Filter Sliders and Labels on the Mic Volume Indicator (hidden when background filter is off) */}
            {settings.filterRadioBackground !== false && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Filter Controls on Mic Indicator</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExplanation((prev) => !prev)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>How filters separate noise</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Slider 1: Speech Sensitivity Filter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <label htmlFor="sensitivity-filter-slider" className="text-slate-800 dark:text-slate-200 font-semibold">
                        Speech Sensitivity Filter
                      </label>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Level {settings.sensitivity} / 10
                      </span>
                    </div>
                    <input
                      id="sensitivity-filter-slider"
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={settings.sensitivity}
                      onChange={(e) => updateSettings({ sensitivity: parseInt(e.target.value, 10) })}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Level 1 (Firm / Loud voices)</span>
                      <span>Level 10 (Gentle / Whispers)</span>
                    </div>
                  </div>

                  {/* Slider 2: Background Noise Filter Margin */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <label htmlFor="margin-filter-slider" className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1">
                        <span>Background Noise Filter Margin</span>
                      </label>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
                        +{settings.noiseFloorMargin || 15}% above noise
                      </span>
                    </div>
                    <input
                      id="margin-filter-slider"
                      type="range"
                      min="8"
                      max="28"
                      step="1"
                      value={settings.noiseFloorMargin || 15}
                      onChange={(e) => updateSettings({ noiseFloorMargin: parseInt(e.target.value, 10) })}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>+8% (Easier voice trigger)</span>
                      <span>+28% (Strong background noise rejection)</span>
                    </div>
                  </div>
                </div>

                {/* Speaker Voiceprint (Personal Voice Pattern) Card */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                  {settings.userVoiceProfile ? (
                    <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-bold text-xs text-purple-950 dark:text-purple-200">
                            Personal Voice Pattern Active
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-200/70 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                            Pitch: {settings.userVoiceProfile.medianPitchHz} Hz ({settings.userVoiceProfile.pitchRangeHz[0]}–{settings.userVoiceProfile.pitchRangeHz[1]} Hz)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateSettings({
                                voiceProfileEnabled: settings.voiceProfileEnabled === false ? true : false,
                              })
                            }
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              settings.voiceProfileEnabled !== false
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {settings.voiceProfileEnabled !== false ? 'Filter: ON' : 'Filter: OFF'}
                          </button>

                          <button
                            type="button"
                            onClick={handleTrainVoice}
                            disabled={audioState.isVoiceCalibrating}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40 cursor-pointer"
                          >
                            Re-train (3.5s)
                          </button>

                          <button
                            type="button"
                            onClick={handleClearVoice}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                            title="Delete personal voiceprint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Slider: Voice Match Strictness */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <label htmlFor="voice-strictness-slider" className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                            <span>Voice Match Strictness (Cosine Similarity Threshold)</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              (Higher = only your voice triggers, rejects external radios/talkers)
                            </span>
                          </label>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/30">
                            {settings.voiceMatchThreshold || 65}% Match Required
                          </span>
                        </div>
                        <input
                          id="voice-strictness-slider"
                          type="range"
                          min="50"
                          max="85"
                          step="5"
                          value={settings.voiceMatchThreshold || 65}
                          onChange={(e) => updateSettings({ voiceMatchThreshold: parseInt(e.target.value, 10) })}
                          className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>50% (Permissive)</span>
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">65% (Recommended Default)</span>
                          <span>85% (Strict Voice Lock)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/80 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Capture Your Personal Voice Pattern (3.5s)
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            Tired of background podcasts, radios, or room talkers triggering Mutecoins? Train the engine to recognize your fundamental pitch ($F_0$) and vocal tract formants.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTrainVoice}
                        disabled={audioState.isVoiceCalibrating}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Fingerprint className="w-4 h-4" />
                        <span>{audioState.isVoiceCalibrating ? `Recording (${audioState.voiceCalibrationProgress}%)` : 'Train My Voice (3.5s)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              Distinguishing between a live speaker sitting at the desk and ambient background noise (such as radio, podcasts, TV, or room chatter) relies on five acoustic differences:
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
                  4. One-Click &quot;Learn Background Noise&quot; Calibration
                </strong>
                Click <strong>&quot;Learn Noise&quot;</strong> while normal ambient sounds are present. The app samples 2 seconds of room audio and locks in the exact floor to ignore.
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 sm:col-span-2">
                <strong className="text-purple-900 dark:text-purple-200 block mb-0.5 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>5. Personal Speaker Voiceprint &amp; Formant Matching</span>
                </strong>
                Using autocorrelation fundamental frequency ($F_0$) tracking and 16 logarithmic spectral bands, Mute Jar maps the resonant frequencies created by your unique vocal tract. Even if a radio speaker or podcast is talking at equal volume, their pitch distribution and formant vector will not match your registered voiceprint, filtering them out safely.
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Audio Settings Drawer */}
        {showSettingsDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            {/* Row 1: Microphone Proximity Profile & Background Noise Filter State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Background Noise Filter Quick Toggle Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Background Noise Filter</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.filterRadioBackground !== false}
                    onChange={(e) => updateSettings({ filterRadioBackground: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.filterRadioBackground !== false
                    ? 'Active · Automatically raises trigger threshold above ambient room noise, chatter, or media.'
                    : 'Disabled · Threshold strictly follows base sensitivity.'}
                </p>
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
