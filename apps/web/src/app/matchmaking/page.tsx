'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/useSocket';
import { trpc } from '@/components/providers';

function MatchmakingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get('themeId') ?? '';
  const themeName = searchParams.get('themeName') ?? '';

  const {
    playerId,
    isInMatchmaking,
    isWaitingForOpponent,
    currentGame,
    setMatchmaking,
    setWaitingForOpponent
  } = useGameStore();

  const { joinMatchmaking } = useSocket();
  const [secondsWaiting, setSecondsWaiting] = useState(0);

  // Get theme details
  const { data: theme } = trpc.themes.getById.useQuery(
    { id: themeId || '' },
    { enabled: !!themeId }
  );

  useEffect(() => {
    // Start matchmaking when component mounts
    setMatchmaking(true);
    joinMatchmaking(themeId);
  }, [themeId, playerId, joinMatchmaking, setMatchmaking, router]);

  useEffect(() => {
    // Timer for waiting duration
    let interval: NodeJS.Timeout;
    if (isInMatchmaking || isWaitingForOpponent) {
      interval = setInterval(() => {
        setSecondsWaiting(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInMatchmaking, isWaitingForOpponent]);

  useEffect(() => {
    // Navigate to game when matched
    if (currentGame?.id) {
      router.push(`/game/${currentGame.id}`);
    }
  }, [currentGame, router]);

  const handleCancel = () => {
    setMatchmaking(false);
    setWaitingForOpponent(false);
    router.push('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!themeId || !playerId) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finding Opponent</h1>
          <p className="text-gray-600">Looking for another player to battle</p>
        </div>

        {/* Theme Info */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {theme?.name || themeName || 'Loading...'}
            </h2>
            <p className="text-gray-600">
              {theme?.description || 'Preparing your quiz battle...'}
            </p>
          </div>
        </div>

        {/* Matchmaking Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            {/* Animated loading spinner */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {isWaitingForOpponent ? 'Waiting for Opponent' : 'Searching for Players'}
            </h3>

            <p className="text-blue-700 mb-4">
              {isWaitingForOpponent
                ? 'Found a game! Waiting for another player to join...'
                : 'Looking for an opponent with the same theme preference...'
              }
            </p>

            <div className="text-2xl font-mono font-bold text-blue-800">
              {formatTime(secondsWaiting)}
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Your Player ID: <span className="font-mono font-semibold">{playerId.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="text-center">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel Matchmaking
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Open another browser tab to test multiplayer locally
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MatchmakingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    }>
      <MatchmakingContent />
    </Suspense>
  );
}
