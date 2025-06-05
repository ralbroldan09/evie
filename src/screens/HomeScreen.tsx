import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { useVoiceDetection } from '@/hooks/useVoiceDetection';
import { useSMSService } from '@/hooks/useSMSService';
import { VoiceStatusIndicator } from '@/components/voice';
import View from '@/components/common/View';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AccessibleIcon from '@/components/common/AccessibleIcon';

export interface HomeScreenProps {
  navigation?: any; // Navigation props would go here
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [messageConfig, setMessageConfig] = useState<{
    keyword: string;
    message: string;
    contact: string;
  } | null>(null);

  const {
    state: voiceState,
    startListening,
    stopListening,
    requestPermission: requestVoicePermission,
    clearError: clearVoiceError,
  } = useVoiceDetection();

  const {
    state: smsState,
    sendMessage,
    requestPermissions: requestSMSPermissions,
    clearError: clearSMSError,
  } = useSMSService();

  // Load demo configuration for testing
  useEffect(() => {
    // Set up demo configuration for testing
    setMessageConfig({
      keyword: 'sunshine',
      message: 'Hello, this is a test message from Evie!',
      contact: '+1234567890', // Demo phone number
    });
    setIsConfigured(true);
  }, []);

  // Handle voice keyword detection - automatically send SMS
  useEffect(() => {
    if (voiceState.keywordDetected && isConfigured && messageConfig) {
      handleSendMessage();
    }
  }, [voiceState.keywordDetected, isConfigured, messageConfig]);

