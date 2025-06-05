import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Vibration,
  Platform,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { VoiceServiceState } from '@/services/VoiceService';
import { colors, spacing, borderRadius, textStyles, accessibility } from '@/utils/theme';

export interface VoiceStatusProps {
  status: VoiceServiceState;
  isListening: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  enableHaptics?: boolean;
  testID?: string;
}

interface StatusConfig {
  color: string;
  backgroundColor: string;
  label: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  icon: string;
  shouldPulse: boolean;
  hapticPattern?: 'light' | 'medium' | 'heavy';
}

const VoiceStatusIndicator: React.FC<VoiceStatusProps> = ({
  status,
  isListening,
  isLoading,
  hasError,
  errorMessage,
  onPress,
  onLongPress,
  disabled = false,
  size = 'large',
  showLabel = true,
  enableHaptics = true,
  testID = 'voice-status-indicator',
}) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;
  const previousStatusRef = useRef<VoiceServiceState>(status);

  const getStatusConfig = (): StatusConfig => {
    if (hasError) {
      return {
        color: colors.error,
        backgroundColor: `${colors.error}20`,
        label: 'Error',
        accessibilityLabel: 'Voice detection error',
        accessibilityHint: errorMessage || 'Voice detection encountered an error. Tap to retry.',
        icon: '⚠️',
        shouldPulse: false,
        hapticPattern: 'heavy',
      };
    }

    if (isLoading) {
      return {
        color: colors.secondary,
        backgroundColor: `${colors.secondary}20`,
        label: 'Loading...',
        accessibilityLabel: 'Voice detection loading',
        accessibilityHint: 'Voice detection is starting up. Please wait.',
        icon: '⏳',
        shouldPulse: false,
      };
    }

    switch (status) {
      case VoiceServiceState.LISTENING:
        return {
          color: colors.primary,
          backgroundColor: `${colors.primary}20`,
          label: 'Listening',
          accessibilityLabel: 'Voice detection active, listening for sunshine keyword',
          accessibilityHint: 'Say sunshine to activate voice commands.',
          icon: '🎤',
          shouldPulse: true,
          hapticPattern: 'light',
        };

      case VoiceServiceState.PROCESSING:
        return {
          color: colors.success,
          backgroundColor: `${colors.success}20`,
          label: 'Processing',
          accessibilityLabel: 'Keyword detected, processing voice command',
          accessibilityHint: 'Voice command is being processed.',
          icon: '🔄',
          shouldPulse: true,
          hapticPattern: 'medium',
        };

      case VoiceServiceState.PERMISSION_DENIED:
        return {
          color: colors.warning,
          backgroundColor: `${colors.warning}20`,
          label: 'Permission Required',
          accessibilityLabel: 'Microphone permission required',
          accessibilityHint: 'Tap to grant microphone permission for voice detection.',
          icon: '🔒',
          shouldPulse: false,
          hapticPattern: 'medium',
        };

      case VoiceServiceState.INITIALIZING:
        return {
          color: colors.secondary,
          backgroundColor: `${colors.secondary}20`,
          label: 'Initializing',
          accessibilityLabel: 'Voice detection initializing',
          accessibilityHint: 'Voice detection is starting up.',
          icon: '⚙️',
          shouldPulse: false,
        };

      case VoiceServiceState.IDLE:
      default:
        return {
          color: colors.textSecondary,
          backgroundColor: `${colors.textSecondary}20`,
          label: 'Ready',
          accessibilityLabel: 'Voice detection ready',
          accessibilityHint: 'Tap to start listening for voice commands.',
          icon: '💤',
          shouldPulse: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 60 },
          text: { fontSize: 12 },
          icon: { fontSize: 20 },
        };
      case 'medium':
        return {
          container: { width: 80, height: 80 },
          text: { fontSize: 14 },
          icon: { fontSize: 28 },
        };
      case 'large':
      default:
        return {
          container: { width: 120, height: 120 },
          text: { fontSize: 16 },
          icon: { fontSize: 40 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Pulse animation for active states
  useEffect(() => {
    if (statusConfig.shouldPulse && !disabled) {
      const startPulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      startPulse();
    } else {
      pulseAnimation.setValue(1);
    }

    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [statusConfig.shouldPulse, disabled, pulseAnimation]);

  // Loading rotation animation
  useEffect(() => {
    if (isLoading) {
      const startRotation = () => {
        Animated.loop(
          Animated.timing(rotationAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      };

      startRotation();
    } else {
      rotationAnimation.setValue(0);
    }

    return () => {
      rotationAnimation.stopAnimation();
    };
  }, [isLoading, rotationAnimation]);

  // Status change announcements and haptics
  useEffect(() => {
    if (previousStatusRef.current !== status) {
      // Announce status change to screen readers
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(statusConfig.accessibilityLabel);
      }

      // Haptic feedback
      if (enableHaptics && statusConfig.hapticPattern && Platform.OS === 'ios') {
        const { hapticPattern } = statusConfig;
        switch (hapticPattern) {
          case 'light':
            Vibration.vibrate(50);
            break;
          case 'medium':
            Vibration.vibrate(100);
            break;
          case 'heavy':
            Vibration.vibrate([0, 200]);
            break;
        }
      } else if (enableHaptics && Platform.OS === 'android') {
        Vibration.vibrate(100);
      }

      previousStatusRef.current = status;
    }
  }, [status, statusConfig, enableHaptics]);

  const handlePress = () => {
    if (disabled) return;

    // Scale animation for press feedback
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;

    // Haptic feedback for long press
    if (enableHaptics) {
      if (Platform.OS === 'ios') {
        Vibration.vibrate(200);
      } else {
        Vibration.vibrate([0, 200]);
      }
    }

    onLongPress?.();
  };

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...sizeStyles.container,
    backgroundColor: statusConfig.backgroundColor,
    borderColor: statusConfig.color,
    opacity: disabled ? 0.6 : 1,
  };

  const iconRotation = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={[
        containerStyle,
        {
          transform: [
            { scale: Animated.multiply(pulseAnimation, scaleAnimation) },
          ],
        },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled || !onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={statusConfig.accessibilityLabel}
      accessibilityHint={statusConfig.accessibilityHint}
      accessibilityState={{
        disabled,
        busy: isLoading,
        selected: isListening,
      }}
      testID={testID}
    >
      <Animated.Text
        style={[
          styles.icon,
          sizeStyles.icon,
          isLoading && { transform: [{ rotate: iconRotation }] },
        ]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        {statusConfig.icon}
      </Animated.Text>

      {showLabel && (
        <Text
          style={[
            styles.label,
            sizeStyles.text,
            { color: statusConfig.color },
          ]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        >
          {statusConfig.label}
        </Text>
      )}

      {hasError && errorMessage && (
        <Text
          style={styles.errorText}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
          numberOfLines={2}
        >
          {errorMessage}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: accessibility.minTouchTarget,
    minWidth: accessibility.minTouchTarget,
  } as ViewStyle,

  icon: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  } as TextStyle,

  label: {
    ...textStyles.label,
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,

  errorText: {
    ...textStyles.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  } as TextStyle,
});

export default VoiceStatusIndicator;