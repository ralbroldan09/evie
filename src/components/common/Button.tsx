import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
  AccessibilityRole,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const buttonStyle = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    disabled && styles.disabledContainer,
    loading && styles.loadingContainer,
    style,
  ];

  const buttonTextStyle = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#1A1A1A' : '#FFA500'}
            style={styles.loadingIndicator}
          />
          <Text style={buttonTextStyle}>Loading...</Text>
        </>
      );
    }

    const textElement = <Text style={buttonTextStyle}>{title}</Text>;

    if (icon) {
      return iconPosition === 'left' ? (
        <>
          {icon}
          {textElement}
        </>
      ) : (
        <>
          {textElement}
          {icon}
        </>
      );
    }

    return textElement;
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={testID}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44, // Accessibility minimum touch target
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Variant styles
  primaryContainer: {
    backgroundColor: '#FFA500', // Primary accent color
    borderWidth: 0,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  dangerContainer: {
    backgroundColor: '#FF4444',
    borderWidth: 0,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Size styles
  smallContainer: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumContainer: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeContainer: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Disabled and loading states
  disabledContainer: {
    opacity: 0.5,
  },
  loadingContainer: {
    opacity: 0.8,
  },

  // Text styles
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },

  // Variant text styles
  primaryText: {
    color: '#1A1A1A', // Dark text on light background
  },
  secondaryText: {
    color: '#FFA500', // Accent color text
  },
  dangerText: {
    color: '#FFFFFF',
  },
  ghostText: {
    color: '#FFFFFF', // White text for dark theme
  },

  // Size text styles
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Disabled text
  disabledText: {
    opacity: 0.7,
  },

  // Loading indicator
  loadingIndicator: {
    marginRight: 8,
  },
});

export default Button;