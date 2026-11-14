import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  CycleFrequency,
  MuteRecord,
  PersonaType,
  PledgeActionRecord,
  ScheduledMeeting,
  UserSettings,
  UserVoiceProfile,
  ChatChannel,
  ChannelPublishRule,
  IntegrationsConfig,
  PublishableEventType,
  CalendarSource,
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
import {
  buildSanitizedChatPayload,
  sendWebhookNotification,
  EventPayloadData,
} from '../utils/integrations';

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
    voiceMatchScore: number;
    isSpeakerMatch: boolean;
    isVoiceCalibrating: boolean;
    voiceCalibrationProgress: number;
    detectedPitchHz: number | null;
    isDoNotDisturbActive: boolean;
    dndPausedAudio: boolean;
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
  stopListening: (pausedByDND?: boolean) => void;
  toggleDoNotDisturb: (forceState?: boolean) => void;
  playPreviewSound: (soundId?: string) => void;
  calibrateRoomNoise: () => Promise<{ averageFloor: number; peakFloor: number }>;
  calibrateVoiceProfile: (durationMs?: number) => Promise<UserVoiceProfile>;
  clearVoiceProfile: () => void;
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
    photoDataUrl?: string;
    photoCapturedAt?: number;
  }) => void;
  updatePledgeAction: (id: string, updates: Partial<PledgeActionRecord>) => void;
  clearSampleMutes: () => boolean;
  clearSampleSchedule: () => boolean;
  finalizeSetup: () => void;
  deleteUserProfileAndWipeAllData: () => void;
  resetToGenericTestProfile: () => void;
  resetCurrentMonthJar: () => void;
  testCoinDrop: () => void;
  // Integrations & Local MCP Server
  integrationsConfig: IntegrationsConfig;
  updateIntegrationsConfig: (updates: Partial<IntegrationsConfig>) => void;
  addChatChannel: (channel: Omit<ChatChannel, 'id' | 'createdAt' | 'verified'>) => void;
  updateChatChannel: (id: string, updates: Partial<ChatChannel>) => void;
  removeChatChannel: (id: string) => void;
  addPublishRule: (rule: Omit<ChannelPublishRule, 'id'>) => void;
  updatePublishRule: (id: string, updates: Partial<ChannelPublishRule>) => void;
  removePublishRule: (id: string) => void;
  testChatChannel: (id: string) => Promise<{ success: boolean; error?: string }>;
  dispatchIntegrationEvent: (
    eventType: PublishableEventType,
    customData?: Partial<EventPayloadData>
  ) => Promise<void>;
  // Meeting Ledger Log Editing
  updateMuteRecord: (id: string, updates: Partial<MuteRecord>) => void;
  deleteMuteRecord: (id: string) => void;
  // Multi-Calendar Integration (Max 3, Primary Priority)
  addCalendarSource: (source: Omit<CalendarSource, 'id'>) => boolean;
  updateCalendarSource: (id: string, updates: Partial<CalendarSource>) => void;
  removeCalendarSource: (id: string) => void;
  setPrimaryCalendar: (id: string) => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'mutejar_settings_v1',
  MUTES: 'mutejar_mutes_v1',
  PLEDGES: 'mutejar_pledges_v1',
  MEETINGS: 'mutejar_meetings_v1',
  INTEGRATIONS: 'mutejar_integrations_v1',
};

