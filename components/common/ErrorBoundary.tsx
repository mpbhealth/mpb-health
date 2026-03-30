import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { cardChromeSm, platformStyles } from '@/utils/scaling';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertCircle size={64} color={colors.status.error} />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We apologize for the inconvenience. The app encountered an unexpected error.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <RefreshCw size={20} color={colors.background.default} />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
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
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: colors.background.default,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    width: '100%',
    ...cardChromeSm,
  },
  errorTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  buttonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.background.default,
  },
});
