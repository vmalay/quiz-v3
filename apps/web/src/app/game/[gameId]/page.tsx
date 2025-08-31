'use client';

import { useParams } from 'next/navigation';
import { GameStatus, GAME_CONFIG } from '@quiz-battle/shared';
import { GameResults } from '@/components/game-results';
import { GameLoading } from '@/components/game/game-loading';
import { GameWaiting } from '@/components/game/game-waiting';
import { ActiveQuiz } from '@/components/game/active-quiz';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameErrorBoundary, SocketErrorBoundary } from '@/components/error-boundaries';

export default function GamePage() {
  const params = useParams();
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
    selectedAnswer,
    handleAnswerSelect,
    handlePlayAgain,
    router,
  } = useGameLogic(gameId);

  // Redirect if missing required data
  if (!gameId || !playerId) {
    return <GameLoading message="Redirecting..." />;
  }

  // Show loading state while waiting for game data
  if (!currentGame) {
    return <GameLoading message="Loading game..." />;
  }

  // Game completed state
  if (gameCompleted || currentGame.status === GameStatus.COMPLETED) {
    return (
      <GameResults
        playerScore={playerScore}
        opponentScore={opponentScore}
        playerId={playerId}
        winner={winner}
        totalQuestions={GAME_CONFIG.QUESTIONS_PER_GAME}
        onPlayAgain={handlePlayAgain}
        onBackToHome={() => router.push('/')}
      />
    );
  }

  // Waiting for game to start
  if (isWaitingForOpponent || !currentQuestion) {
    return <GameWaiting isWaitingForOpponent={isWaitingForOpponent} />;
  }

  // Active quiz gameplay
  return (
    <ActiveQuiz
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      timeRemaining={timeRemaining}
      playerScore={playerScore}
      opponentScore={opponentScore}
      hasAnswered={hasAnswered}
      opponentHasAnswered={opponentHasAnswered}
      selectedAnswer={selectedAnswer}
      onAnswerSelect={handleAnswerSelect}
    />
  );
}
