'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/useSocket';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const { 
    playerId, 
    currentGame, 
    gameCompleted,
    winner 
  } = useGameStore();
  
  const { requestGameState } = useSocket();

  useEffect(() => {
    if (!gameId || !playerId) {
      router.push('/');
      return;
    }

    // Request current game state when component mounts
    requestGameState(gameId);
  }, [gameId, playerId, requestGameState, router]);

  if (!gameId || !playerId) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  // For Phase 2, we'll just show that matchmaking worked
  // Phase 3 will implement the actual quiz gameplay
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">
            Matchmaking Successful!
          </h1>
          <p className="text-green-700 mb-6">
            You've been matched with an opponent. The quiz battle will begin shortly!
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Game Details</h2>
            <p className="text-sm text-gray-600">Game ID: <code className="bg-gray-100 px-2 py-1 rounded">{gameId}</code></p>
            <p className="text-sm text-gray-600">Player ID: <code className="bg-gray-100 px-2 py-1 rounded">{playerId.slice(0, 8)}...</code></p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Phase 3 will implement the actual quiz gameplay here.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}