import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import AccessibleIcon from '@/components/common/AccessibleIcon';

export interface SensitivitySliderProps {
  value: number; // 0.0 to 1.0
  onChange: (value: number) => void;
  onTest?: () => void;
  testInProgress?: boolean;
}

const SensitivitySlider: React.FC<SensitivitySliderProps> = ({
  value,
  onChange,
  onTest,
  testInProgress = false,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sensitivity levels with descriptions
  const sensitivityLevels = [
    { value: 0.1, label: 'Very Low', description: 'Only very clear speech' },
    { value: 0.3, label: 'Low', description: 'Clear speech required' },
    { value: 0.5, label: 'Medium', description: 'Balanced (recommended)' },
    { value: 0.7, label: 'High', description: 'More responsive' },
    { value: 0.9, label: 'Very High', description: 'Maximum sensitivity' },
  ];

  const getCurrentLevel = () => {
    return sensitivityLevels.reduce((closest, level) => {
      return Math.abs(level.value - localValue) < Math.abs(closest.value - localValue)
        ? level
        : closest;
    });
  };

  const handleLevelSelect = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const currentLevel = getCurrentLevel();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h4" color="primary" style={styles.title}>
          Voice Sensitivity
        </Text>
        
        <Text variant="body" color="secondary" style={styles.description}>
          Adjust how sensitive Evie is to your voice. Higher sensitivity may catch more keywords but could trigger false positives.
        </Text>
      </View>

      <View style={styles.currentValue}>
        <Text variant="h3" color="accent" align="center">
          {currentLevel.label}
        </Text>
        <Text variant="caption" color="secondary" align="center">
          {currentLevel.description}
        </Text>
        <Text variant="caption" color="secondary" align="center" style={styles.percentage}>
          {Math.round(localValue * 100)}% sensitivity
        </Text>
      </View>

      <View style={styles.levelsContainer}>
        {sensitivityLevels.map((level) => {
          const isSelected = Math.abs(level.value - localValue) < 0.05;
          
          return (
            <View key={level.value} style={styles.levelRow}>
              <Button
                title={level.label}
                onPress={() => handleLevelSelect(level.value)}
                variant={isSelected ? 'primary' : 'ghost'}
                style={[
                  styles.levelButton,
                  isSelected && styles.selectedButton,
                ]}
                accessibilityHint={`Set sensitivity to ${level.label}: ${level.description}`}
                accessibilityState={{ selected: isSelected }}
              />
              
              <View style={styles.levelInfo}>
                <Text
                  variant="caption"
                  color={isSelected ? 'accent' : 'secondary'}
                  style={styles.levelDescription}
                >
                  {level.description}
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.levelPercentage}
                >
                  {Math.round(level.value * 100)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {onTest && (
        <View style={styles.testContainer}>
          <Text variant="body" color="secondary" align="center" style={styles.testDescription}>
            Test your current sensitivity setting by saying your keyword.
          </Text>
          
          <Button
            title={testInProgress ? 'Testing...' : 'Test Sensitivity'}
            onPress={onTest}
            variant="secondary"
            disabled={testInProgress}
            loading={testInProgress}
            style={styles.testButton}
            accessibilityHint="Test the current sensitivity setting with your voice"
            icon={
              !testInProgress && (
                <AccessibleIcon 
                  name="microphone" 
                  size={20} 
                  color="#FFA500" 
                  accessibilityLabel="" 
                />
              )
            }
          />
        </View>
      )}

      <View style={styles.recommendationContainer}>
        <AccessibleIcon
          name="info"
          size={24}
          color="#ADD8E6"
          accessibilityLabel="Recommendation"
          style={styles.recommendationIcon}
        />
        <View style={styles.recommendationText}>
          <Text variant="caption" color="secondary">
            <Text color="accent">Recommended:</Text> Start with "Medium" sensitivity. 
            If keywords are missed, increase sensitivity. If false triggers occur, decrease sensitivity.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    marginBottom: 8,
  },

  description: {
    textAlign: 'left',
  },

  currentValue: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFA500',
  },

  percentage: {
    marginTop: 4,
    fontWeight: 'bold',
  },

  levelsContainer: {
    marginBottom: 24,
  },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  levelButton: {
    width: 100,
    marginRight: 16,
  },

  selectedButton: {
    borderWidth: 2,
    borderColor: '#FFA500',
  },

  levelInfo: {
    flex: 1,
  },

  levelDescription: {
    marginBottom: 2,
  },

  levelPercentage: {
    fontSize: 12,
  },

  testContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },

  testDescription: {
    marginBottom: 16,
  },

  testButton: {
    minWidth: 160,
  },

  recommendationContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A2A3A',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ADD8E6',
  },

  recommendationIcon: {
    marginRight: 12,
    marginTop: 2,
  },

  recommendationText: {
    flex: 1,
  },
});

export default SensitivitySlider;