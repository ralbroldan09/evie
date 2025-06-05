import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVoiceDetection } from '@/hooks/useVoiceDetection';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AccessibleIcon from '@/components/common/AccessibleIcon';

export interface VoiceRecognitionProps {
  onKeywordDetected?: (keyword: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  keyword?: string;
  sensitivity?: number;
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  onKeywordDetected,
  onError,
  enabled = true,
  keyword = 'sunshine',
  sensitivity = 0.5,
}) => {
  const {
    state,
    startListening,
    stopListening,
    requestPermission,
    clearError,
  } = useVoiceDetection();

  const [autoRestart, setAutoRestart] = useState(true);

  // Handle keyword detection
  useEffect(() => {
    if (state.keywordDetected && onKeywordDetected) {
      onKeywordDetected(keyword);
    }
  }, [state.keywordDetected, onKeywordDetected, keyword]);

  // Handle errors
  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  // Auto-restart listening if enabled
  useEffect(() => {
    if (autoRestart && enabled && !state.isListening && !state.error && state.hasPermission) {
      const timeout = setTimeout(() => {
        startListening();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [autoRestart, enabled, state.isListening, state.error, state.hasPermission, startListening]);

  const handleStartListening = async () => {
    if (!state.hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }
    
    await startListening();
  };

  const handleStopListening = async () => {
    setAutoRestart(false);
    await stopListening();
  };

  const handleToggleListening = async () => {
    if (state.isListening) {
      await handleStopListening();
    } else {
      setAutoRestart(true);
      await handleStartListening();
    }
  };

  const getStatusText = (): string => {
    if (!state.hasPermission) {
      return 'Microphone permission required';
    }
    if (state.error) {
      return `Error: ${state.error}`;
    }
    if (state.isListening) {
      return `Listening for "${keyword}"...`;
    }
    if (state.keywordDetected) {
      return `"${keyword}" detected!`;
    }
    return 'Voice recognition ready';
  };

  const getStatusColor = (): 'primary' | 'secondary' | 'accent' | 'danger' => {
    if (state.error) return 'danger';
    if (state.isListening) return 'accent';
    if (state.keywordDetected) return 'accent';
    return 'secondary';
  };

  const getIconName = (): string => {
    if (!state.hasPermission) return 'microphone-off';
    if (state.error) return 'error';
    if (state.isListening) return 'microphone';
    if (state.keywordDetected) return 'success';
    return 'microphone-off';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <AccessibleIcon
          name={getIconName()}
          size={48}
          color={getStatusColor() === 'accent' ? '#FFA500' : '#FFFFFF'}
          accessibilityLabel={getStatusText()}
          style={styles.icon}
        />
        
        <Text
          variant="h4"
          color={getStatusColor()}
          align="center"
          style={styles.statusText}
          accessibilityLiveRegion="polite"
        >
          {getStatusText()}
        </Text>

        {state.keywordDetected && (
          <Text
            variant="body"
            color="accent"
            align="center"
            style={styles.detectionText}
          >
            Keyword "{keyword}" was detected
          </Text>
        )}
      </View>

      {state.isInitializing && (
        <LoadingSpinner
          message="Initializing voice recognition..."
          size="large"
          style={styles.loading}
        />
      )}

      <View style={styles.controlsContainer}>
        {!state.hasPermission ? (
          <Button
            title="Enable Microphone"
            onPress={requestPermission}
            variant="primary"
            accessibilityHint="Tap to request microphone permission for voice detection"
            icon={<AccessibleIcon name="microphone" size={20} color="#1A1A1A" accessibilityLabel="" />}
            style={styles.button}
          />
        ) : (
          <Button
            title={state.isListening ? 'Stop Listening' : 'Start Listening'}
            onPress={handleToggleListening}
            variant={state.isListening ? 'secondary' : 'primary'}
            disabled={state.isInitializing}
            accessibilityHint={
              state.isListening 
                ? 'Tap to stop voice detection'
                : 'Tap to start listening for voice commands'
            }
            icon={
              <AccessibleIcon 
                name={state.isListening ? 'stop' : 'play'} 
                size={20} 
                color={state.isListening ? '#FFA500' : '#1A1A1A'} 
                accessibilityLabel="" 
              />
            }
            style={styles.button}
          />
        )}

        {state.error && (
          <Button
            title="Clear Error"
            onPress={clearError}
            variant="ghost"
            accessibilityHint="Tap to clear the current error"
            style={styles.clearButton}
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text variant="caption" color="secondary" align="center">
          Keyword: "{keyword}" | Sensitivity: {Math.round(sensitivity * 100)}%
        </Text>
        
        <Text variant="caption" color="secondary" align="center" style={styles.helpText}>
          Say "{keyword}" clearly to trigger voice command
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },

  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  icon: {
    marginBottom: 12,
  },

  statusText: {
    marginBottom: 8,
  },

  detectionText: {
    marginTop: 8,
  },

  loading: {
    marginVertical: 20,
  },

  controlsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  button: {
    minWidth: 200,
    marginBottom: 12,
  },

  clearButton: {
    minWidth: 120,
  },

  infoContainer: {
    alignItems: 'center',
  },

  helpText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default VoiceRecognition;