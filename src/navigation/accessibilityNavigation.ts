import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { AccessibleNavigationOptions } from '@/types/navigation';
import { colors, accessibility } from '@/utils/theme';

export const getAccessibleNavigationOptions = (
  options: AccessibleNavigationOptions
): NativeStackNavigationOptions => {
  return {
    title: options.headerTitle,
    headerAccessibilityLabel: options.headerAccessibilityLabel,
    headerAccessibilityHint: options.headerAccessibilityHint,
    gestureEnabled: options.gestureEnabled,
    
    headerStyle: {
      backgroundColor: colors.surface,
    },
    
    headerTitleStyle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      accessibilityRole: 'header',
    },
    
    headerTintColor: colors.primary,
    
    headerBackTitleVisible: false,
    
    headerBackAccessibilityLabel: 'Go back',
    
    animation: 'slide_from_right',
    animationDuration: accessibility.timing.medium,
    
    headerBackButtonMenuEnabled: false,
    
    headerLargeTitle: false,
    
    contentStyle: {
      backgroundColor: colors.background,
    },
  };
};

export const getReducedMotionNavigationOptions = (): Partial<NativeStackNavigationOptions> => {
  return {
    animation: 'none',
    animationDuration: 0,
  };
};

export const getHighContrastNavigationOptions = (): Partial<NativeStackNavigationOptions> => {
  return {
    headerStyle: {
      backgroundColor: colors.accessibility.highContrast.background,
      borderBottomWidth: 2,
      borderBottomColor: colors.accessibility.highContrast.border,
    },
    
    headerTitleStyle: {
      color: colors.accessibility.highContrast.text,
      fontWeight: 'bold',
    },
    
    headerTintColor: colors.accessibility.highContrast.text,
    
    contentStyle: {
      backgroundColor: colors.accessibility.highContrast.background,
    },
  };
};

export const getVoiceNavigationAnnouncement = (screenName: string): string => {
  const announcements: Record<string, string> = {
    Home: 'Navigated to Home screen. Main voice interface is ready.',
    Setup: 'Navigated to Setup screen. Configure your voice settings here.',
    Settings: 'Navigated to Settings screen. Adjust app preferences.',
    Messages: 'Navigated to Messages screen. View your conversations.',
    Contacts: 'Navigated to Contacts screen. Manage your contacts.',
    Help: 'Navigated to Help screen. Get assistance with the app.',
  };
  
  return announcements[screenName] || `Navigated to ${screenName} screen.`;
};

export const accessibilityNavigationConfig = {
  minimumTouchTarget: accessibility.minTouchTarget,
  focusOutlineWidth: accessibility.focusOutlineWidth,
  animationDuration: {
    normal: accessibility.timing.medium,
    reduced: accessibility.timing.reduced,
  },
  colors: {
    focus: colors.accessibility.focus,
    focusRing: colors.accessibility.focusRing,
  },
};