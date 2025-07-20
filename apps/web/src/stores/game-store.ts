import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Game, Question, Player } from '@quiz-battle/shared';
import { generatePlayerId } from '@quiz-battle/shared';

interface GameState {
  // Player
  playerId: string;
  
  // Current game
  currentGame: Game | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  timeRemaining: number;
  
  // Game state
  isInMatchmaking: boolean;
  isWaitingForOpponent: boolean;
  hasAnswered: boolean;
  opponentHasAnswered: boolean;
  
  // Scores
  playerScore: number;
  opponentScore: number;
  
  // Game results
  gameCompleted: boolean;
  winner: string | null;
  
  // Actions
  setPlayerId: (id: string) => void;
  setCurrentGame: (game: Game | null) => void;
  setCurrentQuestion: (question: Question | null, index: number) => void;
  setTimeRemaining: (time: number) => void;
  setMatchmaking: (inMatchmaking: boolean) => void;
  setWaitingForOpponent: (waiting: boolean) => void;
  setHasAnswered: (answered: boolean) => void;
  setOpponentAnswered: (answered: boolean) => void;
  updateScores: (player: number, opponent: number) => void;
  setGameCompleted: (completed: boolean, winner: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    playerId: '',
    currentGame: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    timeRemaining: 10,
    isInMatchmaking: false,
    isWaitingForOpponent: false,
    hasAnswered: false,
    opponentHasAnswered: false,
    playerScore: 0,
    opponentScore: 0,
    gameCompleted: false,
    winner: null,

    // Actions
    setPlayerId: (id: string) => set({ playerId: id }),
    
    setCurrentGame: (game: Game | null) => set({ currentGame: game }),
    
    setCurrentQuestion: (question: Question | null, index: number) => 
      set({ 
        currentQuestion: question, 
        currentQuestionIndex: index,
        hasAnswered: false,
        opponentHasAnswered: false,
        timeRemaining: 10
      }),
    
    setTimeRemaining: (time: number) => set({ timeRemaining: time }),
    
    setMatchmaking: (inMatchmaking: boolean) => set({ isInMatchmaking: inMatchmaking }),
    
    setWaitingForOpponent: (waiting: boolean) => set({ isWaitingForOpponent: waiting }),
    
    setHasAnswered: (answered: boolean) => set({ hasAnswered: answered }),
    
    setOpponentAnswered: (answered: boolean) => set({ opponentHasAnswered: answered }),
    
    updateScores: (player: number, opponent: number) => 
      set({ playerScore: player, opponentScore: opponent }),
    
    setGameCompleted: (completed: boolean, winner: string | null) => 
      set({ gameCompleted: completed, winner }),
    
    resetGame: () => set({
      currentGame: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      timeRemaining: 10,
      isInMatchmaking: false,
      isWaitingForOpponent: false,
      hasAnswered: false,
      opponentHasAnswered: false,
      playerScore: 0,
      opponentScore: 0,
      gameCompleted: false,
      winner: null,
    }),
  }))
);

// Initialize player ID on store creation
if (typeof window !== 'undefined') {
  const storedPlayerId = localStorage.getItem('quiz-battle-player-id');
  if (storedPlayerId) {
    useGameStore.getState().setPlayerId(storedPlayerId);
  } else {
    const newPlayerId = generatePlayerId();
    localStorage.setItem('quiz-battle-player-id', newPlayerId);
    useGameStore.getState().setPlayerId(newPlayerId);
  }
}