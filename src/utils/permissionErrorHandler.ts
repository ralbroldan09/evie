import { Alert, Platform } from 'react-native';
import { PermissionError, PermissionType, RecoveryOption } from '@/hooks/usePermissions';

export interface PermissionErrorHandlerConfig {
  enableDetailedLogging: boolean;
  showNativeAlerts: boolean;
  enableHapticFeedback: boolean;
}

export interface ErrorDialogOptions {
  title: string;
  message: string;
  primaryAction: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  tertiaryAction?: {
    label: string;
    onPress: () => void;
  };
  isDismissible: boolean;
}

class PermissionErrorHandler {
  private config: PermissionErrorHandlerConfig;

  constructor(config: PermissionErrorHandlerConfig = {
    enableDetailedLogging: __DEV__,
    showNativeAlerts: true,
    enableHapticFeedback: Platform.OS === 'ios',
  }) {
    this.config = config;
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDetailedLogging) {
      console.log(`[PermissionErrorHandler] ${message}`, data || '');
    }
  }

  private getAccessibilityFriendlyMessage(error: PermissionError): string {
    const baseMessages = {
      microphone: {
        denied: 'Voice commands are not available because microphone access was not granted. This means Evie cannot hear when you say "sunshine" or other voice commands.',
        never_ask_again: 'Microphone access is permanently disabled. To enable voice commands, you will need to go to your device settings and allow microphone access for Evie.',
        unavailable: 'Microphone is not available on this device or there was a technical issue accessing it.',
        restricted: 'Microphone access is restricted, likely due to parental controls or device management policies.',
      },
      contacts: {
        denied: 'Contact access was not granted. This means you will need to type phone numbers manually when sending messages instead of selecting from your contact list.',
        never_ask_again: 'Contact access is permanently disabled. To use your contact list, go to device settings and allow contact access for Evie.',
        unavailable: 'Contact list is not available on this device or there was a technical issue accessing it.',
        restricted: 'Contact access is restricted, likely due to privacy settings or device management policies.',
      },
      sms: {
        denied: 'Text message sending was not granted. Evie can prepare messages for you, but you will need to copy and send them through your regular messaging app.',
        never_ask_again: 'Text message permission is permanently disabled. To allow Evie to send messages automatically, go to device settings and enable SMS permission.',
        unavailable: 'Text messaging is not available on this device or there was a technical issue.',
        restricted: 'Text messaging is restricted, likely due to device policies or parental controls.',
      },
    };

    const typeMessages = baseMessages[error.type];
    return typeMessages[error.status] || error.userMessage;
  }

  private getRecoveryInstructions(error: PermissionError): string {
    const instructions = {
      microphone: {
        settings: Platform.OS === 'android' 
          ? 'Go to Settings > Apps > Evie > Permissions > Microphone and turn it on.'
          : 'Go to Settings > Privacy & Security > Microphone > Evie and turn it on.',
        alternative: 'You can still use Evie by typing your messages instead of speaking them. Look for the keyboard icon to switch to typing mode.',
      },
      contacts: {
        settings: Platform.OS === 'android'
          ? 'Go to Settings > Apps > Evie > Permissions > Contacts and turn it on.'
          : 'Go to Settings > Privacy & Security > Contacts > Evie and turn it on.',
        alternative: 'When sending a message, you can type the phone number directly instead of choosing from contacts.',
      },
      sms: {
        settings: Platform.OS === 'android'
          ? 'Go to Settings > Apps > Evie > Permissions > SMS and turn it on.'
          : 'SMS permissions are managed automatically on iOS.',
        alternative: 'When Evie prepares a message, look for the "Copy Message" button to copy the text and send it through your regular messaging app.',
      },
    };

    return instructions[error.type]?.settings || 'Check your device settings to manage app permissions.';
  }

  private createDialogOptions(
    error: PermissionError,
    onRetry?: () => void,
    onOpenSettings?: () => void,
    onUseAlternative?: () => void,
    onDismiss?: () => void
  ): ErrorDialogOptions {
    const accessibleMessage = this.getAccessibilityFriendlyMessage(error);
    const recoveryInstructions = this.getRecoveryInstructions(error);
    
    const title = this.getPermissionTitle(error.type);
    const message = `${accessibleMessage}\n\n${recoveryInstructions}`;

    // Determine primary action based on error status
    if (error.status === 'never_ask_again') {
      return {
        title,
        message,
        primaryAction: {
          label: 'Open Settings',
          onPress: onOpenSettings || (() => {}),
        },
        secondaryAction: onUseAlternative ? {
          label: 'Use Alternative',
          onPress: onUseAlternative,
        } : undefined,
        tertiaryAction: {
          label: 'Continue',
          onPress: onDismiss || (() => {}),
        },
        isDismissible: true,
      };
    } else if (error.canRetry && onRetry) {
      return {
        title,
        message,
        primaryAction: {
          label: 'Try Again',
          onPress: onRetry,
        },
        secondaryAction: {
          label: 'Open Settings',
          onPress: onOpenSettings || (() => {}),
        },
        tertiaryAction: onUseAlternative ? {
          label: 'Use Alternative',
          onPress: onUseAlternative,
        } : {
          label: 'Continue',
          onPress: onDismiss || (() => {}),
        },
        isDismissible: true,
      };
    } else {
      return {
        title,
        message,
        primaryAction: {
          label: 'Open Settings',
          onPress: onOpenSettings || (() => {}),
        },
        secondaryAction: onUseAlternative ? {
          label: 'Use Alternative',
          onPress: onUseAlternative,
        } : undefined,
        tertiaryAction: {
          label: 'Continue',
          onPress: onDismiss || (() => {}),
        },
        isDismissible: true,
      };
    }
  }

  private getPermissionTitle(type: PermissionType): string {
    const titles = {
      microphone: 'Microphone Access Needed',
      contacts: 'Contacts Access Needed',
      sms: 'Messaging Access Needed',
    };
    return titles[type];
  }

  private getAlternativeWorkflowGuidance(type: PermissionType): string {
    const guidance = {
      microphone: `
Voice Alternative Workflow:
1. Look for the keyboard icon in the message area
2. Tap it to switch from voice to text input
3. Type your message normally
4. Tap send when ready

You can still use all of Evie's features, just with typing instead of voice commands.`,
      
      contacts: `
Contacts Alternative Workflow:
1. When creating a new message, tap "Enter Phone Number"
2. Type the 10-digit phone number (like 5551234567)
3. Evie will remember recent numbers for quick access
4. You can save frequently used numbers as favorites

Tip: You can also ask friends to text you first, then reply to their messages.`,
      
      sms: `
Messaging Alternative Workflow:
1. Tell Evie what message you want to send
2. Evie will prepare the message text for you
3. Tap "Copy Message" to copy the text
4. Open your regular messaging app
5. Paste and send the message

This way you still get Evie's help composing messages, you just send them manually.`,
    };

    return guidance[type] || 'Alternative workflow guidance not available.';
  }

  public handlePermissionError(
    error: PermissionError,
    onRetry?: () => void,
    onOpenSettings?: () => void,
    onUseAlternative?: () => void,
    onDismiss?: () => void
  ): void {
    this.log('Handling permission error', { error });

    if (!this.config.showNativeAlerts) {
      this.log('Native alerts disabled, error not shown');
      return;
    }

    const dialogOptions = this.createDialogOptions(
      error,
      onRetry,
      onOpenSettings,
      onUseAlternative,
      onDismiss
    );

    const buttons = [
      {
        text: dialogOptions.primaryAction.label,
        onPress: dialogOptions.primaryAction.onPress,
        style: 'default' as const,
      },
    ];

    if (dialogOptions.secondaryAction) {
      buttons.push({
        text: dialogOptions.secondaryAction.label,
        onPress: dialogOptions.secondaryAction.onPress,
        style: 'default' as const,
      });
    }

    if (dialogOptions.tertiaryAction) {
      buttons.push({
        text: dialogOptions.tertiaryAction.label,
        onPress: dialogOptions.tertiaryAction.onPress,
        style: 'cancel' as const,
      });
    }

    Alert.alert(
      dialogOptions.title,
      dialogOptions.message,
      buttons,
      { 
        cancelable: dialogOptions.isDismissible,
        onDismiss: onDismiss,
      }
    );
  }

  public showAlternativeWorkflowGuidance(type: PermissionType): void {
    const title = `How to Use ${this.getPermissionTitle(type).replace(' Access Needed', '')} Without Permission`;
    const message = this.getAlternativeWorkflowGuidance(type);

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Got It',
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  }

  public createPermissionSummary(errors: PermissionError[]): string {
    if (errors.length === 0) {
      return 'All permissions are working correctly. Evie has full access to help you with voice commands and messaging.';
    }

    const summaryParts = ['Permission Summary:'];
    
    errors.forEach(error => {
      const status = error.status === 'granted' ? '✓' : '✗';
      const name = this.getPermissionTitle(error.type).replace(' Access Needed', '');
      const impact = this.getAccessibilityFriendlyMessage(error);
      
      summaryParts.push(`${status} ${name}: ${impact}`);
    });

    summaryParts.push('\nYou can change these permissions anytime in your device settings.');
    
    return summaryParts.join('\n');
  }

  public getFeatureAvailabilityMessage(
    canUseVoice: boolean,
    canUseContacts: boolean,
    canUseSMS: boolean
  ): string {
    const available = [];
    const unavailable = [];

    if (canUseVoice) {
      available.push('Voice commands (say "sunshine" to activate)');
    } else {
      unavailable.push('Voice commands (microphone needed)');
    }

    if (canUseContacts) {
      available.push('Send messages to contacts by name');
    } else {
      unavailable.push('Contact selection (manual phone numbers only)');
    }

    if (canUseSMS) {
      available.push('Automatic message sending');
    } else {
      unavailable.push('Automatic sending (copy & paste required)');
    }

    let message = '';
    
    if (available.length > 0) {
      message += `Available features:\n• ${available.join('\n• ')}\n\n`;
    }
    
    if (unavailable.length > 0) {
      message += `Limited features:\n• ${unavailable.join('\n• ')}\n\n`;
    }

    message += 'Evie is designed to work well even with limited permissions. You can enable more features anytime in settings.';
    
    return message;
  }
}

export const permissionErrorHandler = new PermissionErrorHandler();

export default PermissionErrorHandler;