  const handleSendMessage = async () => {
    if (!messageConfig) {
      Alert.alert('Error', 'No message configured');
      return;
    }

    try {
      AccessibilityInfo.announceForAccessibility(`Sending message to ${messageConfig.contact}`);
      
      const result = await sendMessage(messageConfig.contact, messageConfig.message);
      
      if (result.success) {
        Alert.alert(
          'Message Sent',
          `Successfully sent "${messageConfig.message}" to ${messageConfig.contact}`,
          [
            {
              text: 'OK',
              onPress: () => {
                AccessibilityInfo.announceForAccessibility(
                  `Message sent successfully to ${messageConfig.contact}`
                );
              },
            },
          ]
        );
      } else {
        const errorMessage = result.error?.userMessage || 'Failed to send message';
        Alert.alert('Send Failed', errorMessage);
        AccessibilityInfo.announceForAccessibility(`Failed to send message: ${errorMessage}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Unexpected error sending message');
      AccessibilityInfo.announceForAccessibility('Unexpected error sending message');
    }
  };

  const handleSetupNavigation = () => {
    if (navigation?.navigate) {
      navigation.navigate('Setup');
    } else {
      Alert.alert('Setup', 'Setup navigation not available in demo mode');
    }
  };

  const requestAllPermissions = async () => {
    try {
      // Request voice permissions
      if (!voiceState.hasPermission) {
        const voiceGranted = await requestVoicePermission();
        if (!voiceGranted) {
          Alert.alert('Permissions Required', 'Microphone permission is required for voice commands');
          return false;
        }
      }

      // Request SMS permissions  
      if (!smsState.hasPermission) {
        const smsGranted = await requestSMSPermissions();
        if (!smsGranted) {
          Alert.alert('Permissions Required', 'SMS permission is required to send messages automatically');
          return false;
        }
      }

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
      return false;
    }
  };

  const handleTestMessage = async () => {
    if (!messageConfig) {
      Alert.alert('Error', 'Please configure your message first');
      return;
    }

    const hasPermissions = await requestAllPermissions();
    if (hasPermissions) {
      await handleSendMessage();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} background="primary" padding="medium">
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" color="primary" align="center" style={styles.title}>
            Evie
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
            Voice-Activated Messaging Assistant
          </Text>
        </View>

        {/* Voice Status */}
        <VoiceStatusIndicator
          isListening={voiceState.isListening}
          hasPermission={voiceState.hasPermission}
          error={voiceState.error}
          keyword={messageConfig?.keyword || 'sunshine'}
        />

        {/* Main Content */}
        <View style={styles.mainContent}>
          {!isConfigured ? (
            <View style={styles.setupPrompt}>
              <AccessibleIcon
                name="settings"
                size={64}
                color="#FFA500"
                accessibilityLabel="Setup required"
                style={styles.setupIcon}
              />
              <Text variant="h3" color="primary" align="center" style={styles.setupTitle}>
                Welcome to Evie
              </Text>
              <Text variant="body" color="secondary" align="center" style={styles.setupDescription}>
                Set up your voice-activated messaging to get started
              </Text>
              <Button
                title="Start Setup"
                onPress={handleSetupNavigation}
                variant="primary"
                style={styles.setupButton}
                accessibilityHint="Navigate to setup screen to configure your message and contact"
                icon={<AccessibleIcon name="forward" size={20} color="#1A1A1A" accessibilityLabel="" />}
              />
            </View>
          ) : (
            <View style={styles.configuredContent}>
              <Text variant="h3" color="accent" align="center" style={styles.readyTitle}>
                Ready to Help
              </Text>
              <Text variant="body" color="secondary" align="center" style={styles.readySubtitle}>
                Say "{messageConfig?.keyword}" to send your message
              </Text>
              
              <View style={styles.messagePreview} background="secondary" padding="medium">
                <Text variant="label" color="accent" style={styles.messageLabel}>
                  CONFIGURED MESSAGE
                </Text>
                <Text variant="body" color="primary" style={styles.messageText}>
                  "{messageConfig?.message}"
                </Text>
                <Text variant="label" color="accent" style={styles.contactLabel}>
                  SEND TO
                </Text>
                <Text variant="body" color="primary" style={styles.contactText}>
                  {messageConfig?.contact}
                </Text>
                <Text variant="caption" color="secondary" style={styles.platformInfo}>
                  Platform: {smsState.platform} | Status: {smsState.isAvailable ? 'Available' : 'Unavailable'}
                </Text>
              </View>

              <View style={styles.controls}>
                {!voiceState.isListening ? (
                  <Button
                    title="Start Listening"
                    onPress={() => startListening()}
                    variant="primary"
                    style={styles.controlButton}
                    disabled={!voiceState.hasPermission}
                    accessibilityHint="Start listening for voice commands"
                    icon={<AccessibleIcon name="microphone" size={20} color="#1A1A1A" accessibilityLabel="" />}
                  />
                ) : (
                  <Button
                    title="Stop Listening"
                    onPress={() => stopListening()}
                    variant="secondary"
                    style={styles.controlButton}
                    accessibilityHint="Stop listening for voice commands"
                    icon={<AccessibleIcon name="stop" size={20} color="#FFA500" accessibilityLabel="" />}
                  />
                )}

                <Button
                  title="Test Message"
                  onPress={handleTestMessage}
                  variant="secondary"
                  style={styles.controlButton}
                  accessibilityHint="Send a test message to verify SMS functionality"
                  icon={<AccessibleIcon name="message" size={20} color="#FFA500" accessibilityLabel="" />}
                />

                <Button
                  title="Setup"
                  onPress={handleSetupNavigation}
                  variant="ghost"
                  style={styles.controlButton}
                  accessibilityHint="Navigate to setup screen to change configuration"
                  icon={<AccessibleIcon name="settings" size={20} color="#FFFFFF" accessibilityLabel="" />}
                />
              </View>
            </View>
          )}
        </View>

        {/* Status Information */}
        <View style={styles.statusContainer}>
          {smsState.isLoading && (
            <LoadingSpinner message="Checking SMS service..." size="small" />
          )}
          
          {smsState.usageInfo && (
            <Text variant="caption" color="secondary" align="center">
              SMS Usage: {smsState.usageInfo.messagesThisMonth}/{smsState.usageInfo.freeLimit} this month
            </Text>
          )}
        </View>

        {/* Error Display */}
        {(voiceState.error || smsState.lastError) && (
          <View style={styles.errorContainer} background="surface" padding="medium">
            {voiceState.error && (
              <>
                <Text variant="body" color="danger" style={styles.errorText}>
                  Voice Error: {voiceState.error}
                </Text>
                <Button
                  title="Clear Voice Error"
                  onPress={clearVoiceError}
                  variant="ghost"
                  style={styles.clearErrorButton}
                />
              </>
            )}
            
            {smsState.lastError && (
              <>
                <Text variant="body" color="danger" style={styles.errorText}>
                  SMS Error: {smsState.lastError}
                </Text>
                <Button
                  title="Clear SMS Error"
                  onPress={clearSMSError}
                  variant="ghost"
                  style={styles.clearErrorButton}
                />
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },

  content: {
    flex: 1,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    marginBottom: 8,
  },

  subtitle: {
    marginBottom: 20,
  },

  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },

  setupPrompt: {
    alignItems: 'center',
    padding: 20,
  },

  setupIcon: {
    marginBottom: 20,
  },

  setupTitle: {
    marginBottom: 12,
  },

  setupDescription: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  setupButton: {
    minWidth: 200,
  },

  configuredContent: {
    alignItems: 'center',
  },

  readyTitle: {
    marginBottom: 8,
  },

  readySubtitle: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  messagePreview: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 12,
  },

  messageLabel: {
    marginBottom: 4,
  },

  messageText: {
    marginBottom: 16,
    fontStyle: 'italic',
  },

  contactLabel: {
    marginBottom: 4,
  },

  contactText: {
    marginBottom: 12,
  },

  platformInfo: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  controls: {
    width: '100%',
    gap: 12,
  },

  controlButton: {
    minHeight: 44,
  },

  statusContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  errorContainer: {
    borderRadius: 8,
    marginTop: 16,
  },

  errorText: {
    marginBottom: 8,
  },

  clearErrorButton: {
    alignSelf: 'center',
  },
});

export default HomeScreen;