import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextStyle,
  ViewStyle,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Text from './Text';

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  blurOnSubmit?: boolean;
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  inputStyle,
  onFocus,
  onBlur,
  onSubmitEditing,
  returnKeyType = 'done',
  blurOnSubmit = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    
    // Announce label for accessibility
    if (label) {
      AccessibilityInfo.announceForAccessibility(`Editing ${label}`);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const containerStyle = [
    styles.container,
    isFocused && styles.focusedContainer,
    error && styles.errorContainer,
    disabled && styles.disabledContainer,
    style,
  ];

  const textInputStyle = [
    styles.input,
    multiline && styles.multilineInput,
    isFocused && styles.focusedInput,
    error && styles.errorInput,
    disabled && styles.disabledInput,
    inputStyle,
  ];

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          variant="label"
          color={error ? 'danger' : 'secondary'}
          style={styles.label}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      
      <TextInput
        ref={inputRef}
        style={textInputStyle}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666666"
        editable={!disabled}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled,
        }}
        testID={testID}
        selectionColor="#FFA500" // Accent color for text selection
      />
      
      {error && (
        <Text
          variant="caption"
          color="danger"
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      
      {maxLength && (
        <Text
          variant="caption"
          color="secondary"
          style={styles.characterCount}
          accessibilityLabel={`${value.length} of ${maxLength} characters`}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  label: {
    marginBottom: 4,
    marginLeft: 4,
  },

  input: {
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#444444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 44, // Accessibility minimum touch target
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  focusedContainer: {
    // Container styling when focused
  },

  focusedInput: {
    borderColor: '#FFA500', // Accent color when focused
    backgroundColor: '#333333',
  },

  errorContainer: {
    // Container styling when error
  },

  errorInput: {
    borderColor: '#FF4444', // Error color
    backgroundColor: '#2A1A1A',
  },

  disabledContainer: {
    opacity: 0.6,
  },

  disabledInput: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333333',
    color: '#666666',
  },

  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },

  characterCount: {
    marginTop: 4,
    marginLeft: 4,
    alignSelf: 'flex-end',
  },
});

export default Input;