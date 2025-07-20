import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@quiz-battle/shared';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketManager {
  private socket: TypedSocket | null = null;
  private url: string;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  connect(): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
    }) as TypedSocket;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
