import { WebSocketServer, WebSocket } from 'ws';
import { RoomState, advanceStimulus, getCurrentStimulus, getGameProgress, resetPlayerResponses, checkSpeedIncrease } from './nback-engine';

interface Client {
  ws: WebSocket;
  roomId: string;
  userId: string;
}

interface GameState {
  room: RoomState;
  timer: NodeJS.Timeout | null;
  clients: Map<string, Client>;
}

const gameStates = new Map<string, GameState>();

export class GameWebSocketServer {
  private wss: WebSocketServer;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocket();
    console.log(`WebSocket server running on port ${port}`);
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid message format:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case 'join_room':
        this.handleJoinRoom(ws, payload);
        break;
      case 'leave_room':
        this.handleLeaveRoom(ws, payload);
        break;
      case 'submit_answer':
        this.handleSubmitAnswer(ws, payload);
        break;
      case 'start_game':
        this.handleStartGame(ws, payload);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  private handleJoinRoom(ws: WebSocket, payload: { roomId: string; userId: string }) {
    const { roomId, userId } = payload;

    // Find or create game state
    let gameState = gameStates.get(roomId);
    if (!gameState) {
      gameState = {
        room: null as any, // Should be set by server
        timer: null,
        clients: new Map(),
      };
      gameStates.set(roomId, gameState);
    }

    const clientId = `${userId}-${Date.now()}`;
    const client: Client = { ws, roomId, userId };
    gameState.clients.set(clientId, client);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'joined_room',
      payload: { clientId, roomId },
    }));

    // Broadcast player joined
    this.broadcastToRoom(roomId, {
      type: 'player_joined',
      payload: { userId },
    }, clientId);
  }

  private handleLeaveRoom(ws: WebSocket, payload: { roomId: string; userId: string }) {
    const { roomId, userId } = payload;

    // Remove client
    for (const [clientId, client] of gameStates.get(roomId)?.clients.entries() || []) {
      if (client.userId === userId && client.ws === ws) {
        gameStates.get(roomId)?.clients.delete(clientId);
        break;
      }
    }

    ws.send(JSON.stringify({
      type: 'left_room',
      payload: { roomId },
    }));
  }

  private handleSubmitAnswer(ws: WebSocket, payload: { roomId: string; userId: string; answer: boolean }) {
    const { roomId, userId, answer } = payload;
    const gameState = gameStates.get(roomId);

    if (!gameState || !gameState.room) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
      return;
    }

    // Here you would validate the answer using the game engine
    // For now, just broadcast the answer
    this.broadcastToRoom(roomId, {
      type: 'answer_submitted',
      payload: { userId, answer },
    });
  }

  private handleStartGame(ws: WebSocket, payload: { roomId: string }) {
    const { roomId } = payload;
    const gameState = gameStates.get(roomId);

    if (!gameState || !gameState.room) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
      return;
    }

    // Start the game loop
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }

    gameState.room.isRunning = true;
    gameState.timer = setInterval(() => {
      this.gameLoop(roomId);
    }, gameState.room.stimulusInterval);

    this.broadcastToRoom(roomId, {
      type: 'game_started',
      payload: { nValue: gameState.room.nValue },
    });
  }

  private gameLoop(roomId: string) {
    const gameState = gameStates.get(roomId);
    if (!gameState || !gameState.room || !gameState.room.isRunning) {
      return;
    }

    const room = gameState.room;

    // Advance stimulus
    advanceStimulus(room);
    resetPlayerResponses(room);

    // Check for speed increase
    checkSpeedIncrease(room);

    // Update timer if speed changed
    if (gameState.timer) {
      clearInterval(gameState.timer);
      gameState.timer = setInterval(() => {
        this.gameLoop(roomId);
      }, room.stimulusInterval);
    }

    const progress = getGameProgress(room);
    const currentStimulus = getCurrentStimulus(room);

    // Broadcast stimulus to all clients
    this.broadcastToRoom(roomId, {
      type: 'stimulus_updated',
      payload: {
        currentIndex: room.currentIndex,
        stimulus: currentStimulus,
        progress: progress.progress,
        isComplete: progress.isComplete,
        speedLevel: room.speedLevel,
        interval: room.stimulusInterval,
      },
    });

    if (progress.isComplete) {
      this.endGame(roomId);
    }
  }

  private endGame(roomId: string) {
    const gameState = gameStates.get(roomId);
    if (!gameState) return;

    gameState.room.isRunning = false;
    if (gameState.timer) {
      clearInterval(gameState.timer);
      gameState.timer = null;
    }

    this.broadcastToRoom(roomId, {
      type: 'game_ended',
      payload: {
        rankings: Array.from(gameState.room.players.entries())
          .sort((a, b) => b[1].score - a[1].score)
          .map(([userId, player], index) => ({
            userId,
            rank: index + 1,
            score: player.score,
            mistakes: player.mistakes,
          })),
      },
    });
  }

  private broadcastToRoom(roomId: string, message: any, excludeClientId?: string) {
    const gameState = gameStates.get(roomId);
    if (!gameState) return;

    const messageStr = JSON.stringify(message);

    for (const [clientId, client] of gameState.clients.entries()) {
      if (excludeClientId && clientId === excludeClientId) continue;
      
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  private handleDisconnect(ws: WebSocket) {
    // Find and remove client from all rooms
    for (const [roomId, gameState] of gameStates.entries()) {
      for (const [clientId, client] of gameState.clients.entries()) {
        if (client.ws === ws) {
          gameState.clients.delete(clientId);
          
          // Broadcast player left
          this.broadcastToRoom(roomId, {
            type: 'player_left',
            payload: { userId: client.userId },
          });

          // If no clients left, clean up
          if (gameState.clients.size === 0) {
            if (gameState.timer) {
              clearInterval(gameState.timer);
            }
            gameStates.delete(roomId);
          }
          
          break;
        }
      }
    }
  }

  public setRoomState(roomId: string, room: RoomState) {
    const gameState = gameStates.get(roomId);
    if (gameState) {
      gameState.room = room;
    }
  }

  public getGameState(roomId: string): GameState | undefined {
    return gameStates.get(roomId);
  }
}

// Singleton instance
let serverInstance: GameWebSocketServer | null = null;

export function getWebSocketServer(port: number = 8080): GameWebSocketServer {
  if (!serverInstance) {
    serverInstance = new GameWebSocketServer(port);
  }
  return serverInstance;
}
