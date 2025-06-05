import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import VoiceService, { VoiceServiceState, VoiceError, VoiceEvent } from '@/services/VoiceService';

export interface DetectedKeyword {
  keyword: string;
  keywordIndex: number;
  confidence: number;
  timestamp: Date;
}

export interface VoiceDetectionState {
  isListening: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  error: VoiceError | null;
  serviceState: VoiceServiceState;
  detectedKeywords: DetectedKeyword[];
  isInitialized: boolean;
}

export interface VoiceDetectionConfig {
  accessKey: string;
  keyword?: string;
  sensitivity?: number;
  enableDebugging?: boolean;
  autoStart?: boolean;
  maxKeywordHistory?: number;
}

export interface UseVoiceDetectionReturn {
  // State
  isListening: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  error: VoiceError | null;
  serviceState: VoiceServiceState;
  detectedKeywords: DetectedKeyword[];
  isInitialized: boolean;
  
  // Actions
  startListening: () => Promise<boolean>;
  stopListening: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
  clearKeywordHistory: () => void;
  retryInitialization: () => Promise<boolean>;
  
  // Configuration
  updateSensitivity: (sensitivity: number) => void;
  getKeyword: () => string;
  getSensitivity: () => number;
}

const DEFAULT_CONFIG: Required<VoiceDetectionConfig> = {
  accessKey: '',
  keyword: 'sunshine',
  sensitivity: 0.5,
  enableDebugging: __DEV__,
  autoStart: false,
  maxKeywordHistory: 10,
};

