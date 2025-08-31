import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import compression from 'compression';

// Rate limiting configuration
export const createRateLimitMiddleware = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(((req as any).rateLimit?.resetTime || Date.now()) / 1000)
      });
    }
  });
};

// API-specific rate limiting (stricter)
export const createApiRateLimitMiddleware = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 API requests per windowMs
    message: {
      error: 'API rate limit exceeded',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'Too many API requests from this IP, please try again later.',
        retryAfter: Math.round(((req as any).rateLimit?.resetTime || Date.now()) / 1000)
      });
    }
  });
};

// Game-specific rate limiting (very strict for game actions)
export const createGameRateLimitMiddleware = () => {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 game actions per minute (1 per second)
    message: {
      error: 'Game action rate limit exceeded',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Game action rate limit exceeded',
        message: 'Too many game actions, please slow down.',
        retryAfter: Math.round(((req as any).rateLimit?.resetTime || Date.now()) / 1000)
      });
    }
  });
};

// Speed limiting (progressive delays)
export const createSpeedLimitMiddleware = () => {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 5000, // Maximum delay of 5 seconds
    skipFailedRequests: false,
    skipSuccessfulRequests: false
  });
};

// Security headers configuration
export const createHelmetMiddleware = () => {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for development
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Disable for Socket.IO compatibility
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection
    xssFilter: true,
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },
    // X-Download-Options
    ieNoOpen: true,
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: false
  });
};

// CORS configuration with security considerations
export const createCorsConfig = () => {
  const allowedOrigins = [
    'http://localhost:3000', // Development frontend
    'http://localhost:3001', // Alternative development port
    process.env.FRONTEND_URL, // Production frontend URL
  ].filter(Boolean); // Remove undefined values

  return {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Socket-ID'
    ],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    maxAge: 86400 // 24 hours preflight cache
  };
};

// Compression middleware
export const createCompressionMiddleware = () => {
  return compression({
    filter: (req: Request, res: Response) => {
      // Don't compress responses if the request includes a cache-control header to prevent compression
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Use compression filter function
      return compression.filter(req, res);
    },
    level: 6, // Compression level (1-9, 6 is default balance)
    threshold: 1024, // Only compress responses larger than 1KB
  });
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize all string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Request logging middleware for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log suspicious activity
  const suspiciousPatterns = [
    /(\<script.*?\>)|(\<\/script\>)/gi,
    /(javascript:)/gi,
    /(data:text\/html)/gi,
    /(vbscript:)/gi,
    /(onload=)/gi,
    /(onerror=)/gi,
    /(\<iframe.*?\>)/gi,
  ];

  const userAgent = req.get('User-Agent') || '';
  const requestData = JSON.stringify({ body: req.body, query: req.query, params: req.params });
  
  // Check for suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(requestData) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    console.warn('🚨 SUSPICIOUS REQUEST DETECTED', {
      ip: req.ip,
      userAgent,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      data: requestData
    });
  }

  // Enhanced logging for security events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    if (logLevel === 'error' || isSuspicious) {
      console.error('🔒 Security Event:', logData);
    } else {
      console.log('📊 Request:', logData);
    }
  });

  next();
};

// Request size limitation
export const createRequestSizeLimiter = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const maxSize = 1024 * 1024; // 1MB limit
    
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        message: 'Request size exceeds 1MB limit'
      });
    }
    
    next();
  };
};

// IP whitelisting/blacklisting (basic implementation)
export const createIpFilter = () => {
  const blacklistedIPs = new Set<string>([
    // Add known bad IPs here
  ]);

  const whitelistedIPs = new Set<string>([
    '127.0.0.1',
    '::1',
    // Add trusted IPs here
  ]);

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || 'unknown';

    if (blacklistedIPs.has(clientIP)) {
      console.warn(`🚫 Blocked request from blacklisted IP: ${clientIP}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address has been blocked'
      });
    }

    // In production, you might want to implement whitelist-only access for admin endpoints
    next();
  };
};

// Export all security middleware as a single configuration function
export const configureSecurityMiddleware = () => ({
  helmet: createHelmetMiddleware(),
  compression: createCompressionMiddleware(),
  rateLimit: createRateLimitMiddleware(),
  apiRateLimit: createApiRateLimitMiddleware(),
  gameRateLimit: createGameRateLimitMiddleware(),
  speedLimit: createSpeedLimitMiddleware(),
  cors: createCorsConfig(),
  sanitizeInput,
  securityLogger,
  requestSizeLimit: createRequestSizeLimiter(),
  ipFilter: createIpFilter()
});