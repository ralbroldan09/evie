import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityHelpers {
  announceForScreenReader: (message: string) => void;
  isScreenReaderEnabled: () => Promise<boolean>;
  isReduceMotionEnabled: () => Promise<boolean>;
  focusOnElement: (elementRef: any) => void;
  createAccessibilityLabel: (parts: string[]) => string;
  formatPermissionStatus: (status: string) => string;
  createVoiceInstructions: (action: string) => string;
}

class AccessibilityManager {
  private isScreenReaderActive = false;
  private isReducedMotionActive = false;

  constructor() {
    this.initializeAccessibilityState();
  }

  private async initializeAccessibilityState(): Promise<void> {
    try {
      this.isScreenReaderActive = await AccessibilityInfo.isScreenReaderEnabled();
      this.isReducedMotionActive = await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.warn('Failed to initialize accessibility state:', error);
    }
  }

  public announceForScreenReader(message: string): void {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else if (Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: false,
      });
    }
  }

  public async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('Failed to check screen reader status:', error);
      return false;
    }
  }

  public async isReduceMotionEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.warn('Failed to check reduce motion status:', error);
      return false;
    }
  }

  public focusOnElement(elementRef: any): void {
    if (elementRef?.current) {
      AccessibilityInfo.setAccessibilityFocus(elementRef.current);
    }
  }

  public createAccessibilityLabel(parts: string[]): string {
    return parts.filter(Boolean).join(', ');
  }

  public formatPermissionStatus(status: string): string {
    const statusMap: Record<string, string> = {
      granted: 'allowed',
      denied: 'not allowed',
      never_ask_again: 'permanently denied',
      undetermined: 'not yet requested',
      restricted: 'restricted by device policy',
      unavailable: 'not available on this device',
    };

    return statusMap[status] || status;
  }

  public createVoiceInstructions(action: string): string {
    const instructions: Record<string, string> = {
      listen: 'Say "sunshine" to activate voice commands',
      retry: 'Try the action again',
      settings: 'Open your device settings to change permissions',
      alternative: 'Use the alternative method described',
      skip: 'Continue without this permission',
      help: 'Get help with using this feature',
    };

    return instructions[action] || `Perform ${action}`;
  }

  public createPermissionExplanation(permissionType: string, isGranted: boolean): string {
    const explanations = {
      microphone: {
        granted: 'Microphone access is enabled. Evie can listen for voice commands when you say "sunshine".',
        denied: 'Microphone access is disabled. You can still use Evie by typing your messages instead of speaking them.',
      },
      contacts: {
        granted: 'Contact access is enabled. You can send messages to people in your contact list by saying their name.',
        denied: 'Contact access is disabled. You can send messages by entering phone numbers manually.',
      },
      sms: {
        granted: 'Message sending is enabled. Evie can send text messages automatically when you use voice commands.',
        denied: 'Message sending is disabled. Evie will prepare your messages, and you can copy them to send manually.',
      },
    };

    const typeExplanations = explanations[permissionType as keyof typeof explanations];
    return typeExplanations?.[isGranted ? 'granted' : 'denied'] || 
           `${permissionType} permission is ${isGranted ? 'enabled' : 'disabled'}.`;
  }

  public createDetailedInstructions(permissionType: string, platform: 'android' | 'ios'): string {
    const instructions = {
      microphone: {
        android: `To enable microphone access:
1. Open your device Settings
2. Find and tap "Apps" or "Application Manager"
3. Find and tap "Evie" in the app list
4. Tap "Permissions"
5. Find "Microphone" and turn it on
6. Return to Evie to start using voice commands`,
        ios: `To enable microphone access:
1. Open your device Settings
2. Scroll down and tap "Privacy & Security"
3. Tap "Microphone"
4. Find "Evie" in the list and turn it on
5. Return to Evie to start using voice commands`,
      },
      contacts: {
        android: `To enable contact access:
1. Open your device Settings
2. Find and tap "Apps" or "Application Manager"
3. Find and tap "Evie" in the app list
4. Tap "Permissions"
5. Find "Contacts" and turn it on
6. Return to Evie to access your contact list`,
        ios: `To enable contact access:
1. Open your device Settings
2. Scroll down and tap "Privacy & Security"
3. Tap "Contacts"
4. Find "Evie" in the list and turn it on
5. Return to Evie to access your contact list`,
      },
      sms: {
        android: `To enable SMS access:
1. Open your device Settings
2. Find and tap "Apps" or "Application Manager"
3. Find and tap "Evie" in the app list
4. Tap "Permissions"
5. Find "SMS" and turn it on
6. Return to Evie for automatic message sending`,
        ios: `SMS permissions are managed automatically on iOS. If you're having trouble, try:
1. Restart the Evie app
2. Check if Messages app is working properly
3. Contact support if issues persist`,
      },
    };

    const typeInstructions = instructions[permissionType as keyof typeof instructions];
    return typeInstructions?.[platform] || 
           `Check your device settings to manage ${permissionType} permissions.`;
  }

  public announcePermissionChange(permissionType: string, newStatus: string): void {
    const announcement = `${permissionType} permission is now ${this.formatPermissionStatus(newStatus)}. ${this.createPermissionExplanation(permissionType, newStatus === 'granted')}`;
    this.announceForScreenReader(announcement);
  }

  public announceFeatureAvailability(features: string[]): void {
    if (features.length === 0) {
      this.announceForScreenReader('No features are currently available due to missing permissions.');
      return;
    }

    const announcement = `Available features: ${features.join(', ')}. You can enable more features by granting additional permissions in settings.`;
    this.announceForScreenReader(announcement);
  }

  public createAccessibleErrorMessage(error: string, recovery: string): string {
    return `Error: ${error}. To fix this: ${recovery}`;
  }

  public formatForVoiceAnnouncement(text: string): string {
    return text
      .replace(/\n/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([.!?])/g, '$1 ')
      .trim();
  }
}

export const accessibilityManager = new AccessibilityManager();

export const accessibilityHelpers: AccessibilityHelpers = {
  announceForScreenReader: (message: string) => 
    accessibilityManager.announceForScreenReader(message),
  
  isScreenReaderEnabled: () => 
    accessibilityManager.isScreenReaderEnabled(),
  
  isReduceMotionEnabled: () => 
    accessibilityManager.isReduceMotionEnabled(),
  
  focusOnElement: (elementRef: any) => 
    accessibilityManager.focusOnElement(elementRef),
  
  createAccessibilityLabel: (parts: string[]) => 
    accessibilityManager.createAccessibilityLabel(parts),
  
  formatPermissionStatus: (status: string) => 
    accessibilityManager.formatPermissionStatus(status),
  
  createVoiceInstructions: (action: string) => 
    accessibilityManager.createVoiceInstructions(action),
};

export default accessibilityManager;