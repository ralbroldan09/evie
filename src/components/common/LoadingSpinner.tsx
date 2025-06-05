import React from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Text from './Text';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#FFA500', // Evie accent color
  message,
  style,
  accessibilityLabel,
  testID,
  overlay = false,
}) => {
  const containerStyle = [
    styles.container,
    overlay && styles.overlayContainer,
    style,
  ];

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityLabel={accessibilityLabel || message || 'Loading'}
      accessibilityRole="progressbar"
      testID={testID}
    >
      <ActivityIndicator
        size={size}
        color={color}
        style={styles.spinner}
      />
      
      {message && (
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={styles.message}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.8)', // Semi-transparent dark overlay
    zIndex: 999,
  },

  spinner: {
    marginBottom: 8,
  },

  message: {
    marginTop: 8,
  },
});

export default LoadingSpinner;