import { Server, Socket } from 'socket.io';
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  generateGameId,
  GameStatus
} from '@quiz-battle/shared';
import { 
  findWaitingGameByTheme, 
  createGame, 
  updateGame,
  getGameById
} from '@quiz-battle/database';
import { GameManager } from '@quiz-battle/game-engine';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

const gameRooms = new Map<string, Set<string>>(); // gameId -> Set of socket IDs
const playerSockets = new Map<string, string>(); // playerId -> socket ID

export function setupSocketHandlers(io: TypedServer): void {
  // Create game manager with socket emitter
  const gameManager = new GameManager((gameId: string, event: keyof ServerToClientEvents, data: any) => {
    io.to(gameId).emit(event as any, data);
  });

  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    socket.on('player-join-matchmaking', async (data) => {
      try {
        const { themeId, playerId } = data;
        
        // Store player socket mapping
        playerSockets.set(playerId, socket.id);

        // Look for existing waiting game
        const waitingGame = await findWaitingGameByTheme(themeId);

        if (waitingGame && waitingGame.player1Id !== playerId) {
          // Join existing game
          const gameId = waitingGame.id;
          
          // Update game with second player
          await updateGame(gameId, {
            player2Id: playerId,
            status: GameStatus.ACTIVE,
          });

          // Join socket room
          socket.join(gameId);
          if (!gameRooms.has(gameId)) {
            gameRooms.set(gameId, new Set());
          }
          gameRooms.get(gameId)!.add(socket.id);

          // Get updated game
          const updatedGame = await getGameById(gameId);
          if (updatedGame) {
            // Cast to proper types
            const gameData = {
              ...updatedGame,
              status: updatedGame.status as GameStatus,
              themeId: updatedGame.themeId!,
              player2Id: updatedGame.player2Id || undefined,
              winnerId: updatedGame.winnerId || undefined,
              completedAt: updatedGame.completedAt || undefined,
            };

            // Notify current player they joined
            socket.emit('player-join-game', { 
              gameId, 
              game: gameData 
            });

            // Notify opponent that player joined
            socket.to(gameId).emit('opponent-join-game', { 
              game: gameData,
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
        } else {
          // Create new game
          const gameId = generateGameId();
          const newGame = await createGame({
            id: gameId,
            player1Id: playerId,
            themeId,
          });

          // Join socket room
          socket.join(gameId);
          if (!gameRooms.has(gameId)) {
            gameRooms.set(gameId, new Set());
          }
          gameRooms.get(gameId)!.add(socket.id);

          // Cast to proper types
          const gameData = {
            ...newGame,
            status: newGame.status as GameStatus,
            themeId: newGame.themeId!,
            player2Id: newGame.player2Id || undefined,
            winnerId: newGame.winnerId || undefined,
            completedAt: newGame.completedAt || undefined,
          };

          // Notify player they created the game
          socket.emit('player-create-game', { 
            gameId, 
            game: gameData 
          });
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
      try {
        const { gameId, playerId, selectedAnswer, responseTime } = data;
        
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
      try {
        const { gameId, playerId } = data;
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