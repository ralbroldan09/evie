import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { PermissionError, RecoveryOption } from '@/hooks/usePermissions';
import { colors, spacing, borderRadius, textStyles, componentStyles, accessibility } from '@/utils/theme';

export interface PermissionErrorDialogProps {
  visible: boolean;
  error: PermissionError | null;
  onDismiss: () => void;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  onUseAlternative?: () => void;
  showAlternativeWorkflow?: boolean;
}

const PermissionErrorDialog: React.FC<PermissionErrorDialogProps> = ({
  visible,
  error,
  onDismiss,
  onRetry,
  onOpenSettings,
  onUseAlternative,
  showAlternativeWorkflow = true,
}) => {
  const getPermissionIcon = (type: string): string => {
    switch (type) {
      case 'microphone':
        return '🎤';
      case 'contacts':
        return '👥';
      case 'sms':
        return '💬';
      default:
        return '⚠️';
    }
  };

  const getAlternativeWorkflowText = (type: string): string => {
    switch (type) {
      case 'microphone':
        return 'Switch to typing mode by tapping the keyboard icon. You can still send messages by typing instead of speaking.';
      case 'contacts':
        return 'Enter phone numbers manually when sending messages. Recent numbers will be saved for quick access.';
      case 'sms':
        return 'Use the "Copy Message" feature to copy your message and send it through your regular messaging app.';
      default:
        return 'Continue using the app with available features.';
    }
  };

  const handleActionPress = (option: RecoveryOption) => {
    switch (option.action) {
      case 'retry':
        onRetry?.();
        break;
      case 'settings':
        onOpenSettings?.();
        break;
      case 'alternative':
        onUseAlternative?.();
        break;
      case 'skip':
        onDismiss();
        break;
    }
  };

  React.useEffect(() => {
    if (visible && error) {
      // Announce the error to screen readers
      const announcement = `Permission error: ${error.userMessage}`;
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [visible, error]);

  if (!visible || !error) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            accessibilityLabel="Permission error dialog content"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.icon} accessibilityElementsHidden>
                {getPermissionIcon(error.type)}
              </Text>
              <Text
                style={textStyles.h3}
                accessibilityRole="header"
                accessibilityLabel={`${error.type} permission error`}
              >
                {error.type.charAt(0).toUpperCase() + error.type.slice(1)} Access
              </Text>
            </View>

            {/* Error Message */}
            <Text
              style={[textStyles.body, styles.errorMessage]}
              accessibilityLabel="Error description"
              accessibilityHint="Details about the permission issue"
            >
              {error.userMessage}
            </Text>

            {/* Platform Info */}
            <View style={styles.platformInfo}>
              <Text style={[textStyles.caption, styles.platformText]}>
                Platform: {error.platform === 'android' ? 'Android' : 'iOS'}
              </Text>
              {error.status !== 'granted' && (
                <Text style={[textStyles.caption, styles.statusText]}>
                  Status: {error.status.replace('_', ' ')}
                </Text>
              )}
            </View>

            {/* Alternative Workflow */}
            {showAlternativeWorkflow && (
              <View style={styles.alternativeSection}>
                <Text style={[textStyles.h4, styles.alternativeTitle]}>
                  How to Continue
                </Text>
                <Text
                  style={[textStyles.body, styles.alternativeText]}
                  accessibilityLabel="Alternative workflow instructions"
                >
                  {getAlternativeWorkflowText(error.type)}
                </Text>
              </View>
            )}

            {/* Recovery Options */}
            <View style={styles.actionsSection}>
              <Text style={[textStyles.h4, styles.actionsTitle]}>
                What Would You Like to Do?
              </Text>
              
              {error.recoveryOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    componentStyles.button,
                    option.isRecommended ? styles.recommendedButton : styles.regularButton,
                    styles.actionButton,
                  ]}
                  onPress={() => handleActionPress(option)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityHint={option.description}
                  accessibilityState={{ selected: option.isRecommended }}
                >
                  <Text
                    style={[
                      textStyles.buttonText,
                      option.isRecommended ? styles.recommendedButtonText : styles.regularButtonText,
                    ]}
                  >
                    {option.label}
                    {option.isRecommended && ' (Recommended)'}
                  </Text>
                  <Text
                    style={[
                      textStyles.caption,
                      option.isRecommended ? styles.recommendedDescription : styles.regularDescription,
                      styles.actionDescription,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            accessibilityHint="Dismiss this permission error dialog"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },

  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    position: 'relative',
  },

  scrollView: {
    padding: spacing.lg,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },

  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },

  platformInfo: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  platformText: {
    color: colors.textTertiary,
  },

  statusText: {
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },

  alternativeSection: {
    backgroundColor: colors.secondary + '20',
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },

  alternativeTitle: {
    color: colors.secondary,
    marginBottom: spacing.sm,
  },

  alternativeText: {
    lineHeight: 20,
  },

  actionsSection: {
    marginBottom: spacing.base,
  },

  actionsTitle: {
    marginBottom: spacing.base,
    textAlign: 'center',
  },

  actionButton: {
    marginBottom: spacing.md,
    minHeight: accessibility.minTouchTarget + 20,
    paddingVertical: spacing.base,
    alignItems: 'flex-start',
  },

  recommendedButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  regularButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
  },

  recommendedButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },

  regularButtonText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },

  actionDescription: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 16,
  },

  recommendedDescription: {
    color: colors.textOnPrimary + '80',
  },

  regularDescription: {
    color: colors.textSecondary,
  },

  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
});

export default PermissionErrorDialog;