const PROFILE_RESET_TOKEN_KEY = 'mutejar_profile_reset_token';
const CURRENT_PROFILE_RESET_TOKEN = 'generic-test-profile-v1';

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Demo User',
  userEmail: 'demo.user@example.com',
  userAvatar: 'astronaut',
  privacyConsent: {
    hasConsented: true,
    consentedAt: Date.now(),
    version: '1.0',
  },
  persona: 'pragmatist',
  soundEnabled: false, // Default: OFF as requested. Deposit sound is off until explicitly enabled.
  soundVolume: 0.7,
  depositSoundId: 'glass_clink', // Default system sound FX
  sensitivity: 6,
  filterRadioBackground: true,
  noiseFloorMargin: 15,
  calibratedNoiseFloor: 0,
  microphoneMode: 'near_field',
  autoDetectMeetingAudio: true,
  autoStartMonitoring: false, // Disabled by default as requested: monitor is OFF on launch until explicitly started
  autoStartOnOSBoot: true,   // OS autostart option
  minimizeToTray: true,      // Minimize to system tray / menu bar status icon on window close
  pauseOnDoNotDisturb: true, // Auto-pause audio monitor when OS focus or Do Not Disturb is active (default: true)
  reminderDay: 28,
  reminderHour: 16,
  country: detectedLocale.countryCode,
  currency: detectedLocale.symbol,
  currencyCode: detectedLocale.currencyCode,
  perCoinValue: 1.0,
  hasCompletedOnboarding: true,
  isSetupMode: true,
  activeMeetingTitle: '',
  // Speaker Voiceprint Profile defaults
  voiceProfileEnabled: true,
  voiceMatchThreshold: 65,
  // Philosophy targets & goals defaults
  selectedCharityId: 'globalgiving',
  customCharityUrl: 'https://www.globalgiving.org',
  customCharityName: 'GlobalGiving Crisis & Community Fund',
  saintTargetCoins: 20, // 20 Mutecoins donation payout threshold

  pragmatistGoalTitle: '50 Pushups & 100 Pages Read',
  pragmatistGoalDescription: 'Perform 5 pushups and read 10 book pages for every mutecoin dropped this month.',
  pragmatistTargetCoins: 25, // 25 Mutecoins goal milestone

  roastActivityTitle: 'Friday Gourmet Donuts & Coffee for the Team',
  roastActivityDescription: 'Bring fresh artisanal pastries and barista coffees to the sprint team when threshold is reached.',
  roastTargetCoins: 15, // 15 Mutecoins forfeit trigger

  philosophyLabelStyle: 'improved',

  cycleFrequency: 'monthly',

  activeTargetTitle: '50 Pushups & 100 Pages Read',
  activeTargetDescription: 'Perform 5 pushups and read 10 book pages for every mutecoin dropped this month.',
  theme: 'light',
  autoTagMeetings: true,
  calendarSources: [
    {
      id: 'cal-default-work',
      provider: 'google',
      connectionType: 'oauth',
      name: 'Work Calendar (Google)',
      oauthEmail: 'demo.user@example.com',
      enabled: true,
      isPrimary: true,
      lastSyncedAt: Date.now() - 15 * 60 * 1000,
      events: [
        { id: 'ev-1', title: 'Daily Standup', dayOfWeek: 1, startTime: '09:30', endTime: '09:45' },
        { id: 'ev-2', title: 'Sprint Planning', dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
        { id: 'ev-3', title: 'Product Review Sync', dayOfWeek: 3, startTime: '11:00', endTime: '12:00' },
        { id: 'ev-4', title: 'Architecture Deep Dive', dayOfWeek: 4, startTime: '15:30', endTime: '16:30' },
        { id: 'ev-5', title: 'Team Retro & Social', dayOfWeek: 5, startTime: '16:00', endTime: '17:00' },
      ],
    },
    {
      id: 'cal-default-personal',
      provider: 'apple',
      connectionType: 'webcal_feed',
      name: 'Personal iCloud Calendar',
      feedUrl: 'webcal://p12-caldav.icloud.com/published/sample-feed.ics',
      enabled: true,
      isPrimary: false,
      lastSyncedAt: Date.now() - 32 * 60 * 1000,
      events: [
        { id: 'ev-p1', title: 'Dentist Appointment', dayOfWeek: 2, startTime: '10:00', endTime: '11:00' },
      ],
    },
  ],
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
  const sampleTitles = [
    'Unscheduled meeting - mute 2',
    'Unscheduled meeting - mute 1',
    'Sprint Planning',
    'Daily Standup',
    'Design Critique',
    'Engineering Sync',
    'Product Review Sync',
    'Weekly 1:1',
  ];

  // Current month: 8 initial sample mutes (including 2 unscheduled call events)
  for (let i = 0; i < 8; i++) {
    const timeAgo = i < 2 ? (i + 1) * 300000 : i * 2.5 * 86400000;
    records.push({
      id: `seed-curr-${i}`,
      timestamp: Date.now() - timeAgo,
      meetingTitle: sampleTitles[i % sampleTitles.length],
      durationSeconds: 3 + (i % 4),
      undone: false,
      monthKey: currentKey,
      detectedMethod: i % 3 === 0 ? 'manual' : 'auto_audio',
    });
  }

  // Last 11 months history (averaging ~12-16 mutes per month)
  const histTitles = ['Sprint Planning', 'Engineering Sync', 'Client Workshop', 'Design Critique', 'Weekly 1:1', 'Quarterly All-Hands'];
  for (let m = 1; m <= 11; m++) {
    const mKey = getPreviousMonthKey(m);
    const count = 10 + ((m * 3) % 9); // between 10 and 18
    for (let c = 0; c < count; c++) {
      records.push({
        id: `seed-hist-${m}-${c}`,
        timestamp: Date.now() - m * 30 * 86400000 - c * 86400000,
        meetingTitle: histTitles[c % histTitles.length],
        durationSeconds: 3,
        undone: false,
        monthKey: mKey,
        detectedMethod: 'auto_audio',
      });
    }
  }

  return records;
}

