export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface WakeWordDetection {
  keyword: string;
  confidence: number;
  timestamp: Date;
}

export interface VoiceCommand {
  command: string;
  intent: VoiceIntent;
  parameters: Record<string, any>;
  confidence: number;
}

export enum VoiceIntent {
  SEND_MESSAGE = 'send_message',
  READ_MESSAGES = 'read_messages',
  NAVIGATE = 'navigate',
  SETTINGS = 'settings',
  HELP = 'help',
  CANCEL = 'cancel',
  REPEAT = 'repeat',
}

export interface SpeechSynthesisConfig {
  text: string;
  language: string;
  pitch: number;
  rate: number;
  volume: number;
  voice?: string;
}

export interface VoiceSettings {
  wakeWordEnabled: boolean;
  wakeWordSensitivity: number;
  language: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  noiseReduction: boolean;
  continuousListening: boolean;
}