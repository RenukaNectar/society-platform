import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

import { IAuthRequest } from '../types';
import { AppError } from '../utils/errors';
import { findUserById } from '../services/UserService';

interface JwtPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
  district_id?: string;
  state_id?: string;
  role?: string;
  role_id?: string;
  name?: string;
  iat: number;
  exp: number;
}

// Authenticate JWT token
export const authenticateToken = async (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      throw new AppError('Access token required', 401);
    }
    
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JwtPayload;
    
    if (!decoded.userId) {
      throw new AppError('Invalid token: missing user ID', 401);
    }
    
    // Get user from database
    const user = await findUserById(decoded.userId);
    if (!user) {
      throw new AppError(`User not found with ID: ${decoded.userId}`, 404);
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 401);
    }

    const tokenVersion = decoded.tokenVersion ?? 0;
    if ((user as any).token_version !== tokenVersion) {
      throw new AppError('Session expired. Please login again.', 401);
    }

    // Set user info in request
    req.user = {
      userId: user.id,
      email: user.email,
      role_id: user.role_id,
      role: user.role?.name || decoded.role,
      district_id: user.district_id || decoded.district_id,
      state_id: user.state_id || decoded.state_id,
      is_hq: !!(user as any).is_hq
    };
    console.log(req.user);
    next();
  } catch (error: any) {
    console.log('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else if (error instanceof AppError) {
      // If it's already an AppError, pass it through
      next(error);
    } else {
      // For unexpected errors, provide more context
      const errorMessage = error?.message || 'Authentication failed';
      next(new AppError(`Authentication error: ${errorMessage}`, error?.statusCode || 500));
    }
  }
};

// Validate request using express-validator
export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    next(new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400));
  } else {
    next();
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JwtPayload;
      const user = await findUserById(decoded.userId);
      
      if (user && user.is_active) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role?.name,
          role_id: user.role_id,
          district_id: user.district_id,
          state_id: user.state_id,
          is_hq: !!(user as any).is_hq
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting for authentication endpoints
// export const authRateLimit = {
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again later.',
//     retryAfter: 15
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// };

// Session authentication (alternative to JWT)
export const authenticateSession = (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.session || !(req.session as any).user_id) {
      throw new AppError('Session authentication required', 401);
    }

    // In a real application, you would verify the session
    // For now, we'll just continue
    next();
  } catch (error) {
    next(error);
  }
}; 