function createInitialSamplePledges(): PledgeActionRecord[] {
  return [
    {
      id: 'sample-pledge-active',
      monthKey: getCurrentMonthKey(),
      type: 'goal',
      title: '25 Pushups & 50 Pages Read',
      description: 'Complete 25 pushups and read 50 book pages for this cycle',
      coinsCommitted: 8,
      estimatedValue: '$8.00',
      status: 'pending',
      createdAt: Date.now() - 2 * 86400000,
    },
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
      actionNotes: 'Brought 2 boxes of glazed donuts to Friday retro.',
    },
  ];
}

function createInitialSampleIntegrations(): IntegrationsConfig {
  return {
    channels: [
      {
        id: 'sample-slack-channel',
        name: '#team-mute-jar',
        platform: 'slack',
        webhookUrl: '',
        createdAt: Date.now() - 3 * 86400000,
        verified: false,
      },
    ],
    rules: [
      {
        id: 'rule-mute-deposit',
        eventType: 'mute_deposit',
        channelId: 'sample-slack-channel',
        enabled: false,
        includeRoastQuote: true,
      },
      {
        id: 'rule-milestone',
        eventType: 'milestone_reach',
        channelId: 'sample-slack-channel',
        enabled: false,
        includeRoastQuote: true,
      },
      {
        id: 'rule-goal-completed',
        eventType: 'goal_completed',
        channelId: 'sample-slack-channel',
        enabled: false,
        includeRoastQuote: true,
      },
    ],
    mcpEnabled: true,
    privacyStrictRedaction: true,
  };
}

function ensureCleanGenericResetIfNeeded(): void {
  try {
    const token = localStorage.getItem(PROFILE_RESET_TOKEN_KEY);
    if (token !== CURRENT_PROFILE_RESET_TOKEN) {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.MUTES);
      localStorage.removeItem(STORAGE_KEYS.PLEDGES);
      localStorage.removeItem(STORAGE_KEYS.MEETINGS);
      localStorage.removeItem(STORAGE_KEYS.INTEGRATIONS);
      localStorage.setItem(PROFILE_RESET_TOKEN_KEY, CURRENT_PROFILE_RESET_TOKEN);
    }
  } catch {
    // ignore storage access issues
  }
}

const MuteJarContext = createContext<MuteJarContextType | null>(null);

