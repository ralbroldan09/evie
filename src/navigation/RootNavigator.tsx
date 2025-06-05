import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import { RootStackParamList } from '@/types/navigation';
import { colors } from '@/utils/theme';
import { getAccessibleNavigationOptions } from './accessibilityNavigation';

import HomeScreen from '@/screens/HomeScreen';
import SetupScreen from '@/screens/SetupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.textPrimary,
          },
          headerBackTitleVisible: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={getAccessibleNavigationOptions({
            headerTitle: 'Evie Voice Assistant',
            headerAccessibilityLabel: 'Home screen, main listening interface',
            headerAccessibilityHint: 'Double tap to hear voice commands',
            gestureEnabled: false,
            screenReaderFocusable: true,
            announceOnFocus: true,
          })}
        />
        
        <Stack.Screen
          name="Setup"
          component={SetupScreen}
          options={getAccessibleNavigationOptions({
            headerTitle: 'Setup',
            headerAccessibilityLabel: 'Setup screen for voice configuration',
            headerAccessibilityHint: 'Configure wake word and voice settings',
            gestureEnabled: true,
            screenReaderFocusable: true,
            announceOnFocus: true,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;