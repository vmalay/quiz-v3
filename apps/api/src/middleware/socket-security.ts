import { Socket } from 'socket.io';

// Rate limiting for Socket.IO events
class SocketRateLimiter {
  private rateLimits = new Map<string, Map<string, number[]>>();

  constructor(
    private readonly maxRequests: number = 30,
    private readonly windowMs: number = 60 * 1000 // 1 minute
  ) {}

  isAllowed(socketId: string, event: string): boolean {
    const now = Date.now();
    const key = `${socketId}:${event}`;
    
    if (!this.rateLimits.has(socketId)) {
      this.rateLimits.set(socketId, new Map());
    }
    
    const socketLimits = this.rateLimits.get(socketId)!;
    
    if (!socketLimits.has(event)) {
      socketLimits.set(event, []);
    }
    
    const timestamps = socketLimits.get(event)!;
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    
    socketLimits.set(event, validTimestamps);
    
    // Check if limit exceeded
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    return true;
  }

  cleanup(socketId: string): void {
    this.rateLimits.delete(socketId);
  }

  getStats(socketId: string, event: string): { count: number; resetTime: number } {
    const socketLimits = this.rateLimits.get(socketId);
    if (!socketLimits || !socketLimits.has(event)) {
      return { count: 0, resetTime: Date.now() + this.windowMs };
    }

    const timestamps = socketLimits.get(event)!;
    const now = Date.now();
    const validTimestamps = timestamps.filter(timestamp => 
      now - timestamp < this.windowMs
    );

    const oldestTimestamp = validTimestamps[0] || now;
    const resetTime = oldestTimestamp + this.windowMs;

    return { count: validTimestamps.length, resetTime };
  }
}

// Different rate limiters for different types of events
export const gameActionLimiter = new SocketRateLimiter(60, 60 * 1000); // 60 actions per minute
export const generalEventLimiter = new SocketRateLimiter(120, 60 * 1000); // 120 events per minute
export const connectionLimiter = new SocketRateLimiter(10, 60 * 1000); // 10 connection events per minute

// Socket security middleware
export const createSocketSecurityMiddleware = () => {
  return (socket: Socket, next: (err?: Error) => void) => {
    const clientIP = socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'] || '';
    
    console.log('🔌 Socket connection attempt:', {
      id: socket.id,
      ip: clientIP,
      userAgent: userAgent.substring(0, 100), // Truncate for logging
      timestamp: new Date().toISOString()
    });

    // Basic validation
    if (!socket.handshake.headers.origin) {
      console.warn('🚨 Socket connection rejected: No origin header');
      return next(new Error('Origin header required'));
    }

    // Check connection rate limit
    if (!connectionLimiter.isAllowed(clientIP, 'connection')) {
      console.warn('🚨 Socket connection rejected: Rate limit exceeded', { ip: clientIP });
      return next(new Error('Connection rate limit exceeded'));
    }

    next();
  };
};

// Rate limiting middleware for specific events
export const createEventRateLimitMiddleware = (limiter: SocketRateLimiter, eventType: string) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    const clientIP = socket.handshake.address;
    
    if (!limiter.isAllowed(socket.id, eventType)) {
      const stats = limiter.getStats(socket.id, eventType);
      const resetTime = Math.round((stats.resetTime - Date.now()) / 1000);
      
      console.warn('🚨 Socket event rate limit exceeded:', {
        socketId: socket.id,
        ip: clientIP,
        eventType,
        count: stats.count,
        resetTime
      });
      
      socket.emit('rate-limit-exceeded', {
        eventType,
        message: `Rate limit exceeded for ${eventType}`,
        resetTime
      });
      
      return next(new Error('Rate limit exceeded'));
    }
    
    next();
  };
};

// Input validation and sanitization for socket events
export const validateSocketInput = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    return true; // Allow primitive types
  }

  const checkForXSS = (value: any): boolean => {
    if (typeof value === 'string') {
      // Check for common XSS patterns
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
      ];
      
      return !xssPatterns.some(pattern => pattern.test(value));
    }
    
    if (Array.isArray(value)) {
      return value.every(checkForXSS);
    }
    
    if (value && typeof value === 'object') {
      return Object.values(value).every(checkForXSS);
    }
    
    return true;
  };

  return checkForXSS(data);
};

// Sanitize socket input data
export const sanitizeSocketInput = (data: any): any => {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeSocketInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeSocketInput(value);
    }
    return sanitized;
  }
  
  return data;
};

// Connection monitoring
export class SocketConnectionMonitor {
  private connections = new Map<string, {
    connectedAt: number;
    lastActivity: number;
    eventCount: number;
    ip: string;
  }>();

  addConnection(socket: Socket): void {
    const now = Date.now();
    this.connections.set(socket.id, {
      connectedAt: now,
      lastActivity: now,
      eventCount: 0,
      ip: socket.handshake.address
    });
  }

  updateActivity(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActivity = Date.now();
      connection.eventCount++;
    }
  }

  removeConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      const duration = Date.now() - connection.connectedAt;
      console.log('🔌 Socket disconnected:', {
        socketId,
        ip: connection.ip,
        duration: Math.round(duration / 1000) + 's',
        eventCount: connection.eventCount
      });
    }
    
    this.connections.delete(socketId);
    
    // Cleanup rate limiters
    gameActionLimiter.cleanup(socketId);
    generalEventLimiter.cleanup(socketId);
  }

  getConnectionStats(): {
    totalConnections: number;
    averageEvents: number;
    oldestConnection: number;
  } {
    const now = Date.now();
    const connections = Array.from(this.connections.values());
    
    if (connections.length === 0) {
      return { totalConnections: 0, averageEvents: 0, oldestConnection: 0 };
    }
    
    const totalEvents = connections.reduce((sum, conn) => sum + conn.eventCount, 0);
    const averageEvents = totalEvents / connections.length;
    const oldestConnection = Math.min(...connections.map(conn => now - conn.connectedAt));
    
    return {
      totalConnections: connections.length,
      averageEvents,
      oldestConnection
    };
  }
}

export const connectionMonitor = new SocketConnectionMonitor();