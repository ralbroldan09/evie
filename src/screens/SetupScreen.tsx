import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationProps } from '@/types/navigation';
import { colors, componentStyles, textStyles, spacing, accessibility } from '@/utils/theme';

type SetupScreenProps = NavigationProps<'Setup'>;

const SetupScreen: React.FC<SetupScreenProps> = ({ navigation, route }) => {
  const step = route.params?.step || 'welcome';

  const handleNextStep = () => {
    switch (step) {
      case 'welcome':
        navigation.setParams({ step: 'permissions' });
        break;
      case 'permissions':
        navigation.setParams({ step: 'wake-word' });
        break;
      case 'wake-word':
        navigation.setParams({ step: 'voice-training' });
        break;
      case 'voice-training':
        navigation.setParams({ step: 'complete' });
        break;
      case 'complete':
        navigation.navigate('Home');
        break;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <Text
              style={textStyles.h2}
              accessibilityRole="header"
              accessibilityLabel="Welcome to Evie Setup"
            >
              Welcome to Evie
            </Text>
            <Text
              style={[textStyles.body, styles.description]}
              accessibilityLabel="Let's configure your voice assistant for the best accessibility experience"
            >
              Let's set up your voice assistant for the best accessibility experience.
            </Text>
          </View>
        );
      
      case 'permissions':
        return (
          <View style={styles.stepContent}>
            <Text
              style={textStyles.h2}
              accessibilityRole="header"
              accessibilityLabel="Microphone Permissions"
            >
              Microphone Access
            </Text>
            <Text
              style={[textStyles.body, styles.description]}
              accessibilityLabel="Evie needs microphone access to listen for voice commands and wake words"
            >
              Evie needs access to your microphone to listen for voice commands.
            </Text>
          </View>
        );
      
      case 'wake-word':
        return (
          <View style={styles.stepContent}>
            <Text
              style={textStyles.h2}
              accessibilityRole="header"
              accessibilityLabel="Wake Word Configuration"
            >
              Wake Word Setup
            </Text>
            <Text
              style={[textStyles.body, styles.description]}
              accessibilityLabel="Configure your wake word sensitivity and keyword preferences"
            >
              Configure how Evie responds to your wake word.
            </Text>
          </View>
        );
      
      case 'voice-training':
        return (
          <View style={styles.stepContent}>
            <Text
              style={textStyles.h2}
              accessibilityRole="header"
              accessibilityLabel="Voice Training"
            >
              Voice Training
            </Text>
            <Text
              style={[textStyles.body, styles.description]}
              accessibilityLabel="Train Evie to better understand your voice and speech patterns"
            >
              Help Evie learn your voice for better recognition.
            </Text>
          </View>
        );
      
      case 'complete':
        return (
          <View style={styles.stepContent}>
            <Text
              style={textStyles.h2}
              accessibilityRole="header"
              accessibilityLabel="Setup Complete"
            >
              You're All Set!
            </Text>
            <Text
              style={[textStyles.body, styles.description]}
              accessibilityLabel="Evie is ready to assist you with voice-activated messaging"
            >
              Evie is ready to help you with voice-activated messaging.
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={[componentStyles.container, styles.container]}>
      <View style={styles.content}>
        {renderStepContent()}
        
        <TouchableOpacity
          style={componentStyles.button}
          onPress={handleNextStep}
          accessibilityRole="button"
          accessibilityLabel={step === 'complete' ? 'Get Started' : 'Continue'}
          accessibilityHint={step === 'complete' ? 'Navigate to home screen' : 'Continue to next setup step'}
        >
          <Text style={textStyles.buttonText}>
            {step === 'complete' ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  stepContent: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  
  description: {
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.base,
    lineHeight: 24,
  },
});

export default SetupScreen;