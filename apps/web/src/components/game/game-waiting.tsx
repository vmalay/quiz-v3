'use client';

interface GameWaitingProps {
  isWaitingForOpponent: boolean;
}

export function GameWaiting({ isWaitingForOpponent }: GameWaitingProps) {
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-8 shadow-lg">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-3xl font-bold text-blue-800 mb-4 animate-fade-in">
            Game Starting...
          </h1>
          <p className="text-blue-700 mb-6 text-lg">
            {isWaitingForOpponent ? 
              'Waiting for your opponent to join...' : 
              'Get ready! The quiz battle will begin shortly.'}
          </p>
          
          {/* Enhanced loading animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
              <div className="absolute top-0 left-0 animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          </div>
          
          {/* Countdown or status indicator */}
          <div className="bg-white rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-600">
              {isWaitingForOpponent ? 
                '💡 Tip: Share this game with a friend to play together!' : 
                '🎯 Get ready to test your knowledge!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}