import { Platform } from 'react-native';
import AndroidSMSService, { SMSMessage, SMSResult, SMSPermissionStatus } from './SMSService.android';
import IOSSMSService from './SMSService.ios';

export interface SMSManagerConfig {
  enableDebugging: boolean;
  enableAccessibilityAnnouncements: boolean;
  preferredPlatform?: 'android' | 'ios' | 'auto';
}

export interface SMSServiceStatus {
  platform: 'android' | 'ios';
  isAvailable: boolean;
  hasPermission: boolean;
  canRequestPermission: boolean;
  usageInfo?: {
    messagesThisMonth?: number;
    freeLimit?: number;
    remaining?: number;
  };
  lastChecked: Date;
}

class SMSManager {
  private static instance: SMSManager;
  private androidService: AndroidSMSService;
  private iosService: IOSSMSService;
  private config: SMSManagerConfig;
  private currentPlatform: 'android' | 'ios';

  private constructor(config: Partial<SMSManagerConfig> = {}) {
    this.config = {
      enableDebugging: __DEV__,
      enableAccessibilityAnnouncements: true,
      preferredPlatform: 'auto',
      ...config,
    };

    // Determine current platform
    this.currentPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

    // Initialize platform-specific services
    this.androidService = new AndroidSMSService({
      enableDebugging: this.config.enableDebugging,
      enableAccessibilityAnnouncements: this.config.enableAccessibilityAnnouncements,
    });

    this.iosService = new IOSSMSService({
      enableDebugging: this.config.enableDebugging,
      enableAccessibilityAnnouncements: this.config.enableAccessibilityAnnouncements,
    });

    this.log('SMSManager initialized', {
      platform: this.currentPlatform,
      config: this.config,
    });
  }

  static getInstance(config?: Partial<SMSManagerConfig>): SMSManager {
    if (!SMSManager.instance) {
      SMSManager.instance = new SMSManager(config);
    }
    return SMSManager.instance;
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDebugging) {
      console.log(`[SMSManager] ${message}`, data || '');
    }
  }

  private logError(message: string, error?: any): void {
    console.error(`[SMSManager ERROR] ${message}`, error || '');
  }

  private getActiveService(): AndroidSMSService | IOSSMSService {
    switch (this.config.preferredPlatform) {
      case 'android':
        return this.androidService;
      case 'ios':
        return this.iosService;
      case 'auto':
      default:
        return this.currentPlatform === 'ios' ? this.iosService : this.androidService;
    }
  }

  async getServiceStatus(): Promise<SMSServiceStatus> {
    try {
      this.log('Getting SMS service status');

      if (this.currentPlatform === 'android') {
        const permissionStatus = await this.androidService.checkSMSPermission();
        
        return {
          platform: 'android',
          isAvailable: permissionStatus.isAvailable,
          hasPermission: permissionStatus.hasPermission,
          canRequestPermission: permissionStatus.canRequestPermission,
          lastChecked: new Date(),
        };
      } else {
        const isAvailable = await this.iosService.isAvailable();
        const usageStats = this.iosService.getUsageStats();
        
        return {
          platform: 'ios',
          isAvailable,
          hasPermission: true, // iOS uses cloud service, no direct permissions
          canRequestPermission: false,
          usageInfo: {
            messagesThisMonth: usageStats.messagesThisMonth,
            freeLimit: usageStats.freeLimit,
            remaining: usageStats.freeLimit - usageStats.messagesThisMonth,
          },
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      this.logError('Failed to get service status', error);
      
      return {
        platform: this.currentPlatform,
        isAvailable: false,
        hasPermission: false,
        canRequestPermission: false,
        lastChecked: new Date(),
      };
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      this.log('Requesting SMS permissions');

      if (this.currentPlatform === 'android') {
        return await this.androidService.requestSMSPermission();
      } else {
        // iOS uses cloud service, no direct permissions needed
        this.log('iOS SMS uses cloud service - no permissions to request');
        return true;
      }
    } catch (error) {
      this.logError('Failed to request permissions', error);
      return false;
    }
  }

  async sendMessage(message: SMSMessage): Promise<SMSResult> {
    try {
      this.log('Sending message via SMSManager', {
        platform: this.currentPlatform,
        to: message.to,
        bodyLength: message.body.length,
      });

      const service = this.getActiveService();
      
      if (this.currentPlatform === 'android') {
        return await (service as AndroidSMSService).sendSMSWithRetry(message);
      } else {
        return await (service as IOSSMSService).sendSMSWithRetry(message);
      }
    } catch (error) {
      this.logError('Failed to send message', error);
      
      return {
        success: false,
        deliveryStatus: 'failed' as any,
        error: {
          code: 'MANAGER_ERROR',
          message: 'SMS Manager error',
          userMessage: 'An error occurred in the SMS system. Please try again.',
          isRecoverable: true,
          suggestedAction: 'Try again or restart the app',
          technicalDetails: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date(),
      };
    }
  }

  async testCapability(): Promise<boolean> {
    try {
      this.log('Testing SMS capability');

      if (this.currentPlatform === 'android') {
        return await this.androidService.testSMSCapability();
      } else {
        return await this.iosService.isAvailable();
      }
    } catch (error) {
      this.logError('SMS capability test failed', error);
      return false;
    }
  }

  getFallbackInstructions(message: SMSMessage): string {
    const service = this.getActiveService();
    
    if (this.currentPlatform === 'android') {
      return (service as AndroidSMSService).getFallbackInstructions(message);
    } else {
      return (service as IOSSMSService).getFallbackInstructions(message);
    }
  }

  announceServiceStatus(): void {
    const service = this.getActiveService();
    
    if (this.currentPlatform === 'android') {
      (service as AndroidSMSService).announceServiceStatus();
    } else {
      (service as IOSSMSService).announceServiceStatus();
    }
  }

  getCurrentPlatform(): 'android' | 'ios' {
    return this.currentPlatform;
  }

  updateConfig(newConfig: Partial<SMSManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('SMSManager config updated', { newConfig });

    // Update underlying services
    this.androidService.updateConfig({
      enableDebugging: this.config.enableDebugging,
      enableAccessibilityAnnouncements: this.config.enableAccessibilityAnnouncements,
    });

    this.iosService.updateConfig({
      enableDebugging: this.config.enableDebugging,
      enableAccessibilityAnnouncements: this.config.enableAccessibilityAnnouncements,
    });
  }

  // Static convenience methods
  static async quickSend(phoneNumber: string, messageBody: string): Promise<SMSResult> {
    const manager = SMSManager.getInstance();
    
    const message: SMSMessage = {
      id: `quick_${Date.now()}`,
      to: phoneNumber,
      body: messageBody,
      timestamp: new Date(),
      priority: 'normal',
    };

    return await manager.sendMessage(message);
  }

  static async checkAvailability(): Promise<boolean> {
    const manager = SMSManager.getInstance();
    return await manager.testCapability();
  }

  // Development and debugging helpers
  async getDebugInfo(): Promise<Record<string, any>> {
    const status = await this.getServiceStatus();
    
    return {
      platform: this.currentPlatform,
      config: this.config,
      serviceStatus: status,
      androidPermissions: this.currentPlatform === 'android' 
        ? this.androidService.getPermissionStatus() 
        : null,
      iosUsage: this.currentPlatform === 'ios' 
        ? this.iosService.getUsageStats() 
        : null,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance for convenience
export const smsManager = SMSManager.getInstance();

export default SMSManager;