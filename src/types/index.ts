export * from './voice';
export * from './messaging';
export * from './accessibility';
export * from './navigation';

export interface AppSettings {
  accessibility: import('./accessibility').AccessibilitySettings;
  voice: import('./voice').VoiceSettings;
  voiceAccessibility: import('./accessibility').VoiceAccessibilityOptions;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  priorityOnly: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface PrivacySettings {
  voiceDataRetention: number;
  shareUsageData: boolean;
  localProcessingOnly: boolean;
  encryptMessages: boolean;
  requireAuthentication: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  accentColor: string;
  reducedMotion: boolean;
}

export interface AppError {
  id: string;
  type: 'voice' | 'messaging' | 'accessibility' | 'network' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  timestamp: Date;
  isRecoverable: boolean;
  recoveryAction?: string;
  technicalDetails?: string;
}