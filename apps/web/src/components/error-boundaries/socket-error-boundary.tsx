'use client';

import React, { ReactNode } from 'react';
import ErrorBoundary from '../error-boundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SocketErrorBoundaryProps {
  children: ReactNode;
  onSocketError?: (error: Error) => void;
}

const SocketErrorFallback = ({ 
  onReconnect, 
  onRefresh 
}: { 
  onReconnect: () => void; 
  onRefresh: () => void;
}) => (
  <div className="flex items-center justify-center p-8">
    <Card className="max-w-sm w-full p-6 text-center">
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🔌</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connection Error
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Lost connection to the game server. Real-time features may not work properly.
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500 mb-3">
          <p>Troubleshooting steps:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check your internet connection</li>
            <li>Try reconnecting</li>
            <li>Refresh the page if problem persists</li>
          </ul>
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={onReconnect} variant="outline" size="sm">
            Reconnect
          </Button>
          <Button onClick={onRefresh} size="sm">
            Refresh Page
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export default function SocketErrorBoundary({ 
  children, 
  onSocketError 
}: SocketErrorBoundaryProps) {
  const handleSocketError = (error: Error, errorInfo: any) => {
    // Log socket-specific error data
    console.error('🔌 Socket Error:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString(),
      connectionState: 'unknown' // Could be enhanced to show actual socket state
    });

    if (onSocketError) {
      onSocketError(error);
    }
  };

  const handleReconnect = () => {
    // Trigger socket reconnection
    // This would need to be implemented based on your socket setup
    window.location.reload();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <ErrorBoundary
      level="component"
      onError={handleSocketError}
      fallback={
        <SocketErrorFallback 
          onReconnect={handleReconnect} 
          onRefresh={handleRefresh} 
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}