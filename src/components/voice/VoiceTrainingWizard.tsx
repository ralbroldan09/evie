import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import AccessibleIcon from '@/components/common/AccessibleIcon';

export interface VoiceTrainingWizardProps {
  onComplete: (trainingData: any) => void;
  onCancel: () => void;
}

const VoiceTrainingWizard: React.FC<VoiceTrainingWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [recordings, setRecordings] = useState<string[]>([]);

  const steps = [
    {
      title: 'Welcome to Voice Training',
      description: 'Train Evie to recognize your voice for better accuracy.',
      action: 'Get Started',
    },
    {
      title: 'Say "Sunshine" - Attempt 1',
      description: 'Speak clearly and naturally.',
      action: 'Record',
    },
    {
      title: 'Say "Sunshine" - Attempt 2',
      description: 'Try with a slightly different tone.',
      action: 'Record',
    },
    {
      title: 'Say "Sunshine" - Attempt 3',
      description: 'One more time for best results.',
      action: 'Record',
    },
    {
      title: 'Training Complete',
      description: 'Your voice profile has been created successfully.',
      action: 'Finish',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({ recordings, timestamp: new Date() });
    }
  };

  const handleRecord = () => {
    // Simulate recording
    const newRecording = `recording_${currentStep}_${Date.now()}`;
    setRecordings([...recordings, newRecording]);
    handleNext();
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3" color="primary" align="center" style={styles.title}>
          {currentStepData.title}
        </Text>
        
        <Text variant="body" color="secondary" align="center" style={styles.description}>
          {currentStepData.description}
        </Text>

        <View style={styles.progressContainer}>
          <Text variant="caption" color="secondary" align="center">
            Step {currentStep + 1} of {steps.length}
          </Text>
          <View style={styles.progressBar}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep ? styles.progressDotActive : styles.progressDotInactive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {currentStep === 0 && (
          <View style={styles.welcomeContent}>
            <AccessibleIcon
              name="microphone"
              size={80}
              color="#FFA500"
              accessibilityLabel="Microphone for voice training"
              style={styles.welcomeIcon}
            />
            <Text variant="body" color="secondary" align="center">
              Voice training helps Evie recognize your specific voice patterns for more accurate keyword detection.
            </Text>
          </View>
        )}

        {currentStep > 0 && currentStep < steps.length - 1 && (
          <View style={styles.recordingContent}>
            <AccessibleIcon
              name="record"
              size={64}
              color="#FF4444"
              accessibilityLabel="Recording indicator"
              style={styles.recordIcon}
            />
            <Text variant="h4" color="accent" align="center" style={styles.keyword}>
              "Sunshine"
            </Text>
            <Text variant="body" color="secondary" align="center">
              Press the record button and say the keyword clearly.
            </Text>
          </View>
        )}

        {currentStep === steps.length - 1 && (
          <View style={styles.completeContent}>
            <AccessibleIcon
              name="success"
              size={80}
              color="#4CAF50"
              accessibilityLabel="Training complete"
              style={styles.completeIcon}
            />
            <Text variant="body" color="secondary" align="center">
              Great! Your voice profile has been created. Evie should now better recognize when you say "sunshine".
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {currentStep === 0 || currentStep === steps.length - 1 ? (
          <Button
            title={currentStepData.action}
            onPress={handleNext}
            variant="primary"
            style={styles.actionButton}
            accessibilityHint={
              currentStep === 0 
                ? 'Start voice training process'
                : 'Complete training and save voice profile'
            }
          />
        ) : (
          <Button
            title={currentStepData.action}
            onPress={handleRecord}
            variant="primary"
            style={styles.actionButton}
            accessibilityHint="Record your voice saying the keyword"
            icon={<AccessibleIcon name="record" size={20} color="#1A1A1A" accessibilityLabel="" />}
          />
        )}

        <Button
          title="Cancel"
          onPress={onCancel}
          variant="ghost"
          style={styles.cancelButton}
          accessibilityHint="Cancel voice training and return to previous screen"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  title: {
    marginBottom: 12,
  },

  description: {
    marginBottom: 24,
  },

  progressContainer: {
    alignItems: 'center',
  },

  progressBar: {
    flexDirection: 'row',
    marginTop: 8,
  },

  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },

  progressDotActive: {
    backgroundColor: '#FFA500',
  },

  progressDotInactive: {
    backgroundColor: '#444444',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  welcomeContent: {
    alignItems: 'center',
  },

  welcomeIcon: {
    marginBottom: 24,
  },

  recordingContent: {
    alignItems: 'center',
  },

  recordIcon: {
    marginBottom: 24,
  },

  keyword: {
    marginBottom: 16,
  },

  completeContent: {
    alignItems: 'center',
  },

  completeIcon: {
    marginBottom: 24,
  },

  actions: {
    alignItems: 'center',
  },

  actionButton: {
    minWidth: 200,
    marginBottom: 12,
  },

  cancelButton: {
    minWidth: 120,
  },
});

export default VoiceTrainingWizard;