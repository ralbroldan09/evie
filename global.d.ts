// Global type definitions for EVIE accessibility app

declare module '*.png' {
  const value: any;
  export = value;
}

declare module '*.jpg' {
  const value: any;
  export = value;
}

declare module '*.jpeg' {
  const value: any;
  export = value;
}

declare module '*.svg' {
  import React from 'react';
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

// React Native accessibility enhancements
declare global {
  namespace ReactNative {
    interface AccessibilityProps {
      accessibilityLabel?: string;
      accessibilityHint?: string;
      accessibilityRole?: AccessibilityRole;
      accessibilityState?: AccessibilityState;
      accessibilityActions?: ReadonlyArray<AccessibilityActionInfo>;
      onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
      accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
      accessibilityElementsHidden?: boolean;
      accessibilityViewIsModal?: boolean;
      importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
    }

    interface AccessibilityActionInfo {
      name: AccessibilityActionName | string;
      label?: string;
    }

    type AccessibilityActionName =
      | 'activate'
      | 'increment'
      | 'decrement'
      | 'longpress'
      | 'escape'
      | 'scroll';

    interface AccessibilityActionEvent {
      nativeEvent: {
        actionName: string;
      };
    }

    type AccessibilityRole =
      | 'none'
      | 'button'
      | 'link'
      | 'search'
      | 'image'
      | 'keyboardkey'
      | 'text'
      | 'adjustable'
      | 'imagebutton'
      | 'header'
      | 'summary'
      | 'alert'
      | 'checkbox'
      | 'combobox'
      | 'menu'
      | 'menubar'
      | 'menuitem'
      | 'progressbar'
      | 'radio'
      | 'radiogroup'
      | 'scrollbar'
      | 'spinbutton'
      | 'switch'
      | 'tab'
      | 'tablist'
      | 'timer'
      | 'toolbar';

    interface AccessibilityState {
      disabled?: boolean;
      selected?: boolean;
      checked?: boolean | 'mixed';
      busy?: boolean;
      expanded?: boolean;
    }
  }

  // Voice recognition and speech synthesis types
  namespace Voice {
    interface SpeechRecognitionEvent {
      value: string[];
      error?: string;
    }

    interface SpeechSynthesisOptions {
      text: string;
      language?: string;
      pitch?: number;
      rate?: number;
      volume?: number;
    }

    interface VoiceCommand {
      phrase: string;
      action: string;
      parameters?: Record<string, any>;
      confidence?: number;
    }

    interface WakeWordDetection {
      isListening: boolean;
      keyword: string;
      sensitivity: number;
    }
  }

  // Message types for accessibility app
  namespace Messaging {
    interface AccessibleMessage {
      id: string;
      content: string;
      timestamp: Date;
      isOutgoing: boolean;
      isRead: boolean;
      hasAudio?: boolean;
      audioTranscription?: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      accessibilityLabel: string;
      accessibilityHint?: string;
    }

    interface Contact {
      id: string;
      name: string;
      phoneNumber?: string;
      email?: string;
      preferredCommunication: 'voice' | 'text' | 'both';
      accessibilityPreferences?: {
        largeText: boolean;
        highContrast: boolean;
        voiceAnnouncements: boolean;
      };
    }

    interface Conversation {
      id: string;
      contactId: string;
      messages: AccessibleMessage[];
      lastActivity: Date;
      isArchived: boolean;
      hasUnreadMessages: boolean;
      accessibilityLabel: string;
    }
  }

  // App settings for accessibility
  namespace Settings {
    interface AccessibilitySettings {
      screenReader: boolean;
      largeText: boolean;
      highContrast: boolean;
      reduceMotion: boolean;
      voiceOver: boolean;
      hapticFeedback: boolean;
      audioDescriptions: boolean;
      slowAnimations: boolean;
    }

    interface VoiceSettings {
      wakeWordEnabled: boolean;
      wakeWordSensitivity: number;
      voiceRecognitionLanguage: string;
      speechSynthesisVoice: string;
      speechRate: number;
      speechPitch: number;
      speechVolume: number;
      noiseReduction: boolean;
    }

    interface AppSettings {
      accessibility: AccessibilitySettings;
      voice: VoiceSettings;
      notifications: {
        enabled: boolean;
        sound: boolean;
        vibration: boolean;
        priorityOnly: boolean;
      };
      privacy: {
        voiceDataRetention: number;
        shareUsageData: boolean;
        localProcessingOnly: boolean;
      };
    }
  }

  // Error handling for accessibility features
  namespace Errors {
    interface AccessibilityError extends Error {
      type: 'screen_reader' | 'voice_recognition' | 'speech_synthesis' | 'haptic';
      severity: 'low' | 'medium' | 'high' | 'critical';
      userMessage: string;
      technicalDetails?: string;
      recoveryAction?: string;
    }

    interface VoiceError extends Error {
      type: 'wake_word' | 'recognition' | 'synthesis' | 'permissions';
      code: string;
      isRecoverable: boolean;
      fallbackAvailable: boolean;
    }
  }

  // Navigation types with accessibility support
  namespace Navigation {
    interface AccessibleNavigationState {
      routeName: string;
      accessibilityLabel: string;
      accessibilityHint?: string;
      announceOnFocus: boolean;
      skipToContent?: boolean;
    }

    interface VoiceNavigationCommand {
      command: string;
      targetScreen: string;
      parameters?: Record<string, any>;
      confirmationRequired: boolean;
    }
  }
}

// Module augmentation for React Native components
declare module 'react-native' {
  interface TextProps extends ReactNative.AccessibilityProps {
    accessibilityRole?: ReactNative.AccessibilityRole;
  }

  interface ViewProps extends ReactNative.AccessibilityProps {
    accessibilityRole?: ReactNative.AccessibilityRole;
  }

  interface TouchableOpacityProps extends ReactNative.AccessibilityProps {
    accessibilityRole?: ReactNative.AccessibilityRole;
  }

  interface PressableProps extends ReactNative.AccessibilityProps {
    accessibilityRole?: ReactNative.AccessibilityRole;
  }
}

// Porcupine wake word detection types
declare module '@picovoice/porcupine-react-native' {
  export interface PorcupineManager {
    start(): Promise<void>;
    stop(): Promise<void>;
    delete(): Promise<void>;
  }

  export interface PorcupineManagerOptions {
    accessKey: string;
    keywords: string[];
    sensitivities?: number[];
    processErrorCallback?: (error: string) => void;
    keywordCallback?: (keywordIndex: number) => void;
  }

  export function PorcupineManager(options: PorcupineManagerOptions): PorcupineManager;
}

export {};