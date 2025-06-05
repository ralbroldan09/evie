import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Text from './Text';

export interface AccessibleIconProps {
  name: string;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
}

// Simple icon component using Unicode symbols for accessibility
// This avoids external dependencies and works on all platforms
const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  name,
  size = 24,
  color = '#FFFFFF',
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}) => {
  // Map of icon names to Unicode symbols
  const iconMap: Record<string, string> = {
    // Voice/Audio icons
    microphone: '🎤',
    'microphone-off': '🔇',
    speaker: '🔊',
    'speaker-off': '🔇',
    headphones: '🎧',
    
    // Communication icons
    message: '💬',
    phone: '📞',
    'phone-call': '📞',
    contact: '👤',
    contacts: '👥',
    
    // Navigation icons
    home: '🏠',
    settings: '⚙️',
    back: '←',
    forward: '→',
    up: '↑',
    down: '↓',
    
    // Action icons
    play: '▶️',
    pause: '⏸️',
    stop: '⏹️',
    record: '⏺️',
    save: '💾',
    edit: '✏️',
    delete: '🗑️',
    add: '➕',
    remove: '➖',
    
    // Status icons
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    
    // Accessibility icons
    accessibility: '♿',
    'text-to-speech': '🗣️',
    'speech-to-text': '🎙️',
    'high-contrast': '🔆',
    
    // Default fallback
    default: '◯',
  };

  const iconSymbol = iconMap[name] || iconMap.default;

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="image"
      testID={testID}
    >
      <Text
        style={[
          styles.icon,
          {
            fontSize: size * 0.8, // Slightly smaller than container
            color,
          },
        ]}
      >
        {iconSymbol}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    textAlign: 'center',
  },
});

export default AccessibleIcon;