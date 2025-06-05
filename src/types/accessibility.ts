export interface AccessibilitySettings {
  screenReader: boolean;
  largeText: boolean;
  extraLargeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  voiceOver: boolean;
  hapticFeedback: boolean;
  audioDescriptions: boolean;
  slowAnimations: boolean;
  buttonShapes: boolean;
  increaseContrast: boolean;
}

export interface VoiceAccessibilityOptions {
  confirmationRequired: boolean;
  repeatCommands: boolean;
  verboseMode: boolean;
  slowSpeech: boolean;
  pauseBetweenMessages: number;
  maximumVolumeBoost: boolean;
}

export interface NavigationAccessibility {
  skipLinks: boolean;
  breadcrumbs: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  gestureAlternatives: boolean;
}

export enum AccessibilityRole {
  BUTTON = 'button',
  HEADER = 'header',
  TEXT = 'text',
  IMAGE = 'image',
  LINK = 'link',
  LIST = 'list',
  LIST_ITEM = 'listitem',
  ALERT = 'alert',
  SEARCH = 'search',
  NAVIGATION = 'navigation',
}

export interface AccessibilityProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityActions?: AccessibilityAction[];
  testID?: string;
}

export interface AccessibilityAction {
  name: string;
  label: string;
}

export interface ColorContrastRequirements {
  normal: {
    aa: number;
    aaa: number;
  };
  large: {
    aa: number;
    aaa: number;
  };
}