'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { useSocket } from '@/hooks/useSocket';

export function useGameLogic(gameId: string) {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

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

  // Initial setup and validation
  useEffect(() => {
    if (!gameId || !playerId) {
      router.push('/');
      return;
    }

    // Request current game state when component mounts
    requestGameState(gameId);
  }, [gameId, playerId, requestGameState, router]);

  // Reset question state when new question starts
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, currentQuestionIndex]);

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered || timeRemaining <= 0) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    const responseTime = Date.now() - questionStartTime;
    submitAnswer(gameId, answerIndex, responseTime);
  };

  // Handle play again
  const handlePlayAgain = () => {
    resetGame();
    router.push('/');
  };

  return {
    // Game state
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
    
    // Local state
    selectedAnswer,
    
    // Actions
    handleAnswerSelect,
    handlePlayAgain,
    
    // Navigation
    router,
  };
}