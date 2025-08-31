'use client';

import React, { ReactNode } from 'react';
import ErrorBoundary from '../error-boundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GameErrorBoundaryProps {
  children: ReactNode;
  gameId?: string;
  onGameError?: (error: Error, gameId?: string) => void;
}

const GameErrorFallback = ({ gameId, onRetry, onExit }: { 
  gameId?: string; 
  onRetry: () => void; 
  onExit: () => void;
}) => (
  <div className="min-h-96 flex items-center justify-center p-4">
    <Card className="max-w-md w-full p-6 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">🎮</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Game Error
        </h2>
        <p className="text-gray-600 mb-4">
          Something went wrong with the game. This might be due to a connection issue or a bug.
        </p>
        {gameId && (
          <div className="text-sm text-gray-500 mb-4">
            Game ID: {gameId}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600 mb-4">
          <p>You can try the following:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Refresh the game</li>
            <li>Check your internet connection</li>
            <li>Start a new game</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={onRetry} variant="outline">
            Refresh Game
          </Button>
          <Button onClick={onExit}>
            Exit Game
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export default function GameErrorBoundary({ 
  children, 
  gameId, 
  onGameError 
}: GameErrorBoundaryProps) {
  const handleGameError = (error: Error, errorInfo: any) => {
    // Log game-specific error data
    console.error('🎮 Game Error:', {
      gameId,
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });

    // Report to error tracking service
    if (onGameError) {
      onGameError(error, gameId);
    }
  };

  const handleRetry = () => {
    // Force component remount
    window.location.reload();
  };

  const handleExit = () => {
    // Navigate back to matchmaking
    window.location.href = '/matchmaking';
  };

  return (
    <ErrorBoundary
      level="page"
      onError={handleGameError}
      fallback={
        <GameErrorFallback 
          gameId={gameId} 
          onRetry={handleRetry} 
          onExit={handleExit} 
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}