import 'express-async-errors';
import dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import session from 'express-session';
const MySQLStore = require('express-mysql-session');

import { IApiResponse, ApiVersion } from './types';
import logger from './utils/logger';
import { errorHandler } from './utils/errors';
import { notFound } from './middleware/notFound';
import { initializeDatabase } from './database/init';

// Load environment variables
dotenv.config();

// Import versioned routes
import v1Routes from './routes/v1';

class SocietyBackendServer {
  private app: Application;
  private PORT: number;
  private HOST: string;

  constructor() {
    this.app = express();
    this.PORT = parseInt(process.env['PORT'] || '3000', 10);
    this.HOST = process.env['HOST'] || '0.0.0.0';
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {

    this.app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
      })
    );

    // CORS Configuration - Allow all origins
    this.app.use(cors({
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type', 'Accept-Ranges', 'X-Content-Type-Options'],
      optionsSuccessStatus: 200
    }));

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: parseInt('10000'), // 15 minutes
      max: parseInt('100000'),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000 / 60),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);
    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        // Only verify JSON if there's actual content and Content-Type is JSON
        if (buf && buf.length > 0) {
          const contentType = req.get('Content-Type') || '';
          // Only verify JSON parsing if Content-Type indicates JSON
          if (contentType.includes('application/json')) {
            try {
              const bodyString = buf.toString('utf8');
              // Remove BOM if present
              const cleanedBody = bodyString.replace(/^\uFEFF/, '');
              // Trim whitespace
              const trimmedBody = cleanedBody.trim();
              
              // Only parse if there's actual content after trimming
              if (trimmedBody.length > 0) {
                JSON.parse(trimmedBody);
              }
            } catch (error: any) {
              logger.error('JSON parsing error:', {
                message: error.message,
                path: req.path,
                method: req.method,
                contentType: req.get('Content-Type'),
                bodyPreview: buf.toString('utf8').substring(0, 200)
              });
              throw new Error(`Invalid JSON: ${error.message}`);
            }
          }
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Error handler for JSON parsing errors
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      if (
        error instanceof SyntaxError &&
        (error as any).status === 400 &&
        'body' in error
      ) {
        logger.error('JSON parsing error caught by middleware:', {
          message: error.message,
          path: req.path,
          method: req.method,
          contentType: req.get('Content-Type')
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body. Please check your request format.',
          code: 'JSON_PARSE_ERROR',
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    });

    // Security middleware
    this.app.use(mongoSanitize());
    this.app.use(xss());
    this.app.use(hpp());
    this.app.use(compression());

    // Session configuration - temporarily disabled MySQL store
    this.app.use(
      session({
        secret: process.env['SESSION_SECRET'] || 'fallback-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env['NODE_ENV'] === 'production',
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'strict',
        },
      })
    );

    // Request logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`, {
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        contentType: req.get('Content-Type')
      });
      
      // Log parsed body if available (after express.json has parsed it)
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
        const contentType = req.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          logger.debug('Request body parsed successfully', {
            path: req.path,
            bodyKeys: Object.keys(req.body)
          });
        }
      }
      
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      const response: IApiResponse = {
        success: true,
        message: 'Server is healthy',
        data: {
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env['NODE_ENV'] || 'development',
          version: '1.0.0',
        },
        version: 'v1',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    });

    // API Versioning
    this.app.use('/api/v1', v1Routes);

    // API Version information endpoint
    this.app.get('/api/versions', (_req: Request, res: Response) => {
      const response: IApiResponse<{ versions: ApiVersion[]; current: ApiVersion }> = {
        success: true,
        message: 'Available API versions',
        data: {
          versions: ['v1'],
          current: 'v1',
        },
        version: 'v1',
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    });

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      const response: IApiResponse = {
        success: true,
        message: 'Society Backend API',
        data: {
          name: 'Society Backend API',
          version: '1.0.0',
          description: 'Secure REST API for Society Management System',
          documentation: '/api/docs',
          health: '/health',
          versions: '/api/versions',
        },
        version: 'v1',
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);

    // Error handling middleware
    this.app.use(errorHandler);
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database and setup associations
      await initializeDatabase();
      this.setupGracefulShutdown();

      const server = this.app.listen(this.PORT, this.HOST, () => {
        logger.info(`Server running on port ${this.PORT} in ${process.env['NODE_ENV'] || 'development'} mode`);
        logger.info(`Health check available at: http://localhost:${this.PORT}/health`);
        logger.info(`API documentation available at: http://localhost:${this.PORT}/api/docs`);
      });

      server.on('error', (error: Error) => {
        logger.error('Server error:', error);
        process.exit(1);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create and start server
const server = new SocietyBackendServer();

if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;