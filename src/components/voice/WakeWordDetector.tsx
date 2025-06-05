import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { useVoiceDetection } from '@/hooks/useVoiceDetection';
import Text from '@/components/common/Text';
import AccessibleIcon from '@/components/common/AccessibleIcon';

export interface WakeWordDetectorProps {
  wakeWord: string;
  sensitivity: number;
  onWakeWordDetected: (word: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  autoStart?: boolean;
}

const WakeWordDetector: React.FC<WakeWordDetectorProps> = ({
  wakeWord,
  sensitivity,
  onWakeWordDetected,
  onError,
  enabled = true,
  autoStart = true,
}) => {
  const {
    state,
    startListening,
    stopListening,
    requestPermission,
  } = useVoiceDetection();

  // Handle wake word detection
  const handleKeywordDetected = useCallback(() => {
    AccessibilityInfo.announceForAccessibility(`Wake word "${wakeWord}" detected`);
    onWakeWordDetected(wakeWord);
  }, [wakeWord, onWakeWordDetected]);

  // Handle errors
  const handleError = useCallback((error: string) => {
    AccessibilityInfo.announceForAccessibility(`Voice detection error: ${error}`);
    onError?.(error);
  }, [onError]);

  // Monitor for keyword detection
  useEffect(() => {
    if (state.keywordDetected) {
      handleKeywordDetected();
    }
  }, [state.keywordDetected, handleKeywordDetected]);

  // Monitor for errors
  useEffect(() => {
    if (state.error) {
      handleError(state.error);
    }
  }, [state.error, handleError]);

  // Auto-start listening if enabled
  useEffect(() => {
    const initializeDetection = async () => {
      if (enabled && autoStart && !state.isListening && !state.error) {
        if (!state.hasPermission) {
          const granted = await requestPermission();
          if (!granted) {
            handleError('Microphone permission denied');
            return;
          }
        }
        
        await startListening();
      }
    };

    initializeDetection();
  }, [enabled, autoStart, state.isListening, state.error, state.hasPermission, startListening, requestPermission, handleError]);

  // Stop listening when disabled
  useEffect(() => {
    if (!enabled && state.isListening) {
      stopListening();
    }
  }, [enabled, state.isListening, stopListening]);

  const getStatusIcon = (): string => {
    if (!enabled) return 'microphone-off';
    if (state.error) return 'error';
    if (!state.hasPermission) return 'microphone-off';
    if (state.isListening) return 'microphone';
    if (state.keywordDetected) return 'success';
    return 'microphone-off';
  };

  const getStatusColor = (): string => {
    if (!enabled || !state.hasPermission) return '#666666';
    if (state.error) return '#FF4444';
    if (state.isListening) return '#FFA500';
    if (state.keywordDetected) return '#4CAF50';
    return '#B0B0B0';
  };

  const getStatusText = (): string => {
    if (!enabled) return 'Wake word detection disabled';
    if (state.error) return 'Detection error';
    if (!state.hasPermission) return 'Permission required';
    if (state.isListening) return 'Listening for wake word';
    if (state.keywordDetected) return 'Wake word detected!';
    return 'Wake word detector ready';
  };

  // Don't render if disabled and not showing status
  if (!enabled && !state.error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <AccessibleIcon
          name={getStatusIcon()}
          size={24}
          color={getStatusColor()}
          accessibilityLabel={getStatusText()}
          style={styles.icon}
        />
        
        <Text
          variant="caption"
          color={state.error ? 'danger' : 'secondary'}
          style={styles.statusText}
          accessibilityLiveRegion="polite"
        >
          {getStatusText()}
        </Text>
      </View>

      {state.isListening && (
        <View style={styles.listeningIndicator}>
          <Text variant="caption" color="accent" style={styles.listeningText}>
            Say "{wakeWord}" to activate
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    marginRight: 8,
  },

  statusText: {
    flex: 1,
  },

  listeningIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#444444',
  },

  listeningText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WakeWordDetector;