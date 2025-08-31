import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  generateGameId,
  GameStatus,
  GameRepository,
  QuestionRepository,
  AnswerRepository
} from '@quiz-battle/shared';
import { GameManager } from '@quiz-battle/game-engine';
import {
  createSocketSecurityMiddleware,
  createEventRateLimitMiddleware,
  gameActionLimiter,
  generalEventLimiter,
  validateSocketInput,
  sanitizeSocketInput,
  connectionMonitor
} from '../middleware/socket-security';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

const gameRooms = new Map<string, Set<string>>(); // gameId -> Set of socket IDs
const playerSockets = new Map<string, string>(); // playerId -> socket ID

export function setupSocketHandlers(
  io: TypedServer,
  gameRepository: GameRepository,
  questionRepository: QuestionRepository,
  answerRepository: AnswerRepository
): void {
  // Apply socket security middleware
  io.use(createSocketSecurityMiddleware());

  // Create game manager with socket emitter and repositories
  const gameManager = new GameManager(
    (gameId: string, event: keyof ServerToClientEvents, data: any) => {
      io.to(gameId).emit(event as any, data);
    },
    gameRepository,
    questionRepository,
    answerRepository
  );

  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Player connected: ${socket.id}`);
    
    // Add connection to monitor
    connectionMonitor.addConnection(socket);
    function joinRoom(gameId: string) {
        socket.join(gameId);
        if (!gameRooms.has(gameId)) gameRooms.set(gameId, new Set());
        gameRooms.get(gameId)!.add(socket.id);
    }

    socket.on('player-join-matchmaking', async (data) => {
      // Rate limiting check
      if (!generalEventLimiter.isAllowed(socket.id, 'player-join-matchmaking')) {
        socket.emit('rate-limit-exceeded', {
          eventType: 'player-join-matchmaking',
          message: 'Too many matchmaking requests'
        });
        return;
      }

      // Update activity monitor
      connectionMonitor.updateActivity(socket.id);

      // Input validation and sanitization
      if (!validateSocketInput(data)) {
        socket.emit('error', {
          message: 'Invalid input detected',
          code: 'INVALID_INPUT'
        });
        return;
      }

      try {
        const sanitizedData = sanitizeSocketInput(data);
        const { themeId, playerId } = sanitizedData;

        // Additional validation
        if (!themeId || !playerId || typeof themeId !== 'string' || typeof playerId !== 'string') {
          socket.emit('error', {
            message: 'Missing or invalid required fields',
            code: 'VALIDATION_ERROR'
          });
          return;
        }

        // Store player socket mapping
        playerSockets.set(playerId, socket.id);

        // Look for existing waiting game
        const waitingGame = await gameRepository.findWaitingGameByTheme(themeId);

        if (waitingGame && waitingGame.player1Id !== playerId) {
          // Join existing game
          const gameId = waitingGame.id;

          // Update game with second player
          await gameRepository.updateGame(gameId, {
            player2Id: playerId,
            status: GameStatus.ACTIVE,
          });

          // Join socket room
          joinRoom(gameId);

          // Get updated game
          const game = await gameRepository.getGameById(gameId);
          if (game) {
            // Notify current player they joined
            socket.emit('player-join-game', {
              gameId,
              game,
            });

            // Notify opponent that player joined
            socket.to(gameId).emit('opponent-join-game', {
              game,
              opponent: { id: playerId, sessionId: socket.id, isReady: true, isConnected: true }
            });

            // Start the game
            setTimeout(async () => {
              const success = await gameManager.startGame(gameId);
              if (!success) {
                io.to(gameId).emit('error', {
                  message: 'Failed to start game',
                  code: 'GAME_START_ERROR'
                });
              }
            }, 1000); // 1 second delay before starting
          }
        }
        else {
          // Create new game
          const gameId = generateGameId();
          await gameRepository.createGame({ id: gameId, player1Id: playerId, themeId });

          // Join socket room
          joinRoom(gameId);
        }
      } catch (error) {
        console.error('Error in player-join-matchmaking:', error);
        socket.emit('error', {
          message: 'Failed to join matchmaking',
          code: 'MATCHMAKING_ERROR'
        });
      }
    });

    socket.on('player-submit-answer', async (data) => {
      // Game action rate limiting (stricter)
      if (!gameActionLimiter.isAllowed(socket.id, 'player-submit-answer')) {
        socket.emit('rate-limit-exceeded', {
          eventType: 'player-submit-answer',
          message: 'Too many answer submissions'
        });
        return;
      }

      // Update activity monitor
      connectionMonitor.updateActivity(socket.id);

      // Input validation and sanitization
      if (!validateSocketInput(data)) {
        socket.emit('error', {
          message: 'Invalid input detected',
          code: 'INVALID_INPUT'
        });
        return;
      }

      try {
        const sanitizedData = sanitizeSocketInput(data);
        const { gameId, playerId, selectedAnswer, responseTime } = sanitizedData;

        // Additional validation
        if (!gameId || !playerId || selectedAnswer === undefined || !responseTime || 
            typeof gameId !== 'string' || typeof playerId !== 'string' ||
            typeof selectedAnswer !== 'number' || typeof responseTime !== 'number') {
          socket.emit('error', {
            message: 'Missing or invalid required fields',
            code: 'VALIDATION_ERROR'
          });
          return;
        }

        // Validate answer index range
        if (selectedAnswer < 0 || selectedAnswer > 3) {
          socket.emit('error', {
            message: 'Invalid answer index',
            code: 'VALIDATION_ERROR'
          });
          return;
        }

        // Validate response time (prevent negative or impossibly fast times)
        if (responseTime < 100 || responseTime > 15000) {
          socket.emit('error', {
            message: 'Invalid response time',
            code: 'VALIDATION_ERROR'
          });
          return;
        }

        const success = await gameManager.submitAnswer(gameId, playerId, selectedAnswer);

        if (!success) {
          socket.emit('error', {
            message: 'Failed to submit answer',
            code: 'ANSWER_SUBMIT_ERROR'
          });
        }
      } catch (error) {
        console.error('Error in player-submit-answer:', error);
        socket.emit('error', {
          message: 'Failed to submit answer',
          code: 'ANSWER_SUBMIT_ERROR'
        });
      }
    });

    socket.on('request-game-state', async (data) => {
      // Rate limiting check
      if (!generalEventLimiter.isAllowed(socket.id, 'request-game-state')) {
        socket.emit('rate-limit-exceeded', {
          eventType: 'request-game-state',
          message: 'Too many state sync requests'
        });
        return;
      }

      // Update activity monitor
      connectionMonitor.updateActivity(socket.id);

      // Input validation and sanitization
      if (!validateSocketInput(data)) {
        socket.emit('error', {
          message: 'Invalid input detected',
          code: 'INVALID_INPUT'
        });
        return;
      }

      try {
        const sanitizedData = sanitizeSocketInput(data);
        const { gameId, playerId } = sanitizedData;

        // Additional validation
        if (!gameId || !playerId || typeof gameId !== 'string' || typeof playerId !== 'string') {
          socket.emit('error', {
            message: 'Missing or invalid required fields',
            code: 'VALIDATION_ERROR'
          });
          return;
        }

        await gameManager.syncGameState(gameId, playerId);
      } catch (error) {
        console.error('Error in request-game-state:', error);
        socket.emit('error', {
          message: 'Failed to sync game state',
          code: 'SYNC_ERROR'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Player disconnected: ${socket.id}`);
      
      // Clean up connection monitor
      connectionMonitor.removeConnection(socket.id);

      // Clean up player socket mapping
      for (const [playerId, socketId] of playerSockets.entries()) {
        if (socketId === socket.id) {
          playerSockets.delete(playerId);
          break;
        }
      }

      // Clean up game rooms
      for (const [gameId, socketIds] of gameRooms.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);

          // If room is empty, clean it up
          if (socketIds.size === 0) {
            gameRooms.delete(gameId);
          } else {
            // Notify remaining players about disconnection
            socket.to(gameId).emit('error', {
              message: 'Opponent disconnected',
              code: 'PLAYER_DISCONNECTED'
            });
          }
          break;
        }
      }
    });
  });
}
