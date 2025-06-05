import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Clipboard } from 'react-native';
import AndroidSMSService, { 
  SMSMessage, 
  SMSResult, 
  SMSError, 
  SMSDeliveryStatus,
  SMSPermissionStatus 
} from '@/services/SMSService.android';
import { accessibilityManager } from '@/utils/accessibility';

export interface SMSServiceState {
  isAvailable: boolean;
  hasPermission: boolean;
  isSending: boolean;
  lastResult: SMSResult | null;
  error: SMSError | null;
  permissionStatus: SMSPermissionStatus | null;
}

export interface UseSMSServiceReturn {
  // State
  state: SMSServiceState;
  
  // Actions
  sendSMS: (to: string, body: string, priority?: 'normal' | 'high' | 'urgent') => Promise<SMSResult>;
  sendSMSWithRetry: (to: string, body: string, priority?: 'normal' | 'high' | 'urgent') => Promise<SMSResult>;
  checkPermission: () => Promise<SMSPermissionStatus>;
  requestPermission: () => Promise<boolean>;
  copyMessageToClipboard: (message: SMSMessage) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  testCapability: () => Promise<boolean>;
  getFallbackInstructions: (to: string, body: string) => string;
  isServiceReady: () => boolean;
}

export const useSMSService = (): UseSMSServiceReturn => {
  const [state, setState] = useState<SMSServiceState>({
    isAvailable: Platform.OS === 'android',
    hasPermission: false,
    isSending: false,
    lastResult: null,
    error: null,
    permissionStatus: null,
  });

  const smsServiceRef = useRef<AndroidSMSService | null>(null);
  const isMountedRef = useRef(true);

  const log = useCallback((message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[useSMSService] ${message}`, data || '');
    }
  }, []);

  const logError = useCallback((message: string, error?: any) => {
    console.error(`[useSMSService ERROR] ${message}`, error || '');
  }, []);

  const updateState = useCallback((updates: Partial<SMSServiceState>) => {
    if (!isMountedRef.current) return;
    
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      log('State updated', { updates, newState });
      return newState;
    });
  }, [log]);

  // Initialize SMS service
  useEffect(() => {
    if (Platform.OS === 'android') {
      smsServiceRef.current = new AndroidSMSService({
        enableDebugging: __DEV__,
        maxRetries: 3,
        retryDelay: 2000,
        enableAccessibilityAnnouncements: true,
        fallbackToClipboard: true,
      });

      log('SMS service initialized for Android');
    } else {
      log('SMS service not available on this platform');
      updateState({ isAvailable: false });
    }
  }, [log, updateState]);

  // Check initial permission status
  useEffect(() => {
    const checkInitialPermission = async () => {
      if (smsServiceRef.current) {
        try {
          const permissionStatus = await smsServiceRef.current.checkSMSPermission();
          updateState({
            permissionStatus,
            hasPermission: permissionStatus.hasPermission,
          });
        } catch (error) {
          logError('Failed to check initial permission', error);
        }
      }
    };

    checkInitialPermission();
  }, [updateState, logError]);

  const checkPermission = useCallback(async (): Promise<SMSPermissionStatus> => {
    try {
      log('Checking SMS permission');
      
      if (!smsServiceRef.current) {
        throw new Error('SMS service not available');
      }

      const permissionStatus = await smsServiceRef.current.checkSMSPermission();
      
      updateState({
        permissionStatus,
        hasPermission: permissionStatus.hasPermission,
        error: null,
      });

      return permissionStatus;
    } catch (error) {
      logError('Failed to check permission', error);
      
      const fallbackStatus: SMSPermissionStatus = {
        hasPermission: false,
        canRequestPermission: false,
        isAvailable: false,
        lastChecked: new Date(),
      };

      updateState({ permissionStatus: fallbackStatus });
      return fallbackStatus;
    }
  }, [updateState, log, logError]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      log('Requesting SMS permission');
      
      if (!smsServiceRef.current) {
        throw new Error('SMS service not available');
      }

      updateState({ error: null });
      const granted = await smsServiceRef.current.requestSMSPermission();
      
      // Update permission status after request
      const permissionStatus = await smsServiceRef.current.checkSMSPermission();
      updateState({
        permissionStatus,
        hasPermission: permissionStatus.hasPermission,
      });

      return granted;
    } catch (error) {
      logError('Failed to request permission', error);
      return false;
    }
  }, [updateState, log, logError]);

  const sendSMS = useCallback(async (
    to: string, 
    body: string, 
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<SMSResult> => {
    try {
      log('Sending SMS', { to, bodyLength: body.length, priority });
      
      if (!smsServiceRef.current) {
        throw new Error('SMS service not available');
      }

      updateState({ isSending: true, error: null });

      const message: SMSMessage = {
        id: `msg_${Date.now()}`,
        to,
        body,
        timestamp: new Date(),
        priority,
      };

      const result = await smsServiceRef.current.sendSMS(message);
      
      updateState({
        isSending: false,
        lastResult: result,
        error: result.error || null,
      });

      // Announce result to screen reader
      if (result.success) {
        accessibilityManager.announceForScreenReader(`Message sent successfully to ${to}`);
      } else {
        accessibilityManager.announceForScreenReader(
          `Message sending failed: ${result.error?.userMessage || 'Unknown error'}`
        );
      }

      return result;
    } catch (error) {
      logError('Failed to send SMS', error);
      
      updateState({ isSending: false });
      
      const errorResult: SMSResult = {
        success: false,
        deliveryStatus: SMSDeliveryStatus.FAILED,
        error: {
          code: 'SEND_ERROR',
          message: 'Failed to send SMS',
          userMessage: 'Unable to send message due to an unexpected error.',
          isRecoverable: true,
          suggestedAction: 'Try again or use copy message feature',
          technicalDetails: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date(),
      };

      return errorResult;
    }
  }, [updateState, log, logError]);

  const sendSMSWithRetry = useCallback(async (
    to: string, 
    body: string, 
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<SMSResult> => {
    try {
      log('Sending SMS with retry', { to, bodyLength: body.length, priority });
      
      if (!smsServiceRef.current) {
        throw new Error('SMS service not available');
      }

      updateState({ isSending: true, error: null });

      const message: SMSMessage = {
        id: `msg_${Date.now()}`,
        to,
        body,
        timestamp: new Date(),
        priority,
      };

      const result = await smsServiceRef.current.sendSMSWithRetry(message);
      
      updateState({
        isSending: false,
        lastResult: result,
        error: result.error || null,
      });

      return result;
    } catch (error) {
      logError('Failed to send SMS with retry', error);
      updateState({ isSending: false });
      
      const errorResult: SMSResult = {
        success: false,
        deliveryStatus: SMSDeliveryStatus.FAILED,
        error: {
          code: 'RETRY_FAILED',
          message: 'Failed to send SMS after retries',
          userMessage: 'Unable to send message after multiple attempts.',
          isRecoverable: true,
          suggestedAction: 'Check your network connection and try again',
        },
        timestamp: new Date(),
      };

      return errorResult;
    }
  }, [updateState, log, logError]);

  const copyMessageToClipboard = useCallback(async (message: SMSMessage): Promise<boolean> => {
    try {
      log('Copying message to clipboard', { to: message.to, bodyLength: message.body.length });
      
      const clipboardText = `To: ${message.to}\nMessage: ${message.body}`;
      await Clipboard.setString(clipboardText);
      
      accessibilityManager.announceForScreenReader(
        'Message copied to clipboard. You can now paste it in your messaging app.'
      );
      
      log('Message copied to clipboard successfully');
      return true;
    } catch (error) {
      logError('Failed to copy message to clipboard', error);
      
      accessibilityManager.announceForScreenReader(
        'Failed to copy message to clipboard.'
      );
      
      return false;
    }
  }, [log, logError]);

  const clearError = useCallback(() => {
    log('Clearing error');
    updateState({ error: null });
  }, [updateState, log]);

  const testCapability = useCallback(async (): Promise<boolean> => {
    try {
      log('Testing SMS capability');
      
      if (!smsServiceRef.current) {
        return false;
      }

      const result = await smsServiceRef.current.testSMSCapability();
      log('SMS capability test result', { result });
      
      return result;
    } catch (error) {
      logError('SMS capability test failed', error);
      return false;
    }
  }, [log, logError]);

  const getFallbackInstructions = useCallback((to: string, body: string): string => {
    if (!smsServiceRef.current) {
      return 'SMS service not available. Please use your device\'s messaging app to send messages manually.';
    }

    const message: SMSMessage = {
      id: 'temp',
      to,
      body,
      timestamp: new Date(),
    };

    return smsServiceRef.current.getFallbackInstructions(message);
  }, []);

  const isServiceReady = useCallback((): boolean => {
    return state.isAvailable && state.hasPermission && !state.isSending;
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // State
    state,
    
    // Actions
    sendSMS,
    sendSMSWithRetry,
    checkPermission,
    requestPermission,
    copyMessageToClipboard,
    
    // Utilities
    clearError,
    testCapability,
    getFallbackInstructions,
    isServiceReady,
  };
};

export default useSMSService;