export const useVoiceDetection = (config: VoiceDetectionConfig): UseVoiceDetectionReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isComponentMountedRef = useRef(true);

  const [state, setState] = useState<VoiceDetectionState>({
    isListening: false,
    isLoading: false,
    hasPermission: false,
    error: null,
    serviceState: VoiceServiceState.IDLE,
    detectedKeywords: [],
    isInitialized: false,
  });

  const log = useCallback((message: string, data?: any) => {
    if (mergedConfig.enableDebugging) {
      console.log(`[useVoiceDetection] ${message}`, data || '');
    }
  }, [mergedConfig.enableDebugging]);

  const logError = useCallback((message: string, error?: any) => {
    console.error(`[useVoiceDetection ERROR] ${message}`, error || '');
  }, []);

  const updateState = useCallback((updates: Partial<VoiceDetectionState>) => {
    if (!isComponentMountedRef.current) return;
    
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      log('State updated', { updates, newState });
      return newState;
    });
  }, [log]);

  const handleVoiceEvent = useCallback((event: VoiceEvent) => {
    if (!isComponentMountedRef.current) return;
    
    log('Received voice event', event);

    switch (event.type) {
      case 'keyword_detected':
        const detectedKeyword: DetectedKeyword = {
          keyword: event.data.keyword,
          keywordIndex: event.data.keywordIndex,
          confidence: event.data.confidence,
          timestamp: event.data.timestamp,
        };

        updateState(prevState => ({
          detectedKeywords: [
            detectedKeyword,
            ...prevState.detectedKeywords.slice(0, mergedConfig.maxKeywordHistory - 1)
          ],
        }));
        break;

      case 'listening_started':
        updateState({
          isListening: true,
          isLoading: false,
          serviceState: VoiceServiceState.LISTENING,
          error: null,
        });
        break;

      case 'listening_stopped':
        updateState({
          isListening: false,
          isLoading: false,
          serviceState: VoiceServiceState.IDLE,
        });
        break;

      case 'permission_denied':
        updateState({
          hasPermission: false,
          error: event.data,
          serviceState: VoiceServiceState.PERMISSION_DENIED,
          isLoading: false,
        });
        break;

      case 'error':
        logError('Voice service error', event.data);
        updateState({
          error: event.data,
          serviceState: VoiceServiceState.ERROR,
          isLoading: false,
          isListening: false,
        });
        break;
    }
  }, [updateState, mergedConfig.maxKeywordHistory, log, logError]);

  const initializeVoiceService = useCallback(async (): Promise<boolean> => {
    try {
      log('Initializing voice service');
      updateState({ isLoading: true, error: null });

      if (!mergedConfig.accessKey) {
        throw new Error('Porcupine access key is required');
      }

      // Create voice service if it doesn't exist
      if (!voiceServiceRef.current) {
        voiceServiceRef.current = new VoiceService({
          accessKey: mergedConfig.accessKey,
          keyword: mergedConfig.keyword,
          sensitivity: mergedConfig.sensitivity,
          enableDebugging: mergedConfig.enableDebugging,
        });

        // Set up event listeners
        voiceServiceRef.current.on('keyword_detected', handleVoiceEvent);
        voiceServiceRef.current.on('listening_started', handleVoiceEvent);
        voiceServiceRef.current.on('listening_stopped', handleVoiceEvent);
        voiceServiceRef.current.on('permission_denied', handleVoiceEvent);
        voiceServiceRef.current.on('error', handleVoiceEvent);
      }

      const success = await voiceServiceRef.current.initialize();
      
      if (success) {
        updateState({
          isInitialized: true,
          hasPermission: voiceServiceRef.current.isPermissionGranted(),
          serviceState: voiceServiceRef.current.getState(),
          isLoading: false,
        });

        // Auto-start if configured
        if (mergedConfig.autoStart) {
          await startListening();
        }
      } else {
        updateState({
          isLoading: false,
          isInitialized: false,
        });
      }

      return success;
    } catch (error) {
      logError('Failed to initialize voice service', error);
      updateState({
        error: {
          code: 'INIT_HOOK_ERROR',
          message: 'Hook initialization failed',
          userMessage: 'Unable to initialize voice detection.',
          isRecoverable: true,
          platform: Platform.OS as 'android' | 'ios',
          technicalDetails: error instanceof Error ? error.message : String(error),
        },
        isLoading: false,
        isInitialized: false,
      });
      return false;
    }
  }, [mergedConfig, handleVoiceEvent, updateState, log, logError]);

  const startListening = useCallback(async (): Promise<boolean> => {
    try {
      log('Starting listening');
      
      if (!voiceServiceRef.current) {
        const initialized = await initializeVoiceService();
        if (!initialized) return false;
      }

      updateState({ isLoading: true, error: null });
      const success = await voiceServiceRef.current!.start();
      
      if (!success) {
        updateState({ isLoading: false });
      }
      
      return success;
    } catch (error) {
      logError('Failed to start listening', error);
      updateState({
        error: {
          code: 'START_HOOK_ERROR',
          message: 'Failed to start listening',
          userMessage: 'Unable to start voice detection.',
          isRecoverable: true,
          platform: Platform.OS as 'android' | 'ios',
          technicalDetails: error instanceof Error ? error.message : String(error),
        },
        isLoading: false,
      });
      return false;
    }
  }, [initializeVoiceService, updateState, log, logError]);

  const stopListening = useCallback(async (): Promise<boolean> => {
    try {
      log('Stopping listening');
      
      if (!voiceServiceRef.current) {
        updateState({ isListening: false, isLoading: false });
        return true;
      }

      updateState({ isLoading: true });
      const success = await voiceServiceRef.current.stop();
      
      if (!success) {
        updateState({ isLoading: false });
      }
      
      return success;
    } catch (error) {
      logError('Failed to stop listening', error);
      updateState({
        error: {
          code: 'STOP_HOOK_ERROR',
          message: 'Failed to stop listening',
          userMessage: 'Unable to stop voice detection.',
          isRecoverable: true,
          platform: Platform.OS as 'android' | 'ios',
          technicalDetails: error instanceof Error ? error.message : String(error),
        },
        isLoading: false,
      });
      return false;
    }
  }, [updateState, log, logError]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      log('Requesting microphone permission');
      
      if (!voiceServiceRef.current) {
        await initializeVoiceService();
      }

      if (!voiceServiceRef.current) return false;

      const granted = await voiceServiceRef.current.requestMicrophonePermission();
      updateState({ hasPermission: granted });
      
      return granted;
    } catch (error) {
      logError('Failed to request permission', error);
      return false;
    }
  }, [initializeVoiceService, updateState, log, logError]);

  const clearError = useCallback(() => {
    log('Clearing error');
    updateState({ error: null });
  }, [updateState, log]);

  const clearKeywordHistory = useCallback(() => {
    log('Clearing keyword history');
    updateState({ detectedKeywords: [] });
  }, [updateState, log]);

  const retryInitialization = useCallback(async (): Promise<boolean> => {
    log('Retrying initialization');
    updateState({ error: null });
    return await initializeVoiceService();
  }, [initializeVoiceService, updateState, log]);

  const updateSensitivity = useCallback((sensitivity: number) => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.updateSensitivity(sensitivity);
      log('Sensitivity updated', { sensitivity });
    }
  }, [log]);

  const getKeyword = useCallback((): string => {
    return voiceServiceRef.current?.getKeyword() || mergedConfig.keyword;
  }, [mergedConfig.keyword]);

  const getSensitivity = useCallback((): number => {
    return voiceServiceRef.current?.getSensitivity() || mergedConfig.sensitivity;
  }, [mergedConfig.sensitivity]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      log('App state changed', { from: appStateRef.current, to: nextAppState });
      
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume if was listening
        if (state.isListening && voiceServiceRef.current) {
          log('Resuming voice detection after app became active');
          await startListening();
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background - pause listening
        if (state.isListening && voiceServiceRef.current) {
          log('Pausing voice detection as app goes to background');
          await stopListening();
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [state.isListening, startListening, stopListening, log]);

  // Initialize on mount
  useEffect(() => {
    if (mergedConfig.accessKey) {
      initializeVoiceService();
    }
  }, [initializeVoiceService, mergedConfig.accessKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log('Component unmounting, cleaning up');
      isComponentMountedRef.current = false;
      
      if (voiceServiceRef.current) {
        voiceServiceRef.current.cleanup();
        voiceServiceRef.current = null;
      }
    };
  }, [log]);

  return {
    // State
    isListening: state.isListening,
    isLoading: state.isLoading,
    hasPermission: state.hasPermission,
    error: state.error,
    serviceState: state.serviceState,
    detectedKeywords: state.detectedKeywords,
    isInitialized: state.isInitialized,
    
    // Actions
    startListening,
    stopListening,
    requestPermission,
    clearError,
    clearKeywordHistory,
    retryInitialization,
    
    // Configuration
    updateSensitivity,
    getKeyword,
    getSensitivity,
  };
};

export default useVoiceDetection;