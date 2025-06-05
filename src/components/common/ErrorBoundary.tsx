import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Text from './Text';
import Button from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Announce error to screen reader users
    AccessibilityInfo.announceForAccessibility(
      'An error occurred. Please try restarting the app.'
    );

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    AccessibilityInfo.announceForAccessibility('Retrying...');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text
              variant="h3"
              color="danger"
              align="center"
              style={styles.title}
            >
              Something went wrong
            </Text>

            <Text
              variant="body"
              color="secondary"
              align="center"
              style={styles.message}
            >
              We're sorry, but an unexpected error occurred. This shouldn't happen often.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text variant="caption" color="secondary" style={styles.debugText}>
                  Error: {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text variant="caption" color="secondary" style={styles.debugText}>
                    Stack: {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <Button
              title="Try Again"
              onPress={this.handleRetry}
              variant="primary"
              style={styles.retryButton}
              accessibilityHint="Tap to try loading the app again"
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  content: {
    maxWidth: 300,
    alignItems: 'center',
  },

  title: {
    marginBottom: 16,
  },

  message: {
    marginBottom: 24,
  },

  retryButton: {
    minWidth: 120,
  },

  debugInfo: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },

  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ErrorBoundary;