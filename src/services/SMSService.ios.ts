import { Platform } from 'react-native';
import axios, { AxiosError } from 'axios';
import { SMSMessage, SMSResult, SMSDeliveryStatus, SMSError } from './SMSService.android';
import { accessibilityManager } from '@/utils/accessibility';

interface FirebaseConfig {
  projectId: string;
  region: string;
  functionName: string;
}

interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
}

interface IOSSMSConfig {
  enableDebugging: boolean;
  maxRetries: number;
  retryDelay: number;
  enableAccessibilityAnnouncements: boolean;
  firebase: FirebaseConfig;
  twilio: TwilioConfig;
  usageTracking: boolean;
}

interface UsageStats {
  messagesThisMonth: number;
  lastResetDate: Date;
  freeLimit: number;
  isApproachingLimit: boolean;
}

class IOSSMSService {
  private config: IOSSMSConfig;
  private retryCount: number = 0;
  private usageStats: UsageStats;

  constructor(config: Partial<IOSSMSConfig> = {}) {
    this.config = {
      enableDebugging: __DEV__,
      maxRetries: 3,
      retryDelay: 2000,
      enableAccessibilityAnnouncements: true,
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        region: process.env.FIREBASE_REGION || 'us-central1',
        functionName: 'sendSMS',
      },
      twilio: {
        // These will be set via Firebase environment config
      },
      usageTracking: true,
      ...config,
    };

    // Initialize usage tracking for FREE tier monitoring
    this.usageStats = {
      messagesThisMonth: 0,
      lastResetDate: new Date(),
      freeLimit: 1000, // Conservative estimate for FREE tier
      isApproachingLimit: false,
    };