export const MuteJarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Run one-time cleanup so stale previous session data resets cleanly to the generic test profile
  useState(() => {
    ensureCleanGenericResetIfNeeded();
    return true;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean stale autoStartMonitoring from previous builds if it was true
        if (parsed.autoStartMonitoring === true) {
          try {
            localStorage.setItem(
              STORAGE_KEYS.SETTINGS,
              JSON.stringify({ ...parsed, autoStartMonitoring: false })
            );
          } catch {
            // ignore
          }
        }
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          userName: parsed.userName !== undefined ? parsed.userName : DEFAULT_SETTINGS.userName,
          userEmail: parsed.userEmail !== undefined ? parsed.userEmail : DEFAULT_SETTINGS.userEmail,
          userAvatar: parsed.userAvatar || DEFAULT_SETTINGS.userAvatar,
          autoStartMonitoring: false, // Strictly OFF by default. Requires explicit user action to start.
          autoStartOnOSBoot: parsed.autoStartOnOSBoot !== undefined ? parsed.autoStartOnOSBoot : true,
          minimizeToTray: parsed.minimizeToTray !== undefined ? parsed.minimizeToTray : true,
          pauseOnDoNotDisturb: parsed.pauseOnDoNotDisturb !== undefined ? parsed.pauseOnDoNotDisturb : true,
          soundEnabled: parsed.soundDefaultMigrated ? (parsed.soundEnabled ?? false) : false, // Off by default as requested
          depositSoundId: parsed.depositSoundId || 'glass_clink',
          currencyCode: parsed.currencyCode || DEFAULT_SETTINGS.currencyCode,
          currency: parsed.currency || DEFAULT_SETTINGS.currency,
          country: parsed.country || DEFAULT_SETTINGS.country,
          cycleFrequency: parsed.cycleFrequency || DEFAULT_SETTINGS.cycleFrequency,
          pendingPersonaChange: parsed.pendingPersonaChange,
          calendarSources: Array.isArray(parsed.calendarSources) ? parsed.calendarSources : DEFAULT_SETTINGS.calendarSources,
          autoTagMeetings: parsed.autoTagMeetings !== undefined ? parsed.autoTagMeetings : true,
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
      return createInitialSamplePledges();
    } catch {
      return createInitialSamplePledges();
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

  const [integrationsConfig, setIntegrationsConfig] = useState<IntegrationsConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          channels: Array.isArray(parsed.channels) ? parsed.channels : [],
          rules: Array.isArray(parsed.rules) ? parsed.rules : [],
          mcpEnabled: parsed.mcpEnabled !== false,
          privacyStrictRedaction: true,
        };
      }
      return createInitialSampleIntegrations();
    } catch {
      return createInitialSampleIntegrations();
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
    voiceMatchScore: 85,
    isSpeakerMatch: true,
    isVoiceCalibrating: false,
    voiceCalibrationProgress: 0,
    detectedPitchHz: null as number | null,
    isDoNotDisturbActive: (() => {
      try {
        return localStorage.getItem('mutejar_os_dnd_active') === 'true';
      } catch {
        return false;
      }
    })(),
    dndPausedAudio: false,
  });

  // Keep AudioEngine synced with settings including background filter, voice profile, and sound FX
  useEffect(() => {
    audioEngine.setSoundSettings(
      settings.soundEnabled,
      settings.soundVolume,
      settings.depositSoundId || 'glass_clink'
    );
    audioEngine.setSensitivity(settings.sensitivity);
    audioEngine.setFilterSettings(
      settings.filterRadioBackground !== false,
      settings.noiseFloorMargin || 15,
      settings.microphoneMode || 'near_field',
      settings.calibratedNoiseFloor || 0
    );
    audioEngine.setVoiceProfileSettings(
      settings.voiceProfileEnabled !== false,
      settings.userVoiceProfile || null,
      settings.voiceMatchThreshold || 65
    );
  }, [
    settings.soundEnabled,
    settings.soundVolume,
    settings.depositSoundId,
    settings.sensitivity,
    settings.filterRadioBackground,
    settings.noiseFloorMargin,
    settings.microphoneMode,
    settings.calibratedNoiseFloor,
    settings.voiceProfileEnabled,
    settings.userVoiceProfile,
    settings.voiceMatchThreshold,
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrationsConfig));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [integrationsConfig]);

  // Find active scheduled meeting context right now
  // Find active scheduled meeting context right now across up to 3 connected calendars
  const resolveCurrentMeetingTitle = useCallback((): string => {
    if (settings.activeMeetingTitle && settings.activeMeetingTitle.trim().length > 0) {
      return settings.activeMeetingTitle.trim();
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Check connected calendar sources (max 3), prioritizing primary calendar
    if (settings.autoTagMeetings !== false) {
      const sources = settings.calendarSources || [];
      const enabledSources = sources.filter((s) => s.enabled);

      if (enabledSources.length > 0) {
        // Sort primary calendar first so it takes priority on double bookings
        const sortedSources = [...enabledSources].sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return 0;
        });

        for (const src of sortedSources) {
          if (!src.events || src.events.length === 0) continue;
          const match = src.events.find((ev) => {
            if (ev.dayOfWeek !== undefined && ev.dayOfWeek !== currentDay) return false;
            const [sh, sm] = ev.startTime.split(':').map(Number);
            const [eh, em] = ev.endTime.split(':').map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;
            return currentMinutes >= startMin && currentMinutes <= endMin;
          });
          if (match && match.title.trim()) {
            return match.title.trim();
          }
        }
      }
    }

    // 2. Fallback when unscheduled (or auto-tagging disabled): "Unscheduled meeting - mute #"
    // Tracks mute occurrences in the active unscheduled session window (45 min)
    const sessionWindowMs = 45 * 60 * 1000;
    const nowTime = now.getTime();
    const recentUnscheduledMutes = mutes.filter(
      (m) =>
        nowTime - m.timestamp <= sessionWindowMs &&
        !m.undone &&
        m.meetingTitle.startsWith('Unscheduled meeting - mute ')
    );

    if (recentUnscheduledMutes.length > 0) {
      let maxNum = 0;
      for (const m of recentUnscheduledMutes) {
        const match = m.meetingTitle.match(/Unscheduled meeting - mute (\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum > 0 ? maxNum + 1 : recentUnscheduledMutes.length + 1;
      return `Unscheduled meeting - mute ${nextNum}`;
    }

    return 'Unscheduled meeting - mute 1';
  }, [settings.activeMeetingTitle, settings.autoTagMeetings, settings.calendarSources, mutes]);

  // Dispatcher ref for callbacks without circular hook dependencies
  const dispatchRef = useRef<((eventType: PublishableEventType, data?: Partial<EventPayloadData>) => Promise<void>) | null>(null);

  // Add Mutecoin handler
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

      // Play synthesized Mutecoin deposit sound (if enabled)
      audioEngine.playCoinSound(settings.depositSoundId || 'glass_clink');

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
          dispatchRef.current?.('mute_deposit');
        }
      }, 1000);
    },
    [resolveCurrentMeetingTitle]
  );

  // Undo Last Mutecoin handler
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

  // Global Cmd+Z / Ctrl+Z keyboard shortcut for instant undo during grace period
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        if (activeGraceRecord) {
          e.preventDefault();
          undoMuteCoin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGraceRecord, undoMuteCoin]);

  // Setup audio callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      () => {
        // Speech detected while monitor active!
        addMuteCoin();
      },
      (
        micLevel,
        threshold,
        peerLevel,
        noiseFloor,
        isSpeech,
        voiceMatchScore = 85,
        isSpeakerMatch = true,
        detectedPitchHz = null
      ) => {
        setAudioState((prev) => ({
          ...prev,
          micLevel,
          threshold,
          noiseFloor,
          peerLevel,
          voiceMatchScore,
          isSpeakerMatch,
          detectedPitchHz,
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
      dndPausedAudio: false,
    }));
    return success;
  };

  const stopListening = (pausedByDND: boolean = false) => {
    audioEngine.stopAll();
    setAudioState((prev) => ({
      ...prev,
      isListening: false,
      micLevel: 0,
      threshold: 28,
      noiseFloor: 10,
      peerLevel: 0,
      hasMeetingAudio: false,
      isCalibrating: false,
      calibrationProgress: 0,
      voiceMatchScore: 85,
      isSpeakerMatch: true,
      isVoiceCalibrating: false,
      voiceCalibrationProgress: 0,
      detectedPitchHz: null,
      dndPausedAudio: pausedByDND,
    }));
  };

  const toggleDoNotDisturb = (forceState?: boolean) => {
    setAudioState((prev) => {
      const nextActive = forceState !== undefined ? forceState : !prev.isDoNotDisturbActive;
      try {
        localStorage.setItem('mutejar_os_dnd_active', nextActive ? 'true' : 'false');
      } catch {
        // ignore
      }

      // If DND is turning ON and pauseOnDoNotDisturb is enabled, halt active monitoring
      if (nextActive && settings.pauseOnDoNotDisturb !== false && prev.isListening) {
        audioEngine.stopAll();
        return {
          ...prev,
          isListening: false,
          isDoNotDisturbActive: nextActive,
          dndPausedAudio: true,
        };
      }

      return {
        ...prev,
        isDoNotDisturbActive: nextActive,
        dndPausedAudio: nextActive ? prev.dndPausedAudio : false,
      };
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

  const calibrateVoiceProfile = async (durationMs: number = 3500): Promise<UserVoiceProfile> => {
    setAudioState((prev) => ({ ...prev, isVoiceCalibrating: true, voiceCalibrationProgress: 0 }));
    if (!audioState.isListening) {
      await audioEngine.startMicrophone();
      setAudioState((prev) => ({ ...prev, isListening: true }));
    }
    const profile = await audioEngine.calibrateVoiceProfile(durationMs, (percent) => {
      setAudioState((prev) => ({ ...prev, voiceCalibrationProgress: percent }));
    });
    updateSettings({
      userVoiceProfile: profile,
      voiceProfileEnabled: true,
      voiceMatchThreshold: settings.voiceMatchThreshold || 65,
    });
    setAudioState((prev) => ({
      ...prev,
      isVoiceCalibrating: false,
      voiceCalibrationProgress: 100,
      voiceMatchScore: 92,
      isSpeakerMatch: true,
    }));
    return profile;
  };

  const clearVoiceProfile = () => {
    updateSettings({
      userVoiceProfile: undefined,
      voiceProfileEnabled: false,
    });
    audioEngine.setVoiceProfileSettings(false, null, 65);
    setAudioState((prev) => ({
      ...prev,
      voiceMatchScore: 100,
      isSpeakerMatch: true,
    }));
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

  // Ensure that on unmount / hot-reload, any active microphone stream is cleanly halted
  useEffect(() => {
    return () => {
      audioEngine.stopAll();
    };
  }, []);

  // Synchronize OS Focus / Do Not Disturb state from storage or native companion events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mutejar_os_dnd_active') {
        const active = e.newValue === 'true';
        setAudioState((prev) => ({
          ...prev,
          isDoNotDisturbActive: active,
          dndPausedAudio: active && settings.pauseOnDoNotDisturb !== false && prev.isListening ? true : prev.dndPausedAudio,
        }));
      }
    };

    const handleCustomFocus = (e: Event) => {
      const customEvt = e as CustomEvent<{ active?: boolean }>;
      const active = customEvt.detail?.active ?? true;
      setAudioState((prev) => ({
        ...prev,
        isDoNotDisturbActive: active,
        dndPausedAudio: active && settings.pauseOnDoNotDisturb !== false && prev.isListening ? true : prev.dndPausedAudio,
      }));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('mutejar-os-focus-change', handleCustomFocus);

    // Global helper for native app wrappers / shortcuts / console testing
    (window as unknown as { __MUTEJAR_SET_DND__?: (active: boolean) => void }).__MUTEJAR_SET_DND__ = (active: boolean) => {
      toggleDoNotDisturb(active);
    };

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mutejar-os-focus-change', handleCustomFocus);
      delete (window as unknown as { __MUTEJAR_SET_DND__?: unknown }).__MUTEJAR_SET_DND__;
    };
  }, [settings.pauseOnDoNotDisturb]);

  // When OS Focus / DND becomes active, pause the audio monitor if pauseOnDoNotDisturb is enabled
  useEffect(() => {
    if (audioState.isDoNotDisturbActive && settings.pauseOnDoNotDisturb !== false) {
      if (audioState.isListening) {
        audioEngine.stopAll();
        setAudioState((prev) => ({
          ...prev,
          isListening: false,
          dndPausedAudio: true,
        }));
      }
    }
  }, [audioState.isDoNotDisturbActive, settings.pauseOnDoNotDisturb, audioState.isListening]);

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
    photoDataUrl?: string;
    photoCapturedAt?: number;
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
      status: (pledgeData.receiptDataUrl || pledgeData.photoDataUrl) ? 'completed' : 'pending',
      createdAt: Date.now(),
      donationUrl: safeUrl || undefined,
      receiptDataUrl: pledgeData.receiptDataUrl,
      receiptFileName: pledgeData.receiptFileName ? sanitizeText(pledgeData.receiptFileName, 120) : undefined,
      receiptUploadedAt: pledgeData.receiptUploadedAt || (pledgeData.receiptDataUrl ? Date.now() : undefined),
      photoDataUrl: pledgeData.photoDataUrl,
      photoCapturedAt: pledgeData.photoCapturedAt || (pledgeData.photoDataUrl ? Date.now() : undefined),
      actionedAt: (pledgeData.receiptDataUrl || pledgeData.photoDataUrl) ? Date.now() : undefined,
      actionNotes: pledgeData.receiptDataUrl ? 'Donation receipt uploaded and verified.' : pledgeData.photoDataUrl ? 'Goal completed with photo proof.' : undefined,
    };

    setPledgeActions((prev) => [newPledge, ...prev]);

    if (newPledge.status === 'completed') {
      dispatchRef.current?.('goal_completed', {
        goalTitle: newPledge.title,
        goalValue: newPledge.estimatedValue,
      });
    }
  };

  const updatePledgeAction = (id: string, updates: Partial<PledgeActionRecord>) => {
    setPledgeActions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          if (updates.status === 'completed' && p.status !== 'completed') {
            dispatchRef.current?.('goal_completed', {
              goalTitle: updated.title,
              goalValue: updated.estimatedValue,
            });
          }
          return updated;
        }
        return p;
      })
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
      localStorage.removeItem(STORAGE_KEYS.INTEGRATIONS);
    } catch (e) {
      console.warn('LocalStorage wipe warning:', e);
    }
    setMutes([]);
    setPledgeActions([]);
    setScheduledMeetings([]);
    setSettings({
      ...DEFAULT_SETTINGS,
      userName: '',
      userEmail: '',
      privacyConsent: { hasConsented: false, consentedAt: 0, version: '1.0' },
      hasCompletedOnboarding: false,
      isSetupMode: true,
      calendarSources: [],
    });
    setIntegrationsConfig({
      channels: [],
      rules: [],
      mcpEnabled: true,
      privacyStrictRedaction: true,
    });
  }, []);

  const resetToGenericTestProfile = useCallback(() => {
    audioEngine.stopAll();
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.MUTES);
      localStorage.removeItem(STORAGE_KEYS.PLEDGES);
      localStorage.removeItem(STORAGE_KEYS.MEETINGS);
      localStorage.removeItem(STORAGE_KEYS.INTEGRATIONS);
      localStorage.setItem(PROFILE_RESET_TOKEN_KEY, CURRENT_PROFILE_RESET_TOKEN);
    } catch (e) {
      console.warn('LocalStorage reset warning:', e);
    }
    setSettings({ ...DEFAULT_SETTINGS });
    setMutes(generateInitialHistoricalMutes());
    setPledgeActions(createInitialSamplePledges());
    setScheduledMeetings(DEFAULT_SCHEDULE);
    setIntegrationsConfig(createInitialSampleIntegrations());
  }, []);

  // -----------------------------------------------------------
  // Integrations & Chat Channel Dispatch
  // -----------------------------------------------------------
  const updateIntegrationsConfig = useCallback((updates: Partial<IntegrationsConfig>) => {
    setIntegrationsConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const addChatChannel = useCallback(
    (channelData: Omit<ChatChannel, 'id' | 'createdAt' | 'verified'>) => {
      const newChannel: ChatChannel = {
        ...channelData,
        id: `chan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
        verified: false,
      };
      setIntegrationsConfig((prev) => ({
        ...prev,
        channels: [...prev.channels, newChannel],
      }));
    },
    []
  );

  const updateChatChannel = useCallback((id: string, updates: Partial<ChatChannel>) => {
    setIntegrationsConfig((prev) => ({
      ...prev,
      channels: prev.channels.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const removeChatChannel = useCallback((id: string) => {
    setIntegrationsConfig((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c.id !== id),
      // Clean up rules pointing to this channel
      rules: prev.rules.filter((r) => r.channelId !== id),
    }));
  }, []);

  const addPublishRule = useCallback((ruleData: Omit<ChannelPublishRule, 'id'>) => {
    const newRule: ChannelPublishRule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setIntegrationsConfig((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  }, []);

  const updatePublishRule = useCallback((id: string, updates: Partial<ChannelPublishRule>) => {
    setIntegrationsConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  }, []);

  const removePublishRule = useCallback((id: string) => {
    setIntegrationsConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== id),
    }));
  }, []);

  const dispatchIntegrationEvent = useCallback(
    async (
      eventType: PublishableEventType,
      customData?: Partial<EventPayloadData>
    ) => {
      const activeRules = integrationsConfig.rules.filter(
        (r) => r.enabled && r.eventType === eventType
      );
      if (activeRules.length === 0) return;

      let roastQuote: string | undefined;
      if (settings.persona === 'roastmaster') {
        const quips = [
          "Someone tell them they're on mute!",
          "Talking to the void again, are we?",
          "That's another coin in the jar, champ!",
          "Mute button: 1, User: 0.",
        ];
        roastQuote = quips[Math.floor(Math.random() * quips.length)];
      }

      const totalCoins = customData?.totalCycleCoins ?? currentCycleCoins;
      const payloadData: EventPayloadData = {
        userName: settings.userName || 'A team member',
        coinCount: customData?.coinCount ?? 1,
        totalCycleCoins: totalCoins,
        goalTitle: customData?.goalTitle,
        goalValue: customData?.goalValue,
        persona: settings.persona,
        roastQuote: customData?.roastQuote || roastQuote,
      };

      for (const rule of activeRules) {
        const channel = integrationsConfig.channels.find((c) => c.id === rule.channelId);
        if (!channel || !channel.webhookUrl) continue;

        const payload = buildSanitizedChatPayload(channel.platform, eventType, {
          ...payloadData,
          roastQuote: rule.includeRoastQuote ? payloadData.roastQuote : undefined,
        });

        sendWebhookNotification(channel, payload).catch((err) => {
          console.warn('Webhook dispatch failed:', err);
        });
      }
    },
    [integrationsConfig, settings.userName, settings.persona, currentCycleCoins]
  );

  useEffect(() => {
    dispatchRef.current = dispatchIntegrationEvent;
  }, [dispatchIntegrationEvent]);

  const testChatChannel = useCallback(
    async (channelId: string): Promise<{ success: boolean; error?: string }> => {
      const channel = integrationsConfig.channels.find((c) => c.id === channelId);
      if (!channel) return { success: false, error: 'Channel not found' };
      if (!channel.webhookUrl || !channel.webhookUrl.trim()) {
        return { success: false, error: 'Webhook URL is empty' };
      }

      const testPayload = buildSanitizedChatPayload(channel.platform, 'mute_deposit', {
        userName: settings.userName || 'Mute Jar User',
        coinCount: 1,
        totalCycleCoins: Math.max(1, currentCycleCoins),
        roastQuote: 'Connection verification ping! Privacy filter active (no meeting titles or audio are ever shared).',
      });

      const res = await sendWebhookNotification(channel, testPayload);
      if (res.success) {
        setIntegrationsConfig((prev) => ({
          ...prev,
          channels: prev.channels.map((c) =>
            c.id === channelId ? { ...c, verified: true, lastTestedAt: Date.now() } : c
          ),
        }));
      }
      return res;
    },
    [integrationsConfig.channels, settings.userName, currentCycleCoins]
  );

  // Sync state to local MCP Server RAM (Claude Desktop / Cursor)
  useEffect(() => {
    if (!integrationsConfig.mcpEnabled) return;
    const timeoutId = setTimeout(() => {
      fetch('/api/mcp/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: {
            totalCycleCoins: currentCycleCoins,
            totalMeetings: scheduledMeetings.length,
            persona: settings.persona,
            streakDays: 4,
            lastMuteAt: mutes[0]?.timestamp || Date.now(),
          },
          events: mutes
            .filter((m) => !m.undone)
            .slice(0, 30)
            .map((m) => ({
              timestamp: m.timestamp,
              coinCount: 1,
              durationSeconds: m.durationSeconds,
              detectedMethod: m.detectedMethod,
            })),
          pledges: pledgeActions.map((p) => ({
            title: p.title,
            description: p.description,
            status: p.status,
            type: p.type,
            coinsCommitted: p.coinsCommitted,
            estimatedValue: p.estimatedValue,
          })),
        }),
      }).catch(() => {
        // non-fatal if server is offline
      });
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [
    integrationsConfig.mcpEnabled,
    currentCycleCoins,
    scheduledMeetings.length,
    settings.persona,
    mutes,
    pledgeActions,
  ]);

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

    // Dispatch cycle summary to configured integrations
    dispatchRef.current?.('cycle_summary', { totalCycleCoins: currentCycleCoins });
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

  // Meeting Ledger Log Editing (Fallback editing of meeting titles and notes)
  const updateMuteRecord = useCallback((id: string, updates: Partial<MuteRecord>) => {
    setMutes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  const deleteMuteRecord = useCallback((id: string) => {
    setMutes((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Multi-Calendar Integration (Max 3, Primary Priority)
  const addCalendarSource = useCallback((source: Omit<CalendarSource, 'id'>): boolean => {
    if ((settings.calendarSources || []).length >= 3) {
      return false;
    }
    setSettings((prev) => {
      const currentSources = prev.calendarSources || [];
      if (currentSources.length >= 3) {
        return prev;
      }
      const newSource: CalendarSource = {
        ...source,
        id: `cal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isPrimary: currentSources.length === 0 ? true : !!source.isPrimary,
      };

      let updatedSources = [...currentSources];
      if (newSource.isPrimary) {
        updatedSources = updatedSources.map((s) => ({ ...s, isPrimary: false }));
      }
      updatedSources.push(newSource);
      return {
        ...prev,
        calendarSources: updatedSources,
      };
    });
    return true;
  }, [settings.calendarSources]);

  const updateCalendarSource = useCallback((id: string, updates: Partial<CalendarSource>) => {
    setSettings((prev) => {
      const currentSources = prev.calendarSources || [];
      let updated = currentSources.map((s) => (s.id === id ? { ...s, ...updates } : s));
      if (updates.isPrimary) {
        updated = updated.map((s) => (s.id === id ? { ...s, isPrimary: true } : { ...s, isPrimary: false }));
      }
      return {
        ...prev,
        calendarSources: updated,
      };
    });
  }, []);

  const removeCalendarSource = useCallback((id: string) => {
    setSettings((prev) => {
      const currentSources = prev.calendarSources || [];
      const filtered = currentSources.filter((s) => s.id !== id);
      const hadPrimary = filtered.some((s) => s.isPrimary);
      if (!hadPrimary && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return {
        ...prev,
        calendarSources: filtered,
      };
    });
  }, []);

  const setPrimaryCalendar = useCallback((id: string) => {
    setSettings((prev) => {
      const currentSources = prev.calendarSources || [];
      const updated = currentSources.map((s) => ({
        ...s,
        isPrimary: s.id === id,
      }));
      return {
        ...prev,
        calendarSources: updated,
      };
    });
  }, []);

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
        toggleDoNotDisturb,
        playPreviewSound: (soundId?: string) => audioEngine.playPreviewSound(soundId || settings.depositSoundId || 'glass_clink'),
        calibrateRoomNoise,
        calibrateVoiceProfile,
        clearVoiceProfile,
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
        resetToGenericTestProfile,
        resetCurrentMonthJar,
        testCoinDrop,
        // Integrations & MCP
        integrationsConfig,
        updateIntegrationsConfig,
        addChatChannel,
        updateChatChannel,
        removeChatChannel,
        addPublishRule,
        updatePublishRule,
        removePublishRule,
        testChatChannel,
        dispatchIntegrationEvent,
        // Meeting Ledger Log Editing
        updateMuteRecord,
        deleteMuteRecord,
        // Multi-Calendar Integration (Max 3, Primary Priority)
        addCalendarSource,
        updateCalendarSource,
        removeCalendarSource,
        setPrimaryCalendar,
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
