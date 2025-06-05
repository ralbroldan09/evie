export * from './VoiceService';
export * from './SMSService.android';

// Platform-specific exports
export { default as VoiceService } from './VoiceService';

// Conditional platform exports
import { Platform } from 'react-native';

// SMS Service - Android only
export let SMSService: any = null;
if (Platform.OS === 'android') {
  SMSService = require('./SMSService.android').default;
}

// Re-export existing service interfaces
export * from './voiceService';
export * from './messagingService';
export * from './accessibilityService';
export * from './storageService';
export * from './permissionsService';
export * from './notificationService';