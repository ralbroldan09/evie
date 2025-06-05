import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { PorcupineManager } from '@picovoice/porcupine-react-native';
import { EventEmitter } from 'events';

export interface VoiceEvent {
  type: 'keyword_detected' | 'listening_started' | 'listening_stopped' | 'error' | 'permission_denied';
  data?: any;
  timestamp: Date;
}

export interface VoiceServiceConfig {
  accessKey: string;
  keyword: string;
  sensitivity: number;
  enableDebugging: boolean;
}

export interface VoiceError {
  code: string;
  message: string;
  userMessage: string;
  isRecoverable: boolean;
  platform?: 'android' | 'ios';
  technicalDetails?: string;
}

export enum VoiceServiceState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  ERROR = 'error',
  PERMISSION_DENIED = 'permission_denied',
}

class VoiceService extends EventEmitter {
  private porcupineManager: any = null;
  private currentState: VoiceServiceState = VoiceServiceState.IDLE;
  private config: VoiceServiceConfig;
  private isInitialized = false;
  private permissionGranted = false;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(config: VoiceServiceConfig) {
    super();
    this.config = config;
    this.log('VoiceService initialized', { config: { ...config, accessKey: '[REDACTED]' } });
  }

  private log(message: string, data?: any): void {
    if (this.config.enableDebugging) {
      console.log(`[VoiceService] ${message}`, data || '');
    }
  }

  private logError(message: string, error?: any): void {
    console.error(`[VoiceService ERROR] ${message}`, error || '');
  }

  private emit(event: string, data?: any): boolean {
    const voiceEvent: VoiceEvent = {
      type: event as any,
      data,
      timestamp: new Date(),
    };
    
    this.log(`Emitting event: ${event}`, voiceEvent);
    return super.emit(event, voiceEvent);
  }

  private createError(
    code: string,
    message: string,
    userMessage: string,
    isRecoverable: boolean = true,
    technicalDetails?: string
  ): VoiceError {
    return {
      code,
      message,
      userMessage,
      isRecoverable,
      platform: Platform.OS as 'android' | 'ios',
      technicalDetails,
    };
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      this.log('Requesting microphone permission');

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Evie needs access to your microphone to listen for voice commands.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        this.permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        this.log('Android permission result:', granted);
      } else {
        // iOS permissions are handled automatically by Porcupine
        this.permissionGranted = true;
        this.log('iOS permission assumed granted (handled by Porcupine)');
      }

      if (!this.permissionGranted) {
        const error = this.createError(
          'PERMISSION_DENIED',
          'Microphone permission denied',
          'Please enable microphone access in Settings to use voice commands.',
          false
        );
        this.emit('permission_denied', error);
        this.setState(VoiceServiceState.PERMISSION_DENIED);
      }

