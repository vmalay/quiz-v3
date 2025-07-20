'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/useSocket';
import { GameStatus } from '@quiz-battle/shared';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  
  const { 
    playerId,
    currentGame,
    currentQuestion,
    currentQuestionIndex,
    timeRemaining,
    isWaitingForOpponent,
    hasAnswered,
    opponentHasAnswered,
    playerScore,
    opponentScore,
    gameCompleted,
    winner,
    setHasAnswered,
    resetGame
  } = useGameStore();
  
  const { submitAnswer, requestGameState } = useSocket();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (!gameId || !playerId) {
      router.push('/');
      return;
    }

    // Request current game state when component mounts
    requestGameState(gameId);
  }, [gameId, playerId, requestGameState, router]);

  useEffect(() => {
    // Reset question state when new question starts
    if (currentQuestion) {
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered || timeRemaining <= 0) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    const responseTime = Date.now() - questionStartTime;
    submitAnswer(gameId, answerIndex, responseTime);
  };

  const handlePlayAgain = () => {
    resetGame();
    router.push('/');
  };

  if (!gameId || !playerId) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading state while waiting for game data
  if (!currentGame) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading game...</span>
        </div>
      </div>
    );
  }

  // Game completed state
  if (gameCompleted || currentGame.status === GameStatus.COMPLETED) {
    const isWinner = winner === playerId;
    const isDraw = !winner;
    
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {isWinner ? '🏆' : isDraw ? '🤝' : '😔'}
            </div>
            <h1 className={`text-4xl font-bold mb-4 ${
              isWinner ? 'text-green-600' : isDraw ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {isWinner ? 'Victory!' : isDraw ? "It's a Draw!" : 'Game Over'}
            </h1>
            <p className="text-xl text-gray-600">
              {isWinner ? 'Congratulations! You won the quiz battle!' : 
               isDraw ? 'Great game! You both scored the same!' : 
               'Better luck next time!'}
            </p>
          </div>

          {/* Final Scores */}
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Final Scores</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${
                playerScore > opponentScore ? 'bg-green-50 border-green-200' : 'bg-gray-50'
              } border`}>
                <p className="text-sm text-gray-600 mb-1">You</p>
                <p className="text-3xl font-bold text-gray-800">{playerScore}</p>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                opponentScore > playerScore ? 'bg-green-50 border-green-200' : 'bg-gray-50'
              } border`}>
                <p className="text-sm text-gray-600 mb-1">Opponent</p>
                <p className="text-3xl font-bold text-gray-800">{opponentScore}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            <button
              onClick={handlePlayAgain}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Play Again
            </button>
            <div>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (isWaitingForOpponent || !currentQuestion) {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold text-blue-800 mb-4">
              Game Starting...
            </h1>
            <p className="text-blue-700 mb-6">
              {isWaitingForOpponent ? 
                'Waiting for your opponent to join...' : 
                'Get ready! The quiz battle will begin shortly.'}
            </p>
            
            {/* Loading spinner */}
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz gameplay
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            {/* Question Progress */}
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of 5
            </div>
            
            {/* Timer */}
            <div className={`text-2xl font-bold ${
              timeRemaining <= 3 ? 'text-red-600' : timeRemaining <= 5 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {Math.max(0, Math.ceil(timeRemaining))}s
            </div>
            
            {/* Scores */}
            <div className="text-sm text-gray-600">
              You: {playerScore} | Opponent: {opponentScore}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeRemaining <= 3 ? 'bg-red-500' : timeRemaining <= 5 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(timeRemaining / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {currentQuestion.questionText}
          </h2>
          
          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={hasAnswered || timeRemaining <= 0}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedAnswer === index
                    ? 'bg-blue-100 border-blue-500 text-blue-800'
                    : hasAnswered || timeRemaining <= 0
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Status */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                hasAnswered ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-gray-600">
                You: {hasAnswered ? 'Answered' : 'Answering...'}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                opponentHasAnswered ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-gray-600">
                Opponent: {opponentHasAnswered ? 'Answered' : 'Answering...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}