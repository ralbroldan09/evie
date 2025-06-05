import { Platform, PermissionsAndroid } from 'react-native';
import SendSMS from 'react-native-send-sms';
import { accessibilityManager } from '@/utils/accessibility';

export interface SMSMessage {
  id: string;
  to: string;
  body: string;
  timestamp: Date;
  priority?: 'normal' | 'high' | 'urgent';
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  deliveryStatus: SMSDeliveryStatus;
  error?: SMSError;
  timestamp: Date;
}

export enum SMSDeliveryStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
}

export interface SMSError {
  code: string;
  message: string;
  userMessage: string;
  isRecoverable: boolean;
  suggestedAction: string;
  technicalDetails?: string;
}

export interface SMSServiceConfig {
  enableDebugging: boolean;
  maxRetries: number;
  retryDelay: number;
  enableAccessibilityAnnouncements: boolean;
  fallbackToClipboard: boolean;
}

export interface SMSPermissionStatus {
  hasPermission: boolean;
  canRequestPermission: boolean;
  isAvailable: boolean;
  lastChecked: Date;
}

class AndroidSMSService {
  private config: SMSServiceConfig;
  private permissionStatus: SMSPermissionStatus;
  private retryCount: number = 0;

  constructor(config: Partial<SMSServiceConfig> = {}) {
    this.config = {
      enableDebugging: __DEV__,
      maxRetries: 3,
      retryDelay: 2000,
      enableAccessibilityAnnouncements: true,
      fallbackToClipboard: true,
      ...config,
    };

    this.permissionStatus = {
      hasPermission: false,
      canRequestPermission: true,
      isAvailable: Platform.OS === 'android',
      lastChecked: new Date(),
    };

    this.log('AndroidSMSService initialized', { config: this.config });
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDebugging) {
      console.log(`[AndroidSMSService] ${message}`, data || '');
    }
  }

  private logError(message: string, error?: any): void {
    console.error(`[AndroidSMSService ERROR] ${message}`, error || '');
  }

  private announceToScreenReader(message: string): void {
    if (this.config.enableAccessibilityAnnouncements) {
      accessibilityManager.announceForScreenReader(message);
    }
  }

  private createError(
    code: string,
    message: string,
    userMessage: string,
    isRecoverable: boolean = true,
    suggestedAction: string = 'Try again',
    technicalDetails?: string
  ): SMSError {
    return {
      code,
      message,
      userMessage,
      isRecoverable,
      suggestedAction,
      technicalDetails,
    };
  }

  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? phoneNumber : `+${cleaned}`;
  }

  async checkSMSPermission(): Promise<SMSPermissionStatus> {
    try {
      this.log('Checking SMS permission');

      if (Platform.OS !== 'android') {
        this.permissionStatus = {
          hasPermission: false,
          canRequestPermission: false,
          isAvailable: false,
          lastChecked: new Date(),
        };
        this.log('SMS not available on non-Android platform');
        return this.permissionStatus;
      }

      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );

      this.permissionStatus = {
        hasPermission,
        canRequestPermission: !hasPermission,
        isAvailable: true,
        lastChecked: new Date(),
      };

      this.log('SMS permission status', this.permissionStatus);
      return this.permissionStatus;
    } catch (error) {
      this.logError('Failed to check SMS permission', error);
      
      this.permissionStatus = {
        hasPermission: false,
        canRequestPermission: false,
        isAvailable: false,
        lastChecked: new Date(),
      };

      return this.permissionStatus;
    }
  }

  async requestSMSPermission(): Promise<boolean> {
    try {
      this.log('Requesting SMS permission');

      if (Platform.OS !== 'android') {
        this.log('SMS permission not applicable on non-Android platform');
        return false;
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission',
          message: 'Evie needs SMS permission to send text messages on your behalf when you use voice commands.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );

      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      
      this.permissionStatus = {
        hasPermission: granted,
        canRequestPermission: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
        isAvailable: true,
        lastChecked: new Date(),
      };

      this.log('SMS permission request result', { result, granted });

      if (granted) {
        this.announceToScreenReader('SMS permission granted. Evie can now send messages automatically.');
      } else {
        this.announceToScreenReader('SMS permission denied. You can copy messages and send them manually.');
      }

      return granted;
    } catch (error) {
      this.logError('Failed to request SMS permission', error);
      this.announceToScreenReader('Unable to request SMS permission. You can copy messages and send them manually.');
      return false;
    }
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    const startTime = Date.now();
    this.log('Attempting to send SMS', { 
      to: message.to, 
      bodyLength: message.body.length,
      priority: message.priority 
    });

    try {
      // Validate platform
      if (Platform.OS !== 'android') {
        const error = this.createError(
          'PLATFORM_NOT_SUPPORTED',
          'SMS not supported on this platform',
          'SMS sending is only available on Android devices.',
          false,
          'Use the copy message feature instead'
        );
        
        this.announceToScreenReader('SMS not available on this device. Message text copied for manual sending.');
        
        return {
          success: false,
          deliveryStatus: SMSDeliveryStatus.FAILED,
          error,
          timestamp: new Date(),
        };
      }

      // Check permission
      const permissionStatus = await this.checkSMSPermission();
      if (!permissionStatus.hasPermission) {
        if (permissionStatus.canRequestPermission) {
          const granted = await this.requestSMSPermission();
          if (!granted) {
            const error = this.createError(
              'PERMISSION_DENIED',
              'SMS permission denied',
              'SMS permission is required to send messages automatically.',
              true,
              'Grant SMS permission in settings or use copy message feature'
            );

            return {
              success: false,
              deliveryStatus: SMSDeliveryStatus.FAILED,
              error,
              timestamp: new Date(),
            };
          }
        } else {
          const error = this.createError(
            'PERMISSION_PERMANENTLY_DENIED',
            'SMS permission permanently denied',
            'SMS permission has been permanently denied.',
            false,
            'Enable SMS permission in device settings or use copy message feature'
          );

          return {
            success: false,
            deliveryStatus: SMSDeliveryStatus.FAILED,
            error,
            timestamp: new Date(),
          };
        }
      }

      // Validate phone number
      if (!this.validatePhoneNumber(message.to)) {
        const error = this.createError(
          'INVALID_PHONE_NUMBER',
          'Invalid phone number format',
          'The phone number format is not valid. Please check the number and try again.',
          true,
          'Enter a valid phone number (10-15 digits)'
        );

        this.announceToScreenReader('Invalid phone number. Please check the number and try again.');

        return {
          success: false,
          deliveryStatus: SMSDeliveryStatus.FAILED,
          error,
          timestamp: new Date(),
        };
      }

      // Validate message body
      if (!message.body || message.body.trim().length === 0) {
        const error = this.createError(
          'EMPTY_MESSAGE',
          'Message body is empty',
          'Cannot send an empty message. Please add some text.',
          true,
          'Add text to your message'
        );

        this.announceToScreenReader('Cannot send empty message. Please add some text.');

        return {
          success: false,
          deliveryStatus: SMSDeliveryStatus.FAILED,
          error,
          timestamp: new Date(),
        };
      }

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(message.to);
      this.log('Formatted phone number', { original: message.to, formatted: formattedNumber });

      // Send SMS using react-native-send-sms
      const smsResult = await new Promise<SMSResult>((resolve) => {
        SendSMS.send(
          {
            body: message.body,
            recipients: [formattedNumber],
            successTypes: ['sent', 'queued'],
            allowAndroidSendWithoutReadPermission: true,
          },
          (completed: boolean, cancelled: boolean, error: boolean) => {
            const endTime = Date.now();
            const duration = endTime - startTime;

            this.log('SMS send result', { 
              completed, 
              cancelled, 
              error, 
              duration: `${duration}ms` 
            });

            if (completed && !error) {
              const result: SMSResult = {
                success: true,
                messageId: this.generateMessageId(),
                deliveryStatus: SMSDeliveryStatus.SENT,
                timestamp: new Date(),
              };

              this.announceToScreenReader(`Message sent successfully to ${formattedNumber}`);
              resolve(result);
            } else if (cancelled) {
              const smsError = this.createError(
                'SEND_CANCELLED',
                'SMS sending cancelled by user',
                'Message sending was cancelled.',
                true,
                'Try sending the message again'
              );

              this.announceToScreenReader('Message sending was cancelled.');

              resolve({
                success: false,
                deliveryStatus: SMSDeliveryStatus.CANCELLED,
                error: smsError,
                timestamp: new Date(),
              });
            } else {
              const smsError = this.createError(
                'SEND_FAILED',
                'SMS sending failed',
                'Unable to send the message. This could be due to network issues or SMS service problems.',
                true,
                'Check your network connection and try again'
              );

              this.announceToScreenReader('Message sending failed. Please try again.');

              resolve({
                success: false,
                deliveryStatus: SMSDeliveryStatus.FAILED,
                error: smsError,
                timestamp: new Date(),
              });
            }
          }
        );
      });

      // Reset retry count on success
      if (smsResult.success) {
        this.retryCount = 0;
      }

      return smsResult;

    } catch (error) {
      this.logError('SMS sending error', error);

      const smsError = this.createError(
        'SEND_ERROR',
        'SMS sending error',
        'An unexpected error occurred while sending the message.',
        true,
        'Try again or use the copy message feature',
        error instanceof Error ? error.message : String(error)
      );

      this.announceToScreenReader('An error occurred while sending the message. Please try again.');

      return {
        success: false,
        deliveryStatus: SMSDeliveryStatus.FAILED,
        error: smsError,
        timestamp: new Date(),
      };
    }
  }

  async sendSMSWithRetry(message: SMSMessage): Promise<SMSResult> {
    this.log('Sending SMS with retry', { 
      attempt: this.retryCount + 1, 
      maxRetries: this.config.maxRetries 
    });

    const result = await this.sendSMS(message);

    if (!result.success && result.error?.isRecoverable && this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      this.log(`SMS failed, retrying in ${this.config.retryDelay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      return this.sendSMSWithRetry(message);
    }

    // Reset retry count after final attempt
    this.retryCount = 0;
    return result;
  }

  async testSMSCapability(): Promise<boolean> {
    try {
      this.log('Testing SMS capability');

      const permissionStatus = await this.checkSMSPermission();
      
      if (!permissionStatus.isAvailable) {
        this.log('SMS not available on this platform');
        return false;
      }

      if (!permissionStatus.hasPermission) {
        this.log('SMS permission not granted');
        return false;
      }

      this.log('SMS capability test passed');
      return true;
    } catch (error) {
      this.logError('SMS capability test failed', error);
      return false;
    }
  }

  getPermissionStatus(): SMSPermissionStatus {
    return { ...this.permissionStatus };
  }

  isAvailable(): boolean {
    return this.permissionStatus.isAvailable && this.permissionStatus.hasPermission;
  }

  getFallbackInstructions(message: SMSMessage): string {
    const instructions = `
To send this message manually:

1. Copy the message text: "${message.body}"
2. Open your messaging app
3. Create a new message to: ${message.to}
4. Paste the message text
5. Send the message

This ensures your message is delivered even without automatic SMS permission.
    `.trim();

    return instructions;
  }

  announceServiceStatus(): void {
    const status = this.isAvailable() 
      ? 'SMS service is available and ready to send messages.'
      : 'SMS service is not available. You can copy messages to send manually.';
    
    this.announceToScreenReader(status);
  }

  updateConfig(newConfig: Partial<SMSServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('SMS service config updated', { newConfig });
  }
}

export default AndroidSMSService;