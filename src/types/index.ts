export type PersonaType = 'saint' | 'pragmatist' | 'roastmaster';

export interface PrivacyConsent {
  hasConsented: boolean;
  consentedAt: number;
  version: string;
}

export interface MuteRecord {
  id: string;
  timestamp: number;
  meetingTitle: string;
  durationSeconds: number;
  undone: boolean;
  monthKey: string; // 'YYYY-MM'
  detectedMethod: 'auto_audio' | 'manual';
}

export interface MonthStats {
  monthKey: string; // 'YYYY-MM'
  totalCoins: number;
  meetingCount: number;
}

export type CycleFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type PledgeType = 'charity' | 'pledge' | 'goal';
export type PledgeStatus = 'pending' | 'in_progress' | 'completed';

export interface PledgeActionRecord {
  id: string;
  monthKey: string;
  cycleKey?: string;
  type: PledgeType;
  title: string;
  description: string;
  coinsCommitted: number;
  estimatedValue: string;
  status: PledgeStatus;
  createdAt: number;
  actionedAt?: number;
  actionNotes?: string;
  donationUrl?: string;
  evidenceUrl?: string;
  receiptDataUrl?: string; // Uploaded receipt image or document
  receiptFileName?: string;
  receiptUploadedAt?: number;
  photoDataUrl?: string; // Captured or uploaded completion photo
  photoCapturedAt?: number;
}

export interface CharityAggregator {
  id: string;
  name: string;
  region: 'global' | 'us' | 'uk' | 'au' | 'ca' | 'custom';
  url: string;
  description: string;
  feeInfo: string;
  highlight?: boolean;
}

export interface UserVoiceProfile {
  medianPitchHz: number; // Fundamental frequency (F0) in Hz (e.g. 135 Hz)
  pitchRangeHz: [number, number]; // [minPitch, maxPitch] typical vocal band
  spectralFingerprint: number[]; // 16-band normalized vocal resonance / formant vector
  calibratedAt: number;
  sampleCount: number;
}

export interface UserSettings {
  userName: string;
  userEmail?: string;
  userAvatar: string;
  privacyConsent: PrivacyConsent;
  persona: PersonaType;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  depositSoundId?: string; // System sound effect for Mutecoin deposits (default: 'glass_clink')
  sensitivity: number; // 1 to 10
  filterBackgroundNoise?: boolean; // Reject ambient background noise and far-field speech
  filterRadioBackground?: boolean; // Alias for backward compatibility
  noiseFloorMargin?: number; // Margin in % above ambient background floor (default: 15)
  calibratedNoiseFloor?: number; // Calibrated ambient room background noise level (0 to 100)
  microphoneMode?: 'near_field' | 'headset' | 'standard'; // Voice proximity profile
  // Speaker Voice Pattern & Voiceprint Filter
  userVoiceProfile?: UserVoiceProfile;
  voiceProfileEnabled?: boolean; // When true, only speech matching the user's voiceprint will trigger Mutecoins
  voiceMatchThreshold?: number; // Minimum match % (e.g. 65%) to accept as the user's voice
  autoDetectMeetingAudio: boolean;
  autoStartMonitoring: boolean;
  autoStartOnOSBoot: boolean;
  minimizeToTray?: boolean; // When closing or minimizing, keep active in system tray / status bar
  pauseOnDoNotDisturb?: boolean; // When true, pause audio monitor when OS focus or Do Not Disturb is active (default: true)
  reminderDay: number; // day of month (e.g. 28)
  reminderHour: number; // 0 to 23
  country: string;
  currency: string;
  currencyCode: string;
  perCoinValue: number;
  hasCompletedOnboarding: boolean;
  isSetupMode: boolean;
  customCharityUrl?: string;
  customCharityName?: string;
  selectedCharityId?: string;
  saintTargetCoins?: number; // target threshold in Mutecoins to trigger donation

  pragmatistGoalTitle?: string;
  pragmatistGoalDescription?: string;
  pragmatistTargetCoins?: number; // target in Mutecoins (not currency)

  roastActivityTitle?: string;
  roastActivityDescription?: string;
  roastTargetCoins?: number; // target in Mutecoins (not currency)

  philosophyLabelStyle?: 'improved' | 'classic';

  cycleFrequency: CycleFrequency; // 'weekly' | 'fortnightly' | 'monthly'
  pendingPersonaChange?: {
    nextPersona: PersonaType;
    effectiveAtCycleEnd: boolean;
  };

  activeMeetingTitle?: string;
  activeTargetTitle?: string;
  activeTargetDescription?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // '09:30'
  endTime: string; // '10:00'
}
