import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';

export type PermissionType = 'microphone' | 'contacts' | 'sms';

export type PermissionStatus = 
  | 'granted' 
  | 'denied' 
  | 'never_ask_again' 
  | 'undetermined' 
  | 'restricted' 
  | 'unavailable';

export interface Permission {
  type: PermissionType;
  status: PermissionStatus;
  isRequired: boolean;
  lastChecked: Date;
  requestCount: number;
}

export interface PermissionError {
  type: PermissionType;
  status: PermissionStatus;
  code: string;
  message: string;
  userMessage: string;
  canRetry: boolean;
  recoveryOptions: RecoveryOption[];
  platform: 'android' | 'ios';
}

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: 'retry' | 'settings' | 'alternative' | 'skip';
  isRecommended: boolean;
}

export interface PermissionsState {
  microphone: Permission;
  contacts: Permission;
  sms: Permission;
  isLoading: boolean;
  hasCheckedAll: boolean;
  criticalPermissionsDenied: boolean;
}

export interface UsePermissionsReturn {
  // State
  permissions: PermissionsState;
  errors: PermissionError[];
  isCheckingPermissions: boolean;
  
  // Actions
  checkPermission: (type: PermissionType) => Promise<PermissionStatus>;
  requestPermission: (type: PermissionType) => Promise<PermissionStatus>;
  checkAllPermissions: () => Promise<void>;
  requestAllPermissions: () => Promise<boolean>;
  
  // Error handling
  clearError: (type: PermissionType) => void;
  clearAllErrors: () => void;
  getError: (type: PermissionType) => PermissionError | undefined;
  
  // Utilities
  canUseFeature: (feature: 'voice' | 'messaging' | 'contacts') => boolean;
  openSettings: () => void;
  getAlternativeWorkflow: (type: PermissionType) => string;
}

const PERMISSION_ANDROID_MAP: Record<PermissionType, string> = {
  microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  contacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  sms: PermissionsAndroid.PERMISSIONS.SEND_SMS,
};

