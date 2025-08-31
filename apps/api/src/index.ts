import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createAppRouter } from '@quiz-battle/trpc';
import {
  DatabaseGameRepository,
  DatabaseQuestionRepository,
  DatabaseAnswerRepository,
  DatabaseThemeRepository
} from '@quiz-battle/database';
import { setupSocketHandlers } from './socket/handlers';
import { configureSecurityMiddleware } from './middleware/security';
import { 
  createErrorMiddleware, 
  setupGlobalErrorHandlers, 
  requestIdMiddleware,
  globalErrorHandler
} from './middleware/error-handler';

// Load environment variables from database package
dotenv.config();

const app = express();
const server = createServer(app);

console.log('🔧 Environment - Client URL:', process.env.CLIENT_URL);

// Setup global error handlers first
setupGlobalErrorHandlers();

// Configure security middleware
const security = configureSecurityMiddleware();

// Request ID middleware (first to ensure all logs have request IDs)
app.use(requestIdMiddleware);

// Apply security headers first
app.use(security.helmet);

// Enable compression
app.use(security.compression);

// Request size limitation
app.use(security.requestSizeLimit);

// IP filtering
app.use(security.ipFilter);

// Security logging
app.use(security.securityLogger);

// Rate limiting (general)
app.use(security.rateLimit);

// Speed limiting (progressive delays)
app.use(security.speedLimit);

// Input sanitization
app.use(security.sanitizeInput);

// CORS configuration with enhanced security
app.use(cors(security.cors));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Create repository instances
const gameRepository = new DatabaseGameRepository();
const questionRepository = new DatabaseQuestionRepository();
const answerRepository = new DatabaseAnswerRepository();
const themeRepository = new DatabaseThemeRepository();

// Create tRPC router with repositories
const appRouter = createAppRouter(
  gameRepository,
  questionRepository,
  answerRepository,
  themeRepository
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API rate limiting for tRPC endpoints
app.use('/trpc', security.apiRateLimit);

// tRPC middleware
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
}));

// Socket.io setup with enhanced security
const io = new Server(server, {
  cors: security.cors,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  // Additional security options
  serveClient: false, // Don't serve the client files
  connectTimeout: 45000,
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Setup socket handlers with repositories
setupSocketHandlers(io, gameRepository, questionRepository, answerRepository);

// Error handling middleware (must be last)
app.use(createErrorMiddleware());

// Log server startup information
console.log('🔒 Security middleware configured:');
console.log('  - Request ID tracking');
console.log('  - Global error handlers');
console.log('  - Helmet security headers');
console.log('  - Rate limiting (100/15min general, 50/15min API, 60/min game)');
console.log('  - Input sanitization');
console.log('  - CORS protection');
console.log('  - Request compression');
console.log('  - Socket.IO security');
console.log('  - Centralized error handling');

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🔌 tRPC endpoints available at /trpc`);
});
