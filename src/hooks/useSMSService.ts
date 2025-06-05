import { useState, useEffect, useCallback } from 'react';
import { AccessibilityInfo, Clipboard } from 'react-native';
import { SMSMessage, SMSResult } from '@/services/SMSService.android';
import { smsManager } from '@/services/SMSManager';

export interface SMSServiceState {
  isAvailable: boolean;
  hasPermission: boolean;
  canRequestPermission: boolean;
  isLoading: boolean;
  lastError: string | null;
  platform: 'android' | 'ios';
  usageInfo?: {
    messagesThisMonth?: number;
    freeLimit?: number;
    remaining?: number;
  };
}

export interface UseSMSServiceReturn {
  state: SMSServiceState;
  sendMessage: (phoneNumber: string, messageBody: string) => Promise<SMSResult>;
  requestPermissions: () => Promise<boolean>;
  testCapability: () => Promise<boolean>;
  clearError: () => void;
  refreshStatus: () => Promise<void>;
  getFallbackInstructions: (message: SMSMessage) => string;
  announceStatus: () => void;
}

export const useSMSService = (): UseSMSServiceReturn => {
  const [state, setState] = useState<SMSServiceState>({
    isAvailable: false,
    hasPermission: false,
    canRequestPermission: false,
    isLoading: true,
    lastError: null,
    platform: smsManager.getCurrentPlatform(),
  });

  const updateState = useCallback((updates: Partial<SMSServiceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ lastError: null });
  }, [updateState]);

  const refreshStatus = useCallback(async () => {
    try {
      updateState({ isLoading: true, lastError: null });

      const status = await smsManager.getServiceStatus();
      
      updateState({
        isAvailable: status.isAvailable,
        hasPermission: status.hasPermission,
        canRequestPermission: status.canRequestPermission,
        platform: status.platform,
        usageInfo: status.usageInfo,
        isLoading: false,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check SMS service status';
      updateState({
        lastError: errorMessage,
        isLoading: false,
        isAvailable: false,
      });
      console.error('[useSMSService] Failed to refresh status:', error);
    }
  }, [updateState]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      updateState({ isLoading: true, lastError: null });

      const granted = await smsManager.requestPermissions();
      
      if (granted) {
        await refreshStatus();
        AccessibilityInfo.announceForAccessibility('SMS permissions granted successfully');
      } else {
        updateState({ lastError: 'SMS permissions were not granted', isLoading: false });
        AccessibilityInfo.announceForAccessibility('SMS permissions were denied');
      }

      return granted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request SMS permissions';
      updateState({
        lastError: errorMessage,
        isLoading: false,
      });
      AccessibilityInfo.announceForAccessibility('Error requesting SMS permissions');
      console.error('[useSMSService] Permission request failed:', error);
      return false;
    }
  }, [updateState, refreshStatus]);

  const sendMessage = useCallback(async (phoneNumber: string, messageBody: string): Promise<SMSResult> => {
    try {
      updateState({ lastError: null });

      const message: SMSMessage = {
        id: `msg_${Date.now()}`,
        to: phoneNumber,
        body: messageBody,
        timestamp: new Date(),
        priority: 'normal',
      };

      const result = await smsManager.sendMessage(message);

      if (result.success) {
        AccessibilityInfo.announceForAccessibility('Message sent successfully');
        
        if (state.platform === 'ios') {
          await refreshStatus();
        }
      } else {
        const errorMessage = result.error?.userMessage || 'Failed to send message';
        updateState({ lastError: errorMessage });
        AccessibilityInfo.announceForAccessibility(`Message failed: ${errorMessage}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error sending message';
      updateState({ lastError: errorMessage });
      AccessibilityInfo.announceForAccessibility('Unexpected error sending message');
      console.error('[useSMSService] Send message failed:', error);
      
      return {
        success: false,
        deliveryStatus: 'failed' as any,
        error: {
          code: 'HOOK_ERROR',
          message: errorMessage,
          userMessage: errorMessage,
          isRecoverable: true,
          suggestedAction: 'Try again',
        },
        timestamp: new Date(),
      };
    }
  }, [updateState, refreshStatus, state.platform]);

  const testCapability = useCallback(async (): Promise<boolean> => {
    try {
      updateState({ isLoading: true, lastError: null });

      const capable = await smsManager.testCapability();
      
      updateState({ isLoading: false });
      
      const message = capable 
        ? 'SMS capability test passed' 
        : 'SMS capability test failed';
        
      AccessibilityInfo.announceForAccessibility(message);
      
      return capable;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SMS capability test failed';
      updateState({
        lastError: errorMessage,
        isLoading: false,
      });
      AccessibilityInfo.announceForAccessibility('SMS capability test failed');
      console.error('[useSMSService] Capability test failed:', error);
      return false;
    }
  }, [updateState]);

  const getFallbackInstructions = useCallback((message: SMSMessage): string => {
    return smsManager.getFallbackInstructions(message);
  }, []);

  const announceStatus = useCallback(() => {
    smsManager.announceServiceStatus();
  }, []);

  // Initialize SMS service status on mount
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Listen for app state changes to refresh status
  useEffect(() => {
    const interval = setInterval(refreshStatus, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [refreshStatus]);

  return {
    state,
    sendMessage,
    requestPermissions,
    testCapability,
    clearError,
    refreshStatus,
    getFallbackInstructions,
    announceStatus,
  };
};

export default useSMSService;