      return this.permissionGranted;
    } catch (error) {
      this.logError('Permission request failed', error);
      const voiceError = this.createError(
        'PERMISSION_ERROR',
        'Failed to request microphone permission',
        'Unable to request microphone access. Please check your device settings.',
        true,
        error instanceof Error ? error.message : String(error)
      );
      this.emit('error', voiceError);
      return false;
    }
  }

  private setState(newState: VoiceServiceState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    this.log(`State changed: ${previousState} -> ${newState}`);
  }

  async initialize(): Promise<boolean> {
    try {
      this.log('Initializing VoiceService');
      this.setState(VoiceServiceState.INITIALIZING);

      if (!this.permissionGranted) {
        const hasPermission = await this.requestMicrophonePermission();
        if (!hasPermission) {
          return false;
        }
      }

      // Validate access key
      if (!this.config.accessKey || this.config.accessKey.length < 10) {
        throw new Error('Invalid Porcupine access key provided');
      }

      // Create Porcupine manager with sunshine keyword
      this.porcupineManager = await PorcupineManager.create(
        this.config.accessKey,
        [this.config.keyword], // 'sunshine'
        [this.config.sensitivity], // sensitivity level (0.0 - 1.0)
        (keywordIndex: number) => {
          this.log(`Keyword detected: ${this.config.keyword} (index: ${keywordIndex})`);
          this.handleKeywordDetection(keywordIndex);
        },
        (error: string) => {
          this.logError('Porcupine process error', error);
          this.handlePorcupineError(error);
        }
      );

      this.isInitialized = true;
      this.setState(VoiceServiceState.IDLE);
      this.log('VoiceService initialized successfully');
      return true;

    } catch (error) {
      this.logError('Initialization failed', error);
      const voiceError = this.createError(
        'INIT_ERROR',
        'Failed to initialize voice service',
        'Unable to start voice detection. Please restart the app.',
        true,
        error instanceof Error ? error.message : String(error)
      );
      this.emit('error', voiceError);
      this.setState(VoiceServiceState.ERROR);
      return false;
    }
  }

  private handleKeywordDetection(keywordIndex: number): void {
    this.log(`Handling keyword detection`, { keywordIndex, keyword: this.config.keyword });
    
    this.setState(VoiceServiceState.PROCESSING);
    
    this.emit('keyword_detected', {
      keyword: this.config.keyword,
      keywordIndex,
      confidence: this.config.sensitivity,
      timestamp: new Date(),
    });

    // Reset to listening state after processing
    setTimeout(() => {
      if (this.currentState === VoiceServiceState.PROCESSING) {
        this.setState(VoiceServiceState.LISTENING);
      }
    }, 1000);
  }

  private handlePorcupineError(error: string): void {
    this.logError('Porcupine error occurred', error);
    
    const voiceError = this.createError(
      'PORCUPINE_ERROR',
      `Porcupine engine error: ${error}`,
      'Voice detection encountered an issue. Trying to recover...',
      true,
      error
    );

    this.emit('error', voiceError);
    this.setState(VoiceServiceState.ERROR);

    // Attempt recovery
    this.attemptRecovery();
  }

  private async attemptRecovery(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      this.log('Max retries reached, giving up recovery');
      const error = this.createError(
        'RECOVERY_FAILED',
        'Unable to recover voice service',
        'Voice detection is not working. Please restart the app.',
        false
      );
      this.emit('error', error);
      return;
    }

    this.retryCount++;
    this.log(`Attempting recovery (attempt ${this.retryCount}/${this.maxRetries})`);

    try {
      await this.stop();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await this.start();
      this.retryCount = 0; // Reset on successful recovery
      this.log('Recovery successful');
    } catch (error) {
      this.logError('Recovery attempt failed', error);
      setTimeout(() => this.attemptRecovery(), 3000); // Retry after 3 seconds
    }
  }

  async start(): Promise<boolean> {
    try {
      this.log('Starting voice detection');

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      if (this.currentState === VoiceServiceState.LISTENING) {
        this.log('Already listening, ignoring start request');
        return true;
      }

      if (!this.porcupineManager) {
        throw new Error('Porcupine manager not initialized');
      }

      await this.porcupineManager.start();
      this.setState(VoiceServiceState.LISTENING);
      this.emit('listening_started');
      this.log('Voice detection started successfully');
      return true;

    } catch (error) {
      this.logError('Failed to start voice detection', error);
      const voiceError = this.createError(
        'START_ERROR',
        'Failed to start voice detection',
        'Unable to start listening for voice commands.',
        true,
        error instanceof Error ? error.message : String(error)
      );
      this.emit('error', voiceError);
      this.setState(VoiceServiceState.ERROR);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    try {
      this.log('Stopping voice detection');

      if (this.currentState === VoiceServiceState.IDLE || !this.porcupineManager) {
        this.log('Already stopped or not initialized');
        this.setState(VoiceServiceState.IDLE);
        return true;
      }

      await this.porcupineManager.stop();
      this.setState(VoiceServiceState.IDLE);
      this.emit('listening_stopped');
      this.log('Voice detection stopped successfully');
      return true;

    } catch (error) {
      this.logError('Failed to stop voice detection', error);
      const voiceError = this.createError(
        'STOP_ERROR',
        'Failed to stop voice detection',
        'Unable to stop voice detection properly.',
        true,
        error instanceof Error ? error.message : String(error)
      );
      this.emit('error', voiceError);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.log('Cleaning up VoiceService');

      if (this.porcupineManager) {
        await this.stop();
        await this.porcupineManager.delete();
        this.porcupineManager = null;
      }

      this.removeAllListeners();
      this.isInitialized = false;
      this.setState(VoiceServiceState.IDLE);
      this.log('VoiceService cleanup completed');

    } catch (error) {
      this.logError('Cleanup failed', error);
    }
  }

  // Getters
  getState(): VoiceServiceState {
    return this.currentState;
  }

  isListening(): boolean {
    return this.currentState === VoiceServiceState.LISTENING;
  }

  isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  getKeyword(): string {
    return this.config.keyword;
  }

  getSensitivity(): number {
    return this.config.sensitivity;
  }

  // Configuration updates
  updateSensitivity(sensitivity: number): void {
    if (sensitivity >= 0.0 && sensitivity <= 1.0) {
      this.config.sensitivity = sensitivity;
      this.log('Sensitivity updated', { sensitivity });
    } else {
      this.logError('Invalid sensitivity value', { sensitivity });
    }
  }

  // Platform-specific utilities
  getPlatformInfo(): { platform: string; isSupported: boolean } {
    const platform = Platform.OS;
    const isSupported = platform === 'ios' || platform === 'android';
    
    return {
      platform,
      isSupported,
    };
  }
}

export default VoiceService;