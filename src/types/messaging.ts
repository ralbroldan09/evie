export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isOutgoing: boolean;
  isRead: boolean;
  hasAudio: boolean;
  audioTranscription?: string;
  priority: MessagePriority;
  deliveryStatus: DeliveryStatus;
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  preferredCommunication: CommunicationType;
  accessibilityPreferences: AccessibilityPreferences;
  isBlocked: boolean;
  isFavorite: boolean;
}

export enum CommunicationType {
  VOICE = 'voice',
  TEXT = 'text',
  BOTH = 'both',
}

export interface AccessibilityPreferences {
  largeText: boolean;
  highContrast: boolean;
  voiceAnnouncements: boolean;
  slowSpeech: boolean;
  repeatMessages: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  messages: Message[];
  lastActivity: Date;
  isArchived: boolean;
  hasUnreadMessages: boolean;
  unreadCount: number;
  isMuted: boolean;
}

export interface MessageDraft {
  contactId: string;
  content: string;
  isVoiceMessage: boolean;
  audioUri?: string;
  transcription?: string;
}