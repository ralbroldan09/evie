import React from 'react';
import {
  Text as RNText,
  StyleSheet,
  TextStyle,
  AccessibilityRole,
} from 'react-native';

export interface TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
  weight?: 'normal' | 'medium' | 'bold';
  align?: 'left' | 'center' | 'right';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
  onPress?: () => void;
}

const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  weight = 'normal',
  align = 'left',
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  testID,
  style,
  numberOfLines,
  ellipsizeMode,
  selectable = false,
  onPress,
}) => {
  const textStyle = [
    styles.base,
    styles[variant],
    styles[`${color}Color`],
    styles[`${weight}Weight`],
    styles[`${align}Align`],
    style,
  ];

  return (
    <RNText
      style={textStyle}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole || (onPress ? 'button' : 'text')}
      testID={testID}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      selectable={selectable}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },

  // Variant styles - Typography scale for accessibility
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'normal',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'normal',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Color styles - Evie accessibility theme
  primaryColor: {
    color: '#FFFFFF', // Primary text color
  },
  secondaryColor: {
    color: '#B0B0B0', // Secondary text color
  },
  accentColor: {
    color: '#FFA500', // Primary accent color
  },
  dangerColor: {
    color: '#FF4444', // Error/danger color
  },
  successColor: {
    color: '#4CAF50', // Success color
  },

  // Weight styles
  normalWeight: {
    fontWeight: 'normal',
  },
  mediumWeight: {
    fontWeight: '500',
  },
  boldWeight: {
    fontWeight: 'bold',
  },

  // Alignment styles
  leftAlign: {
    textAlign: 'left',
  },
  centerAlign: {
    textAlign: 'center',
  },
  rightAlign: {
    textAlign: 'right',
  },
});

export default Text;