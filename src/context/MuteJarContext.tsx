import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  CycleFrequency,
  MuteRecord,
  PersonaType,
  PledgeActionRecord,
  ScheduledMeeting,
  UserSettings,
} from '../types';
import { audioEngine } from '../utils/audioEngine';
import { detectLocalCurrency, formatLocalCurrency, getCurrencySymbol } from '../utils/localeCurrency';
import { sanitizeUrl, sanitizeText } from '../utils/security';
import {
  CycleInfo,
  getCurrentCycleInfo,
  isTimestampInCycle,
  getCycleNoun,
} from '../utils/cycles';

const detectedLocale = detectLocalCurrency();

interface MuteJarContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  mutes: MuteRecord[];
  pledgeActions: PledgeActionRecord[];
  activeGraceRecord: MuteRecord | null;
  graceSecondsLeft: number;
  audioState: {
    isListening: boolean;
    micLevel: number;
    threshold: number;
    noiseFloor: number;
    peerLevel: number;
    hasMeetingAudio: boolean;
    isCalibrating: boolean;
    calibrationProgress: number;
  };
  scheduledMeetings: ScheduledMeeting[];
  setScheduledMeetings: React.Dispatch<React.SetStateAction<ScheduledMeeting[]>>;
  currentMonthKey: string;
  currentMonthCoins: number;
  currentCycle: CycleInfo;
  currentCycleCoins: number;
  cycleNoun: string;
  lastMonthCoins: number;
  twelveMonthAverage: number;
  percentChange: number | null;
  formatCurrency: (amount: number) => string;
  addMuteCoin: (meetingTitle?: string, method?: 'auto_audio' | 'manual') => void;
  undoMuteCoin: (recordId?: string) => void;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  calibrateRoomNoise: () => Promise<{ averageFloor: number; peakFloor: number }>;
  toggleMeetingAudio: () => Promise<boolean>;
  requestPersonaChange: (targetPersona: PersonaType) => 'switched_immediately' | 'confirmation_required';
  confirmPersonaChange: (targetPersona: PersonaType, mode: 'immediate' | 'wait_for_cycle_end') => void;
  cancelPendingPersonaChange: () => void;
  commitPledge: (pledgeData: {
    type: 'charity' | 'pledge' | 'goal';
    title: string;
    description: string;
    coinsCommitted: number;
    estimatedValue: string;
    donationUrl?: string;
    receiptDataUrl?: string;
    receiptFileName?: string;
    receiptUploadedAt?: number;
  }) => void;
  updatePledgeAction: (id: string, updates: Partial<PledgeActionRecord>) => void;
  clearSampleMutes: () => boolean;
  clearSampleSchedule: () => boolean;
  finalizeSetup: () => void;
  deleteUserProfileAndWipeAllData: () => void;
  resetCurrentMonthJar: () => void;
  testCoinDrop: () => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'mutejar_settings_v1',
  MUTES: 'mutejar_mutes_v1',
  PLEDGES: 'mutejar_pledges_v1',
  MEETINGS: 'mutejar_meetings_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Andrew Mair',
  userEmail: 'andmair@gmail.com',
  userAvatar: 'astronaut',
  privacyConsent: {
    hasConsented: false,
    consentedAt: 0,
    version: '1.0',
  },
  persona: 'pragmatist',
  soundEnabled: true,
  soundVolume: 0.7,
  sensitivity: 6,
  filterRadioBackground: true,
  noiseFloorMargin: 15,
  calibratedNoiseFloor: 0,
  microphoneMode: 'near_field',
  autoDetectMeetingAudio: true,
  autoStartMonitoring: true, // Enabled by default as requested
  autoStartOnOSBoot: true,   // OS autostart enabled by default
  reminderDay: 28,
  reminderHour: 16,
  country: detectedLocale.countryCode,
  currency: detectedLocale.symbol,
  currencyCode: detectedLocale.currencyCode,
  perCoinValue: 1.0,
  hasCompletedOnboarding: false,
  isSetupMode: true,
  activeMeetingTitle: '',
  // Philosophy targets & goals defaults
  selectedCharityId: 'globalgiving',
  customCharityUrl: 'https://www.globalgiving.org',
  customCharityName: 'GlobalGiving Crisis & Community Fund',
  saintTargetCoins: 20, // 20 MuteCoins donation payout threshold

  pragmatistGoalTitle: '50 Pushups & 100 Pages Read',
  pragmatistGoalDescription: 'Perform 5 pushups and read 10 book pages for every mute coin dropped this month.',
  pragmatistTargetCoins: 25, // 25 MuteCoins goal milestone

  roastActivityTitle: 'Friday Gourmet Donuts & Coffee for the Team',
  roastActivityDescription: 'Bring fresh artisanal pastries and barista coffees to the sprint team when threshold is reached.',
  roastTargetCoins: 15, // 15 MuteCoins forfeit trigger

  philosophyLabelStyle: 'improved',

  cycleFrequency: 'monthly',

  activeTargetTitle: '50 Pushups & 100 Pages Read',
  activeTargetDescription: 'Perform 5 pushups and read 10 book pages for every mute coin dropped this month.',
  theme: 'light',
};

