'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'global';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || crypto.randomUUID();
    
    // Log error details
    console.error('🚨 React Error Boundary caught an error:', {
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    this.setState({ errorInfo, errorId });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', showDetails = false } = this.props;
      const { error, errorId } = this.state;

      // Different UI based on error level
      if (level === 'global') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💥</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mb-4">
                  The application encountered an unexpected error. Please try refreshing the page.
                </p>
              </div>

              {showDetails && error && (
                <details className="mb-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    Technical Details
                  </summary>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error ID:</strong> {errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleRetry} variant="outline">
                  Try Again
                </Button>
                <Button onClick={this.handleReload}>
                  Refresh Page
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="min-h-96 flex items-center justify-center p-4">
            <Card className="max-w-sm w-full p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Page Error
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  This page encountered an error. You can try again or go back.
                </p>
              </div>

              {showDetails && errorId && (
                <div className="mb-4 text-xs text-gray-500">
                  Error ID: {errorId}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="outline" size="sm">
                  Try Again
                </Button>
                <Button onClick={() => window.history.back()} size="sm">
                  Go Back
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      // Component level error
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Component Error
              </h3>
              <p className="text-sm text-red-600 mb-3">
                This component failed to render properly.
              </p>
              
              {showDetails && errorId && (
                <div className="mb-3 text-xs text-red-500">
                  Error ID: {errorId}
                </div>
              )}

              <Button onClick={this.handleRetry} size="sm" variant="outline">
                Retry Component
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;