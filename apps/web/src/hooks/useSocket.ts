import {useCallback, useEffect, useRef} from 'react';
import { socketManager, TypedSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/game-store';

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const {
    setCurrentGame,
    setCurrentQuestion,
    setTimeRemaining,
    setWaitingForOpponent,
    setOpponentAnswered,
    updateScores,
    setGameCompleted,
    playerId,
  } = useGameStore();

  useEffect(() => {
    socketRef.current = socketManager.connect();
    const socket = socketRef.current;

    // Game creation/joining events
    socket.on('player-create-game', (data) => {
      setCurrentGame(data.game);
      setWaitingForOpponent(true);
    });

    socket.on('player-join-game', (data) => {
      setCurrentGame(data.game);
      setWaitingForOpponent(false);
    });

    socket.on('opponent-join-game', (data) => {
      setCurrentGame(data.game);
      setWaitingForOpponent(false);
    });

    // Game flow events
    socket.on('game-started', (data) => {
      setCurrentGame(data.game);
      setCurrentQuestion(data.firstQuestion, 0);
      setWaitingForOpponent(false);
    });

    socket.on('question-started', (data) => {
      setCurrentQuestion(data.question, data.questionIndex);
      setTimeRemaining(data.timeLimit / 1000); // Convert to seconds
    });

    socket.on('countdown-tick', (data) => {
      setTimeRemaining(data.timeRemaining / 1000); // Convert to seconds
    });

    socket.on('opponent-answered', () => {
      setOpponentAnswered(true);
    });

    socket.on('answer-result', (data) => {
      // Handle answer feedback (can be used for UI feedback)
      console.log('Answer result:', data);
    });

    socket.on('question-timeout', (data) => {
      updateScores(data.scores.player1, data.scores.player2);
    });

    socket.on('game-completed', (data) => {
      updateScores(data.finalScores.player1, data.finalScores.player2);
      setGameCompleted(true, data.winner);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      // socketManager.disconnect();
    };
  }, [
    setCurrentGame,
    setCurrentQuestion,
    setTimeRemaining,
    setWaitingForOpponent,
    setOpponentAnswered,
    updateScores,
    setGameCompleted,
    playerId,
  ]);

  const joinMatchmaking = useCallback((themeId: string) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('player-join-matchmaking', { themeId, playerId });
    }
  }, []);

  const submitAnswer = useCallback((gameId: string, selectedAnswer: number, responseTime: number) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('player-submit-answer', {
        gameId,
        playerId,
        selectedAnswer,
        responseTime,
      });
    }
  }, []);

  const requestGameState = useCallback((gameId: string) => {
    if (socketRef.current && playerId) {
      socketRef.current.emit('request-game-state', { gameId, playerId });
    }
  }, []);

  return {
    socket: socketRef.current,
    joinMatchmaking,
    submitAnswer,
    requestGameState,
  };
}
