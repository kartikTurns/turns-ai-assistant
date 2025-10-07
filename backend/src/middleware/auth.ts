// Authentication middleware - verifies businessId and accessToken from headers
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      businessId?: string;
      accessToken?: string;
      refreshToken?: string;
    }
  }
}

/**
 * Authentication middleware
 * Extracts businessId and accessToken from headers
 * Creates/updates user in database
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const accessToken = req.headers['x-access-token'] as string;
    const businessId = req.headers['x-business-id'] as string;
    const refreshToken = req.headers['x-refresh-token'] as string;

    // Check if auth headers are present
    if (!accessToken || !businessId) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing x-access-token or x-business-id headers'
      });
      return;
    }

    // Login or create user (upsert pattern)
    const clientIp = req.ip || req.socket.remoteAddress;
    await userService.loginOrCreateUser(
      businessId,
      accessToken,
      refreshToken,
      clientIp
    );

    // Attach to request object for use in routes
    req.businessId = businessId;
    req.accessToken = accessToken;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Optional auth middleware - doesn't block if no auth headers
 * Useful for endpoints that work with/without authentication
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const accessToken = req.headers['x-access-token'] as string;
  const businessId = req.headers['x-business-id'] as string;
  const refreshToken = req.headers['x-refresh-token'] as string;

  if (accessToken && businessId) {
    req.businessId = businessId;
    req.accessToken = accessToken;
    req.refreshToken = refreshToken;
  }

  next();
}
