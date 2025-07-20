'use client';

import { useEffect, useState } from 'react';
import { Confetti } from './confetti';

interface GameResultsProps {
  playerScore: number;
  opponentScore: number;
  playerId: string;
  winner: string | null;
  totalQuestions: number;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

function AnimatedNumber({ value, duration = 1000, className = '' }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOutCubic);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}

export function GameResults({
  playerScore,
  opponentScore,
  playerId,
  winner,
  totalQuestions,
  onPlayAgain,
  onBackToHome,
}: GameResultsProps) {
  const [showContent, setShowContent] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isWinner = winner === playerId;
  const isDraw = !winner;
  const playerAccuracy = Math.round((playerScore / (totalQuestions * 1000)) * 100);
  const opponentAccuracy = Math.round((opponentScore / (totalQuestions * 1000)) * 100);

  useEffect(() => {
    // Staggered animations
    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setShowScores(true), 800);
    const timer3 = setTimeout(() => setShowActions(true), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="container mx-auto p-8">
      {/* Confetti for winners */}
      <Confetti active={isWinner} duration={4000} intensity={80} />
      
      <div className="max-w-3xl mx-auto">
        {/* Results Header with Animation */}
        <div 
          className={`text-center mb-8 transition-all duration-1000 transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className={`text-8xl mb-6 ${isWinner ? 'animate-bounce' : ''}`}>
            {isWinner ? '🏆' : isDraw ? '🤝' : '😔'}
          </div>
          <h1 className={`text-5xl font-bold mb-4 transition-colors duration-500 ${
            isWinner ? 'text-green-600 animate-pulse' : 
            isDraw ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {isWinner ? 'VICTORY!' : isDraw ? "IT'S A DRAW!" : 'GAME OVER'}
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            {isWinner ? 'Outstanding performance! You dominated the quiz battle!' : 
             isDraw ? 'What an incredible match! Perfect balance of skill!' : 
             'Great effort! Every game makes you stronger!'}
          </p>
          <div className="text-lg text-gray-500">
            Quiz Battle Complete • {totalQuestions} Questions
          </div>
        </div>

        {/* Score Comparison with Animations */}
        <div 
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-1000 transform ${
            showScores ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Player Score */}
          <div className={`bg-white rounded-xl border-2 shadow-lg p-6 transition-all duration-500 ${
            playerScore > opponentScore ? 
              'border-green-300 bg-gradient-to-br from-green-50 to-green-100 transform scale-105' : 
              'border-gray-200 hover:border-blue-300'
          }`}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                  YOU
                </div>
                {playerScore > opponentScore && (
                  <div className="text-green-500 text-2xl animate-bounce">👑</div>
                )}
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                <AnimatedNumber value={playerScore} duration={1500} />
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Accuracy: {playerAccuracy}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-2000 ease-out"
                  style={{ width: `${playerAccuracy}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Opponent Score */}
          <div className={`bg-white rounded-xl border-2 shadow-lg p-6 transition-all duration-500 ${
            opponentScore > playerScore ? 
              'border-green-300 bg-gradient-to-br from-green-50 to-green-100 transform scale-105' : 
              'border-gray-200 hover:border-red-300'
          }`}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  OPP
                </div>
                {opponentScore > playerScore && (
                  <div className="text-green-500 text-2xl animate-bounce">👑</div>
                )}
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                <AnimatedNumber value={opponentScore} duration={1500} />
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Accuracy: {opponentAccuracy}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-2000 ease-out"
                  style={{ width: `${opponentAccuracy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Statistics */}
        <div 
          className={`bg-white rounded-xl border shadow-sm p-6 mb-8 transition-all duration-1000 transform ${
            showScores ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Performance Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedNumber value={totalQuestions} duration={1000} />
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedNumber value={Math.max(playerScore, opponentScore)} duration={1200} />
              </div>
              <div className="text-sm text-gray-600">Top Score</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedNumber value={playerScore + opponentScore} duration={1400} />
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-orange-600">
                <AnimatedNumber value={Math.abs(playerScore - opponentScore)} duration={1600} />
              </div>
              <div className="text-sm text-gray-600">Score Gap</div>
            </div>
          </div>
        </div>

        {/* Action Buttons with Animation */}
        <div 
          className={`text-center space-y-4 transition-all duration-1000 transform ${
            showActions ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="space-y-3">
            <button
              onClick={onPlayAgain}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🎮 Play Again
            </button>
            <div>
              <button
                onClick={onBackToHome}
                className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all duration-300 font-medium bg-white hover:bg-blue-50"
              >
                🏠 Back to Home
              </button>
            </div>
          </div>
          
          {/* Fun fact */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Did you know?</strong> {
                isWinner ? "Winners improve 23% faster than average players!" :
                isDraw ? "Draw games happen in only 8% of all matches!" :
                "Every game played increases your knowledge retention by 15%!"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}