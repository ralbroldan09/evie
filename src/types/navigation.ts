export type RootStackParamList = {
  Home: undefined;
  Setup: {
    step?: 'welcome' | 'permissions' | 'wake-word' | 'voice-training' | 'complete';
  };
  Settings: undefined;
  Messages: {
    contactId?: string;
  };
  Contacts: undefined;
  Help: {
    section?: 'getting-started' | 'voice-commands' | 'accessibility' | 'troubleshooting';
  };
};

export type ScreenNames = keyof RootStackParamList;

import { NavigationProp, RouteProp } from '@react-navigation/native';

export interface NavigationProps<T extends ScreenNames> {
  navigation: NavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
}

export interface AccessibleNavigationOptions {
  headerTitle: string;
  headerAccessibilityLabel: string;
  headerAccessibilityHint?: string;
  gestureEnabled: boolean;
  screenReaderFocusable: boolean;
  announceOnFocus: boolean;
}