    this.loadUsageStats();
    this.log('IOSSMSService initialized', { 
      config: { 
        ...this.config,
        twilio: '[REDACTED]'
      } 
    });
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDebugging) {
      console.log(`[IOSSMSService] ${message}`, data || '');
    }
  }

  private logError(message: string, error?: any): void {
    console.error(`[IOSSMSService ERROR] ${message}`, error || '');
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
    technicalDetails?: string
  ): SMSError {
    return {
      code,
      message,
      userMessage,
      isRecoverable,
      suggestedAction: isRecoverable ? 'Try again' : 'Check your internet connection',
      technicalDetails,
    };
  }

  private generateMessageId(): string {
    return `ios_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validatePhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? phoneNumber : `+${cleaned}`;
  }

  private async loadUsageStats(): Promise<void> {
    try {
      // Reset monthly stats if needed
      const now = new Date();
      const lastReset = new Date(this.usageStats.lastResetDate);
      
      if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        this.usageStats.messagesThisMonth = 0;
        this.usageStats.lastResetDate = now;
        this.usageStats.isApproachingLimit = false;
        this.log('Monthly usage stats reset');
      }

      // Check if approaching free tier limit
      this.usageStats.isApproachingLimit = 
        this.usageStats.messagesThisMonth >= (this.usageStats.freeLimit * 0.8);

    } catch (error) {
      this.logError('Failed to load usage stats', error);
    }
  }

  private async updateUsageStats(): Promise<void> {
    try {
      this.usageStats.messagesThisMonth++;
      
      // Check limits
      if (this.usageStats.messagesThisMonth >= this.usageStats.freeLimit) {
        this.announceToScreenReader('Warning: Approaching free tier limit for SMS messages this month.');
      }

      this.log('Usage stats updated', {
        messagesThisMonth: this.usageStats.messagesThisMonth,
        freeLimit: this.usageStats.freeLimit,
        remaining: this.usageStats.freeLimit - this.usageStats.messagesThisMonth,
      });

    } catch (error) {
      this.logError('Failed to update usage stats', error);
    }
  }

  private getFirebaseCloudFunctionUrl(): string {
    const { projectId, region, functionName } = this.config.firebase;
    return `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if we're on iOS
      if (Platform.OS !== 'ios') {
        this.log('iOS SMS service not available on non-iOS platform');
        return false;
      }

      // Check if we're approaching free tier limits
      if (this.usageStats.messagesThisMonth >= this.usageStats.freeLimit) {
        this.log('iOS SMS service unavailable - free tier limit reached');
        return false;
      }

      // Check if Firebase config is available
      if (!this.config.firebase.projectId) {
        this.log('iOS SMS service not configured - missing Firebase project ID');
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Failed to check iOS SMS availability', error);
      return false;
    }
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    const startTime = Date.now();
    this.log('Attempting to send SMS via iOS cloud service', {
      to: message.to,
      bodyLength: message.body.length,
      priority: message.priority,
    });

    try {
      // Platform validation
      if (Platform.OS !== 'ios') {
        const error = this.createError(
          'PLATFORM_NOT_SUPPORTED',
          'iOS SMS service not supported on this platform',
          'This SMS method is only available on iOS devices.',
          false,
          'Use Android native SMS instead'
        );

        return {
          success: false,
          deliveryStatus: SMSDeliveryStatus.FAILED,
          error,
          timestamp: new Date(),
        };
      }

      // Check availability and limits
      const available = await this.isAvailable();
      if (!available) {
        const error = this.createError(
          'SERVICE_UNAVAILABLE',
          'iOS SMS service not available',
          'SMS service is currently unavailable. You may have reached the free tier limit.',
          false,
          'Try again next month or use copy message feature'
        );

        this.announceToScreenReader('SMS service unavailable. Message text copied for manual sending.');

        return {
          success: false,
          deliveryStatus: SMSDeliveryStatus.FAILED,
          error,
          timestamp: new Date(),
        };
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

      // Prepare Firebase Cloud Function request
      const cloudFunctionUrl = this.getFirebaseCloudFunctionUrl();
      const requestData = {
        phoneNumber: formattedNumber,
        message: message.body,
        priority: message.priority || 'normal',
      };

      this.log('Calling Firebase Cloud Function', { url: cloudFunctionUrl });

      // Call Firebase Cloud Function (FREE tier)
      const response = await axios.post(cloudFunctionUrl, requestData, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.log('Firebase Cloud Function response', {
        status: response.status,
        data: response.data,
        duration: `${duration}ms`,
      });

      if (response.status === 200 && response.data.success) {
        // Update usage tracking
        await this.updateUsageStats();

        this.announceToScreenReader(`Message sent successfully to ${formattedNumber}`);

        return {
          success: true,
          messageId: response.data.messageId || this.generateMessageId(),
          deliveryStatus: SMSDeliveryStatus.SENT,
          timestamp: new Date(),
        };
      } else {
        const error = this.createError(
          'CLOUD_FUNCTION_ERROR',
          'Cloud function returned error',
          'Unable to send the message through the cloud service.',
          true,
          response.data?.error || 'Unknown cloud function error'
        );

        this.announceToScreenReader('Message sending failed. Please try again.');

        return {
          success: false,
          deliveryStatus: SMSDeliveryStatus.FAILED,
          error,
          timestamp: new Date(),
        };
      }

    } catch (error) {
      this.logError('iOS SMS sending error', error);

      let errorCode = 'SEND_ERROR';
      let userMessage = 'An unexpected error occurred while sending the message.';
      let isRecoverable = true;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.code === 'ECONNABORTED') {
          errorCode = 'TIMEOUT_ERROR';
          userMessage = 'The request timed out. Please check your internet connection.';
        } else if (axiosError.response?.status === 429) {
          errorCode = 'RATE_LIMITED';
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (axiosError.response?.status && axiosError.response.status >= 500) {
          errorCode = 'SERVER_ERROR';
          userMessage = 'The SMS service is temporarily unavailable. Please try again later.';
        } else if (!axiosError.response) {
          errorCode = 'NETWORK_ERROR';
          userMessage = 'No internet connection. Please check your network and try again.';
        }
      }

      const smsError = this.createError(
        errorCode,
        'iOS SMS sending error',
        userMessage,
        isRecoverable,
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
    this.log('Sending iOS SMS with retry', {
      attempt: this.retryCount + 1,
      maxRetries: this.config.maxRetries,
    });

    const result = await this.sendSMS(message);

    if (!result.success && result.error?.isRecoverable && this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      this.log(`iOS SMS failed, retrying in ${this.config.retryDelay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      return this.sendSMSWithRetry(message);
    }

    // Reset retry count after final attempt
    this.retryCount = 0;
    return result;
  }

  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  getFallbackInstructions(message: SMSMessage): string {
    const instructions = `
To send this message manually:

1. Copy the message text: "${message.body}"
2. Open your Messages app
3. Create a new message to: ${message.to}
4. Paste the message text
5. Send the message

iOS SMS requires cloud services due to platform restrictions.
This ensures your message is delivered when the free service is unavailable.
    `.trim();

    return instructions;
  }

  announceServiceStatus(): void {
    const available = this.usageStats.messagesThisMonth < this.usageStats.freeLimit;
    const remaining = this.usageStats.freeLimit - this.usageStats.messagesThisMonth;
    
    const status = available
      ? `iOS SMS service is available. ${remaining} free messages remaining this month.`
      : 'iOS SMS service has reached the free tier limit. You can copy messages to send manually.';
    
    this.announceToScreenReader(status);
  }

  updateConfig(newConfig: Partial<IOSSMSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('iOS SMS service config updated', { newConfig });
  }
}

export default IOSSMSService;