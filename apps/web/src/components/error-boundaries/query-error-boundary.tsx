'use client';

import React, { ReactNode } from 'react';
import ErrorBoundary from '../error-boundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  queryName?: string;
  onQueryError?: (error: Error, queryName?: string) => void;
}

const QueryErrorFallback = ({ 
  queryName, 
  onRetry, 
  onRefresh 
}: { 
  queryName?: string; 
  onRetry: () => void; 
  onRefresh: () => void;
}) => (
  <div className="flex items-center justify-center p-8">
    <Card className="max-w-sm w-full p-6 text-center">
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg">📡</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Loading Error
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Failed to load {queryName || 'data'}. Please check your connection and try again.
        </p>
      </div>

      <div className="flex gap-2 justify-center">
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
        <Button onClick={onRefresh} size="sm">
          Refresh Page
        </Button>
      </div>
    </Card>
  </div>
);

export default function QueryErrorBoundary({ 
  children, 
  queryName, 
  onQueryError 
}: QueryErrorBoundaryProps) {
  const handleQueryError = (error: Error, errorInfo: any) => {
    // Log query-specific error data
    console.error('📡 Query Error:', {
      queryName,
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });

    if (onQueryError) {
      onQueryError(error, queryName);
    }
  };

  const handleRetry = () => {
    // This will cause a remount and retry the query
    window.location.reload();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <ErrorBoundary
      level="component"
      onError={handleQueryError}
      fallback={
        <QueryErrorFallback 
          queryName={queryName} 
          onRetry={handleRetry} 
          onRefresh={handleRefresh} 
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}