import React from 'react';
import {
  View as RNView,
  StyleSheet,
  ViewStyle,
} from 'react-native';

export interface ViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  background?: 'primary' | 'secondary' | 'accent' | 'surface' | 'transparent';
  flex?: number;
  row?: boolean;
  center?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  accessible?: boolean;
}

const View: React.FC<ViewProps> = ({
  children,
  style,
  padding = 'none',
  margin = 'none',
  background = 'transparent',
  flex,
  row = false,
  center = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  accessible,
}) => {
  const viewStyle = [
    styles.base,
    padding !== 'none' && styles[`${padding}Padding`],
    margin !== 'none' && styles[`${margin}Margin`],
    background !== 'transparent' && styles[`${background}Background`],
    flex !== undefined && { flex },
    row && styles.row,
    center && styles.center,
    style,
  ];

  return (
    <RNView
      style={viewStyle}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      {children}
    </RNView>
  );
};

const styles = StyleSheet.create({
  base: {
    // Base styles
  },

  // Layout styles
  row: {
    flexDirection: 'row',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Padding styles
  smallPadding: {
    padding: 8,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },

  // Margin styles
  smallMargin: {
    margin: 8,
  },
  mediumMargin: {
    margin: 16,
  },
  largeMargin: {
    margin: 24,
  },

  // Background styles - Evie theme colors
  primaryBackground: {
    backgroundColor: '#1A1A1A', // Primary background
  },
  secondaryBackground: {
    backgroundColor: '#2A2A2A', // Secondary background
  },
  accentBackground: {
    backgroundColor: '#FFA500', // Accent background
  },
  surfaceBackground: {
    backgroundColor: '#333333', // Surface background
  },
});

export default View;