// Realistic mock meetings for initial schedule context
const DEFAULT_SCHEDULE: ScheduledMeeting[] = [
  { id: '1', title: 'Daily Standup', dayOfWeek: 1, startTime: '09:30', endTime: '09:45' },
  { id: '2', title: 'Sprint Planning', dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
  { id: '3', title: 'Product Review Sync', dayOfWeek: 3, startTime: '11:00', endTime: '12:00' },
  { id: '4', title: 'Architecture Deep Dive', dayOfWeek: 4, startTime: '15:30', endTime: '16:30' },
  { id: '5', title: 'Team Retro & Social', dayOfWeek: 5, startTime: '16:00', endTime: '17:00' },
];

function getCurrentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getPreviousMonthKey(offset: number = 1): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Generate sensible seed history for past 12 months so the app dashboard is immediately rich & meaningful
function generateInitialHistoricalMutes(): MuteRecord[] {
  const records: MuteRecord[] = [];
  const currentKey = getCurrentMonthKey();
  const titles = ['Sprint Planning', 'Engineering Sync', 'Client Workshop', 'Design Critique', 'Weekly 1:1', 'Quarterly All-Hands'];

  // Current month: 8 initial mutes
  for (let i = 0; i < 8; i++) {
    const timeAgo = i * 2.5 * 86400000 + Math.random() * 3600000;
    records.push({
      id: `seed-curr-${i}`,
      timestamp: Date.now() - timeAgo,
      meetingTitle: titles[i % titles.length],
      durationSeconds: Math.floor(Math.random() * 6) + 2,
      undone: false,
      monthKey: currentKey,
      detectedMethod: 'auto_audio',
    });
  }

  // Last 11 months history (averaging ~12-16 mutes per month)
  for (let m = 1; m <= 11; m++) {
    const mKey = getPreviousMonthKey(m);
    const count = 10 + ((m * 3) % 9); // between 10 and 18
    for (let c = 0; c < count; c++) {
      records.push({
        id: `seed-hist-${m}-${c}`,
        timestamp: Date.now() - m * 30 * 86400000 - c * 86400000,
        meetingTitle: titles[c % titles.length],
        durationSeconds: 3,
        undone: false,
        monthKey: mKey,
        detectedMethod: 'auto_audio',
      });
    }
  }

  return records;
}

const MuteJarContext = createContext<MuteJarContextType | null>(null);

export const MuteJarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          userName: parsed.userName || DEFAULT_SETTINGS.userName,
          userEmail: parsed.userEmail || DEFAULT_SETTINGS.userEmail,
          userAvatar: parsed.userAvatar || DEFAULT_SETTINGS.userAvatar,
          autoStartMonitoring: parsed.autoStartMonitoring !== undefined ? parsed.autoStartMonitoring : true,
          autoStartOnOSBoot: parsed.autoStartOnOSBoot !== undefined ? parsed.autoStartOnOSBoot : true,
          currencyCode: parsed.currencyCode || DEFAULT_SETTINGS.currencyCode,
          currency: parsed.currency || DEFAULT_SETTINGS.currency,
          country: parsed.country || DEFAULT_SETTINGS.country,
          cycleFrequency: parsed.cycleFrequency || DEFAULT_SETTINGS.cycleFrequency,
          pendingPersonaChange: parsed.pendingPersonaChange,
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [mutes, setMutes] = useState<MuteRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MUTES);
      return saved ? JSON.parse(saved) : generateInitialHistoricalMutes();
    } catch {
      return generateInitialHistoricalMutes();
    }
  });

  const [pledgeActions, setPledgeActions] = useState<PledgeActionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLEDGES);
      if (saved) return JSON.parse(saved);
      // Sample initial completed pledge from last month for motivation
      return [
        {
          id: 'sample-pledge-1',
          monthKey: getPreviousMonthKey(1),
          type: 'pledge',
          title: 'Team Coffee & Donut Shout',
          description: 'Bought a dozen fresh donuts for the sprint retro meeting',
          coinsCommitted: 14,
          estimatedValue: '$14.00',
          status: 'completed',
          createdAt: Date.now() - 32 * 86400000,
          actionedAt: Date.now() - 25 * 86400000,
          actionNotes: 'Brought 2 boxes of glazed donuts to Friday retro. Team loved it!',
        },
      ];
    } catch {
      return [];
    }
  });

  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
    } catch {
      return DEFAULT_SCHEDULE;
    }
  });

  const [activeGraceRecord, setActiveGraceRecord] = useState<MuteRecord | null>(null);
  const [graceSecondsLeft, setGraceSecondsLeft] = useState<number>(5);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [audioState, setAudioState] = useState({
    isListening: false,
    micLevel: 0,
    threshold: 28,
    noiseFloor: 10,
    peerLevel: 0,
    hasMeetingAudio: false,
    isCalibrating: false,
    calibrationProgress: 0,
  });

  // Keep AudioEngine synced with settings including radio background filter
  useEffect(() => {
    audioEngine.setSoundSettings(settings.soundEnabled, settings.soundVolume);
    audioEngine.setSensitivity(settings.sensitivity);
    audioEngine.setFilterSettings(
      settings.filterRadioBackground !== false,
      settings.noiseFloorMargin || 15,
      settings.microphoneMode || 'near_field',
      settings.calibratedNoiseFloor || 0
    );
  }, [
    settings.soundEnabled,
    settings.soundVolume,
    settings.sensitivity,
    settings.filterRadioBackground,
    settings.noiseFloorMargin,
    settings.microphoneMode,
    settings.calibratedNoiseFloor,
  ]);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MUTES, JSON.stringify(mutes));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [mutes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLEDGES, JSON.stringify(pledgeActions));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [pledgeActions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(scheduledMeetings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [scheduledMeetings]);

  // Find active scheduled meeting context right now
  const resolveCurrentMeetingTitle = useCallback((): string => {
    if (settings.activeMeetingTitle && settings.activeMeetingTitle.trim().length > 0) {
      return settings.activeMeetingTitle.trim();
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const matching = scheduledMeetings.find((m) => {
      if (m.dayOfWeek !== currentDay) return false;
      const [sh, sm] = m.startTime.split(':').map(Number);
      const [eh, em] = m.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return currentMinutes >= startMin && currentMinutes <= endMin;
    });

    return matching ? matching.title : 'Live Meeting Call';
  }, [settings.activeMeetingTitle, scheduledMeetings]);

  // Add Mute Coin handler
  const addMuteCoin = useCallback(
    (customTitle?: string, method: 'auto_audio' | 'manual' = 'auto_audio') => {
      const monthKey = getCurrentMonthKey();
      const title = customTitle || resolveCurrentMeetingTitle();

      const newRecord: MuteRecord = {
        id: `mute-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        meetingTitle: title,
        durationSeconds: 3,
        undone: false,
        monthKey,
        detectedMethod: method,
      };

      setMutes((prev) => [newRecord, ...prev]);

      // Play synthesized cartoon coin sound
      audioEngine.playCoinSound();

      // Start 5-second Grace Window for automatic "Undo if unmuted"
      setActiveGraceRecord(newRecord);
      setGraceSecondsLeft(5);

      if (graceTimerRef.current) {
        clearInterval(graceTimerRef.current);
      }

      let remaining = 5;
      graceTimerRef.current = setInterval(() => {
        remaining -= 1;
        setGraceSecondsLeft(remaining);
        if (remaining <= 0) {
          if (graceTimerRef.current) {
            clearInterval(graceTimerRef.current);
            graceTimerRef.current = null;
          }
          setActiveGraceRecord(null);
        }
      }, 1000);
    },
    [resolveCurrentMeetingTitle]
  );

  // Undo Last Mute Coin handler
  const undoMuteCoin = useCallback(
    (recordId?: string) => {
      const targetId = recordId || (activeGraceRecord ? activeGraceRecord.id : null);
      if (!targetId) return;

      setMutes((prev) =>
        prev.map((m) => (m.id === targetId ? { ...m, undone: true } : m))
      );

      if (graceTimerRef.current) {
        clearInterval(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      setActiveGraceRecord(null);
    },
    [activeGraceRecord]
  );

  // Setup audio callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      () => {
        // Speech detected while monitor active!
        addMuteCoin();
      },
      (micLevel, threshold, peerLevel, noiseFloor) => {
        setAudioState((prev) => ({
          ...prev,
          micLevel,
          threshold,
          noiseFloor,
          peerLevel,
          hasMeetingAudio: audioEngine.hasMeetingAudioConnected(),
        }));
      }
    );
  }, [addMuteCoin]);

  const startListening = async (): Promise<boolean> => {
    const success = await audioEngine.startMicrophone();
    setAudioState((prev) => ({
      ...prev,
      isListening: success,
    }));
    return success;
  };

  const stopListening = () => {
    audioEngine.stopAll();
    setAudioState({
      isListening: false,
      micLevel: 0,
      threshold: 28,
      noiseFloor: 10,
      peerLevel: 0,
      hasMeetingAudio: false,
      isCalibrating: false,
      calibrationProgress: 0,
    });
  };

  const calibrateRoomNoise = async () => {
    setAudioState((prev) => ({ ...prev, isCalibrating: true, calibrationProgress: 0 }));
    if (!audioState.isListening) {
      await audioEngine.startMicrophone();
      setAudioState((prev) => ({ ...prev, isListening: true }));
    }
    const result = await audioEngine.calibrateBackground(2000, (percent) => {
      setAudioState((prev) => ({ ...prev, calibrationProgress: percent }));
    });
    updateSettings({ calibratedNoiseFloor: result.averageFloor });
    setAudioState((prev) => ({
      ...prev,
      isCalibrating: false,
      calibrationProgress: 100,
      noiseFloor: result.averageFloor,
    }));
    return result;
  };

  const toggleMeetingAudio = async (): Promise<boolean> => {
    if (audioEngine.hasMeetingAudioConnected()) {
      audioEngine.disconnectMeetingAudio();
      setAudioState((prev) => ({ ...prev, hasMeetingAudio: false }));
      return false;
    } else {
      const connected = await audioEngine.connectMeetingAudio();
      setAudioState((prev) => ({ ...prev, hasMeetingAudio: connected }));
      return connected;
    }
  };

  // Auto-start monitoring by default once user has consented or completed onboarding
  useEffect(() => {
    let cancelled = false;
    const shouldAutoStart =
      settings.autoStartMonitoring &&
      settings.privacyConsent?.hasConsented &&
      !audioState.isListening;

    if (shouldAutoStart) {
      const timer = setTimeout(async () => {
        if (!cancelled && !audioState.isListening) {
          try {
            const success = await audioEngine.startMicrophone();
            if (!cancelled && success) {
              setAudioState((prev) => ({ ...prev, isListening: true }));
            }
          } catch (e) {
            console.info('Auto-start audio monitor will resume upon user gesture:', e);
          }
        }
      }, 600);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [settings.autoStartMonitoring, settings.privacyConsent?.hasConsented]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const sanitized = { ...updates };
      if (sanitized.customCharityUrl !== undefined) {
        sanitized.customCharityUrl = sanitizeUrl(sanitized.customCharityUrl) || undefined;
      }
      if (sanitized.userName !== undefined) {
        sanitized.userName = sanitizeText(sanitized.userName, 60);
      }
      if (sanitized.activeMeetingTitle !== undefined) {
        sanitized.activeMeetingTitle = sanitizeText(sanitized.activeMeetingTitle, 100);
      }
      return { ...prev, ...sanitized };
    });
  };

  const currentCycle = getCurrentCycleInfo(settings.cycleFrequency || 'monthly');
  const cycleNoun = getCycleNoun(settings.cycleFrequency || 'monthly');

  // Active cycle coins
  const currentCycleCoins = mutes.filter((m) => {
    if (m.undone) return false;
    if (m.timestamp && isTimestampInCycle(m.timestamp, currentCycle)) return true;
    return m.monthKey === currentCycle.key;
  }).length;

  const requestPersonaChange = useCallback(
    (targetPersona: PersonaType): 'switched_immediately' | 'confirmation_required' => {
      if (targetPersona === settings.persona) return 'switched_immediately';
      if (currentCycleCoins === 0) {
        updateSettings({
          persona: targetPersona,
          pendingPersonaChange: undefined,
        });
        return 'switched_immediately';
      }
      return 'confirmation_required';
    },
    [settings.persona, currentCycleCoins]
  );

  const confirmPersonaChange = useCallback(
    (targetPersona: PersonaType, mode: 'immediate' | 'wait_for_cycle_end') => {
      if (mode === 'immediate') {
        updateSettings({
          persona: targetPersona,
          pendingPersonaChange: undefined,
        });
      } else {
        updateSettings({
          pendingPersonaChange: {
            nextPersona: targetPersona,
            effectiveAtCycleEnd: true,
          },
        });
      }
    },
    []
  );

  const cancelPendingPersonaChange = useCallback(() => {
    updateSettings({ pendingPersonaChange: undefined });
  }, []);

  const commitPledge = (pledgeData: {
    type: 'charity' | 'pledge' | 'goal';
    title: string;
    description: string;
    coinsCommitted: number;
    estimatedValue: string;
    donationUrl?: string;
    receiptDataUrl?: string;
    receiptFileName?: string;
    receiptUploadedAt?: number;
  }) => {
    const currentKey = getCurrentMonthKey();
    const safeUrl = sanitizeUrl(pledgeData.donationUrl);
    const newPledge: PledgeActionRecord = {
      id: `pledge-${Date.now()}`,
      monthKey: currentKey,
      cycleKey: currentCycle.key,
      type: pledgeData.type,
      title: sanitizeText(pledgeData.title, 120),
      description: sanitizeText(pledgeData.description, 400),
      coinsCommitted: pledgeData.coinsCommitted,
      estimatedValue: pledgeData.estimatedValue,
      status: pledgeData.receiptDataUrl ? 'completed' : 'pending',
      createdAt: Date.now(),
      donationUrl: safeUrl || undefined,
      receiptDataUrl: pledgeData.receiptDataUrl,
      receiptFileName: pledgeData.receiptFileName ? sanitizeText(pledgeData.receiptFileName, 120) : undefined,
      receiptUploadedAt: pledgeData.receiptUploadedAt || (pledgeData.receiptDataUrl ? Date.now() : undefined),
      actionedAt: pledgeData.receiptDataUrl ? Date.now() : undefined,
      actionNotes: pledgeData.receiptDataUrl ? 'Donation receipt uploaded and verified.' : undefined,
    };

    setPledgeActions((prev) => [newPledge, ...prev]);
  };

  const updatePledgeAction = (id: string, updates: Partial<PledgeActionRecord>) => {
    setPledgeActions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const clearSampleMutes = useCallback((): boolean => {
    if (!settings.isSetupMode) return false;
    setMutes([]);
    return true;
  }, [settings.isSetupMode]);

  const clearSampleSchedule = useCallback((): boolean => {
    if (!settings.isSetupMode) return false;
    setScheduledMeetings([]);
    return true;
  }, [settings.isSetupMode]);

  const finalizeSetup = useCallback(() => {
    updateSettings({ isSetupMode: false });
  }, []);

  const deleteUserProfileAndWipeAllData = useCallback(() => {
    audioEngine.stopAll();
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.MUTES);
      localStorage.removeItem(STORAGE_KEYS.PLEDGES);
      localStorage.removeItem(STORAGE_KEYS.MEETINGS);
    } catch (e) {
      console.warn('LocalStorage wipe warning:', e);
    }
    setMutes([]);
    setPledgeActions([]);
    setScheduledMeetings([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const resetCurrentMonthJar = () => {
    const currentKey = getCurrentMonthKey();
    // Archive current active mutes for active cycle
    setMutes((prev) =>
      prev.filter((m) => {
        if (m.monthKey === currentKey || m.monthKey === currentCycle.key) return false;
        if (m.timestamp && isTimestampInCycle(m.timestamp, currentCycle)) return false;
        return true;
      })
    );

    // If there is a pending persona change scheduled for cycle end, apply it now!
    if (settings.pendingPersonaChange?.nextPersona) {
      updateSettings({
        persona: settings.pendingPersonaChange.nextPersona,
        pendingPersonaChange: undefined,
      });
    }
  };

  const testCoinDrop = () => {
    addMuteCoin('Manual Demo Test', 'manual');
  };

  // Monthly stats calculations
  const currentMonthKey = getCurrentMonthKey();
  // We use currentCycleCoins for currentMonthCoins so all existing dashboard components reflect the active cycle
  const currentMonthCoins = currentCycleCoins;

  const lastMonthKey = getPreviousMonthKey(1);
  const lastMonthCoins = mutes.filter(
    (m) => m.monthKey === lastMonthKey && !m.undone
  ).length;

  // 12-month rolling calculation
  let totalHistoricCoins = 0;
  let monthsCounted = 0;
  for (let m = 0; m < 12; m++) {
    const k = getPreviousMonthKey(m);
    const count = mutes.filter((rec) => rec.monthKey === k && !rec.undone).length;
    if (count > 0 || m === 0) {
      totalHistoricCoins += count;
      monthsCounted++;
    }
  }
  const twelveMonthAverage =
    monthsCounted > 0 ? Math.round(totalHistoricCoins / monthsCounted) : currentMonthCoins;

  const percentChange =
    lastMonthCoins > 0
      ? Math.round(((currentMonthCoins - lastMonthCoins) / lastMonthCoins) * 100)
      : null;

  const formatCurrency = useCallback(
    (amount: number): string => {
      return formatLocalCurrency(amount, settings.currencyCode || detectedLocale.currencyCode);
    },
    [settings.currencyCode]
  );

  return (
    <MuteJarContext.Provider
      value={{
        settings,
        updateSettings,
        mutes,
        pledgeActions,
        activeGraceRecord,
        graceSecondsLeft,
        audioState,
        scheduledMeetings,
        setScheduledMeetings,
        currentMonthKey,
        currentMonthCoins,
        currentCycle,
        currentCycleCoins,
        cycleNoun,
        lastMonthCoins,
        twelveMonthAverage,
        percentChange,
        formatCurrency,
        addMuteCoin,
        undoMuteCoin,
        startListening,
        stopListening,
        calibrateRoomNoise,
        toggleMeetingAudio,
        requestPersonaChange,
        confirmPersonaChange,
        cancelPendingPersonaChange,
        commitPledge,
        updatePledgeAction,
        clearSampleMutes,
        clearSampleSchedule,
        finalizeSetup,
        deleteUserProfileAndWipeAllData,
        resetCurrentMonthJar,
        testCoinDrop,
      }}
    >
      {children}
    </MuteJarContext.Provider>
  );
};

export const useMuteJar = () => {
  const context = useContext(MuteJarContext);
  if (!context) {
    throw new Error('useMuteJar must be used within a MuteJarProvider');
  }
  return context;
};