const PERMISSION_MESSAGES = {
  microphone: {
    title: 'Microphone Access',
    message: 'Evie needs microphone access to listen for voice commands and help you send messages hands-free.',
    deniedMessage: 'Without microphone access, Evie cannot listen for voice commands. You can still use the app by typing messages manually.',
  },
  contacts: {
    title: 'Contacts Access',
    message: 'Evie needs access to your contacts to help you send messages to friends and family by name.',
    deniedMessage: 'Without contacts access, you can still send messages by entering phone numbers manually.',
  },
  sms: {
    title: 'SMS Access',
    message: 'Evie needs SMS permission to send text messages on your behalf when you use voice commands.',
    deniedMessage: 'Without SMS permission, Evie cannot send messages automatically. You can copy message text and send it manually.',
  },
};

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    microphone: {
      type: 'microphone',
      status: 'undetermined',
      isRequired: true,
      lastChecked: new Date(),
      requestCount: 0,
    },
    contacts: {
      type: 'contacts',
      status: 'undetermined',
      isRequired: false,
      lastChecked: new Date(),
      requestCount: 0,
    },
    sms: {
      type: 'sms',
      status: 'undetermined',
      isRequired: false,
      lastChecked: new Date(),
      requestCount: 0,
    },
    isLoading: false,
    hasCheckedAll: false,
    criticalPermissionsDenied: false,
  });

  const [errors, setErrors] = useState<PermissionError[]>([]);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  const isMountedRef = useRef(true);

  const log = useCallback((message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[usePermissions] ${message}`, data || '');
    }
  }, []);

  const logError = useCallback((message: string, error?: any) => {
    console.error(`[usePermissions ERROR] ${message}`, error || '');
  }, []);

  const updatePermission = useCallback((
    type: PermissionType, 
    updates: Partial<Permission>
  ) => {
    if (!isMountedRef.current) return;
    
    setPermissions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...updates,
        lastChecked: new Date(),
      },
      criticalPermissionsDenied: prev.microphone.status === 'denied' || 
                                 prev.microphone.status === 'never_ask_again',
    }));
  }, []);

  const createError = useCallback((
    type: PermissionType,
    status: PermissionStatus,
    code: string,
    message: string,
    userMessage: string,
    canRetry: boolean = true
  ): PermissionError => {
    const recoveryOptions: RecoveryOption[] = [];

    if (canRetry && status !== 'never_ask_again') {
      recoveryOptions.push({
        id: 'retry',
        label: 'Try Again',
        description: 'Request permission again',
        action: 'retry',
        isRecommended: true,
      });
    }

    if (status === 'never_ask_again' || status === 'denied') {
      recoveryOptions.push({
        id: 'settings',
        label: 'Open Settings',
        description: 'Go to device settings to enable permission',
        action: 'settings',
        isRecommended: status === 'never_ask_again',
      });
    }

    // Add alternative workflows
    if (type === 'microphone') {
      recoveryOptions.push({
        id: 'alternative',
        label: 'Use Manual Input',
        description: 'Type messages instead of using voice commands',
        action: 'alternative',
        isRecommended: false,
      });
    } else if (type === 'contacts') {
      recoveryOptions.push({
        id: 'alternative',
        label: 'Enter Phone Numbers',
        description: 'Send messages by typing phone numbers manually',
        action: 'alternative',
        isRecommended: false,
      });
    } else if (type === 'sms') {
      recoveryOptions.push({
        id: 'alternative',
        label: 'Copy & Send',
        description: 'Copy message text and send through your messaging app',
        action: 'alternative',
        isRecommended: false,
      });
    }

    if (!permissions[type].isRequired) {
      recoveryOptions.push({
        id: 'skip',
        label: 'Continue Without',
        description: 'Skip this permission and continue using the app',
        action: 'skip',
        isRecommended: false,
      });
    }

    return {
      type,
      status,
      code,
      message,
      userMessage,
      canRetry,
      recoveryOptions,
      platform: Platform.OS as 'android' | 'ios',
    };
  }, [permissions]);

  const addError = useCallback((error: PermissionError) => {
    if (!isMountedRef.current) return;
    
    setErrors(prev => {
      const filtered = prev.filter(e => e.type !== error.type);
      return [...filtered, error];
    });
  }, []);

  const clearError = useCallback((type: PermissionType) => {
    setErrors(prev => prev.filter(e => e.type !== type));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getError = useCallback((type: PermissionType): PermissionError | undefined => {
    return errors.find(e => e.type === type);
  }, [errors]);

  const checkPermission = useCallback(async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      log(`Checking ${type} permission`);
      
      if (Platform.OS === 'android') {
        const androidPermission = PERMISSION_ANDROID_MAP[type];
        const hasPermission = await PermissionsAndroid.check(androidPermission);
        const status: PermissionStatus = hasPermission ? 'granted' : 'denied';
        
        updatePermission(type, { status });
        log(`Android ${type} permission status: ${status}`);
        return status;
      } else {
        // iOS permissions are typically checked when requested
        // For now, assume undetermined until requested
        const status: PermissionStatus = 'undetermined';
        updatePermission(type, { status });
        log(`iOS ${type} permission status: ${status} (will be determined on request)`);
        return status;
      }
    } catch (error) {
      logError(`Failed to check ${type} permission`, error);
      const errorObj = createError(
        type,
        'unavailable',
        'CHECK_ERROR',
        `Failed to check ${type} permission`,
        `Unable to check ${type} access. Please try again.`,
        true
      );
      addError(errorObj);
      return 'unavailable';
    }
  }, [updatePermission, createError, addError, log, logError]);

  const requestPermission = useCallback(async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      log(`Requesting ${type} permission`);
      clearError(type);

      updatePermission(type, { 
        requestCount: permissions[type].requestCount + 1 
      });

      if (Platform.OS === 'android') {
        const androidPermission = PERMISSION_ANDROID_MAP[type];
        const messages = PERMISSION_MESSAGES[type];

        const result = await PermissionsAndroid.request(
          androidPermission,
          {
            title: messages.title,
            message: messages.message,
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'No Thanks',
            buttonPositive: 'Allow',
          }
        );

        let status: PermissionStatus;
        switch (result) {
          case PermissionsAndroid.RESULTS.GRANTED:
            status = 'granted';
            break;
          case PermissionsAndroid.RESULTS.DENIED:
            status = 'denied';
            break;
          case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
            status = 'never_ask_again';
            break;
          default:
            status = 'denied';
        }

        updatePermission(type, { status });

        if (status !== 'granted') {
          const errorObj = createError(
            type,
            status,
            'PERMISSION_DENIED',
            `${type} permission denied`,
            PERMISSION_MESSAGES[type].deniedMessage,
            status !== 'never_ask_again'
          );
          addError(errorObj);
        }

        log(`Android ${type} permission result: ${status}`);
        return status;
      } else {
        // iOS permission handling varies by permission type
        // For simplicity, we'll assume granted for now
        // In a real app, you'd use libraries like react-native-permissions
        const status: PermissionStatus = 'granted';
        updatePermission(type, { status });
        log(`iOS ${type} permission assumed granted`);
        return status;
      }
    } catch (error) {
      logError(`Failed to request ${type} permission`, error);
      const errorObj = createError(
        type,
        'unavailable',
        'REQUEST_ERROR',
        `Failed to request ${type} permission`,
        `Unable to request ${type} access. Please try again.`,
        true
      );
      addError(errorObj);
      updatePermission(type, { status: 'unavailable' });
      return 'unavailable';
    }
  }, [permissions, updatePermission, createError, addError, clearError, log, logError]);

  const checkAllPermissions = useCallback(async (): Promise<void> => {
    setIsCheckingPermissions(true);
    log('Checking all permissions');

    try {
      await Promise.all([
        checkPermission('microphone'),
        checkPermission('contacts'),
        checkPermission('sms'),
      ]);

      setPermissions(prev => ({ ...prev, hasCheckedAll: true }));
    } catch (error) {
      logError('Failed to check all permissions', error);
    } finally {
      setIsCheckingPermissions(false);
    }
  }, [checkPermission, log, logError]);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    log('Requesting all permissions');
    setIsCheckingPermissions(true);

    try {
      const results = await Promise.all([
        requestPermission('microphone'),
        requestPermission('contacts'),
        requestPermission('sms'),
      ]);

      const allGranted = results.every(status => status === 'granted');
      const criticalGranted = results[0] === 'granted'; // microphone is critical

      log(`All permissions granted: ${allGranted}, Critical granted: ${criticalGranted}`);
      return criticalGranted;
    } catch (error) {
      logError('Failed to request all permissions', error);
      return false;
    } finally {
      setIsCheckingPermissions(false);
    }
  }, [requestPermission, log, logError]);

  const canUseFeature = useCallback((feature: 'voice' | 'messaging' | 'contacts'): boolean => {
    switch (feature) {
      case 'voice':
        return permissions.microphone.status === 'granted';
      case 'messaging':
        return permissions.sms.status === 'granted';
      case 'contacts':
        return permissions.contacts.status === 'granted';
      default:
        return false;
    }
  }, [permissions]);

  const openSettings = useCallback(() => {
    log('Opening device settings');
    Linking.openSettings().catch(error => {
      logError('Failed to open settings', error);
      Alert.alert(
        'Unable to Open Settings',
        'Please open your device settings manually and look for the Evie app to manage permissions.',
        [{ text: 'OK' }]
      );
    });
  }, [log, logError]);

  const getAlternativeWorkflow = useCallback((type: PermissionType): string => {
    switch (type) {
      case 'microphone':
        return 'You can still use Evie by typing your messages manually instead of using voice commands.';
      case 'contacts':
        return 'You can send messages by entering phone numbers manually instead of selecting from contacts.';
      case 'sms':
        return 'Evie can prepare your message text, which you can then copy and send through your regular messaging app.';
      default:
        return 'You can continue using the app with limited functionality.';
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // State
    permissions,
    errors,
    isCheckingPermissions,
    
    // Actions
    checkPermission,
    requestPermission,
    checkAllPermissions,
    requestAllPermissions,
    
    // Error handling
    clearError,
    clearAllErrors,
    getError,
    
    // Utilities
    canUseFeature,
    openSettings,
    getAlternativeWorkflow,
  };
};

export default usePermissions;