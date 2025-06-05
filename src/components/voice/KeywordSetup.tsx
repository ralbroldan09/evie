import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/components/common/Text';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import AccessibleIcon from '@/components/common/AccessibleIcon';

export interface KeywordSetupProps {
  initialKeyword?: string;
  onSave: (keyword: string) => void;
  onCancel: () => void;
}

const KeywordSetup: React.FC<KeywordSetupProps> = ({
  initialKeyword = 'sunshine',
  onSave,
  onCancel,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [error, setError] = useState<string | null>(null);

  const validateKeyword = (value: string): string | null => {
    if (!value.trim()) {
      return 'Keyword cannot be empty';
    }
    
    if (value.trim().length < 2) {
      return 'Keyword must be at least 2 characters long';
    }
    
    if (value.trim().length > 20) {
      return 'Keyword must be 20 characters or less';
    }
    
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
      return 'Keyword can only contain letters and spaces';
    }
    
    return null;
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setError(null);
  };

  const handleSave = () => {
    const trimmedKeyword = keyword.trim().toLowerCase();
    const validationError = validateKeyword(trimmedKeyword);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onSave(trimmedKeyword);
  };

  const isValid = !error && keyword.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AccessibleIcon
          name="edit"
          size={48}
          color="#FFA500"
          accessibilityLabel="Keyword setup"
          style={styles.icon}
        />
        
        <Text variant="h3" color="primary" align="center" style={styles.title}>
          Setup Voice Keyword
        </Text>
        
        <Text variant="body" color="secondary" align="center" style={styles.description}>
          Choose a word that will trigger Evie to send your message. Pick something easy to say and remember.
        </Text>
      </View>

      <View style={styles.content}>
        <Input
          label="Voice Keyword"
          value={keyword}
          onChangeText={handleKeywordChange}
          placeholder="Enter your keyword"
          error={error}
          accessibilityHint="Enter the word you want to use to trigger message sending"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.examplesContainer}>
          <Text variant="label" color="secondary" style={styles.examplesTitle}>
            Good Keywords:
          </Text>
          <Text variant="caption" color="secondary" style={styles.examples}>
            • sunshine (default)  • hello  • send message  • help me
          </Text>
        </View>

        <View style={styles.tipsContainer}>
          <Text variant="label" color="accent" style={styles.tipsTitle}>
            Tips for Choosing Keywords:
          </Text>
          <Text variant="caption" color="secondary" style={styles.tip}>
            • Use common words you can pronounce clearly
          </Text>
          <Text variant="caption" color="secondary" style={styles.tip}>
            • Avoid words that sound like common phrases
          </Text>
          <Text variant="caption" color="secondary" style={styles.tip}>
            • Test different options to find what works best
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Save Keyword"
          onPress={handleSave}
          variant="primary"
          disabled={!isValid}
          style={styles.saveButton}
          accessibilityHint="Save the keyword and return to previous screen"
          icon={<AccessibleIcon name="save" size={20} color="#1A1A1A" accessibilityLabel="" />}
        />

        <Button
          title="Cancel"
          onPress={onCancel}
          variant="secondary"
          style={styles.cancelButton}
          accessibilityHint="Cancel keyword setup and return to previous screen"
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
    marginBottom: 32,
  },

  icon: {
    marginBottom: 16,
  },

  title: {
    marginBottom: 12,
  },

  description: {
    textAlign: 'center',
  },

  content: {
    flex: 1,
  },

  input: {
    marginBottom: 24,
  },

  examplesContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },

  examplesTitle: {
    marginBottom: 8,
  },

  examples: {
    lineHeight: 20,
  },

  tipsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },

  tipsTitle: {
    marginBottom: 12,
  },

  tip: {
    marginBottom: 4,
    paddingLeft: 8,
  },

  actions: {
    gap: 12,
  },

  saveButton: {
    marginBottom: 12,
  },

  cancelButton: {
    // No additional styles
  },
});

export default KeywordSetup;