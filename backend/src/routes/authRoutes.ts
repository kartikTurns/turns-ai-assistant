// Authentication routes
import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';

const router = Router();

/**
 * POST /api/auth/login
 * Login or create user based on businessId
 * Creates new user if doesn't exist, updates tokens and lastLogin if exists
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { businessId, accessToken, refreshToken } = req.body;

    // Validate required fields
    if (!businessId || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'businessId and accessToken are required'
      });
      return;
    }

    // Get client IP
    const clientIp = req.ip || req.socket.remoteAddress;

    // Login or create user
    const user = await userService.loginOrCreateUser(
      businessId,
      accessToken,
      refreshToken,
      clientIp
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        businessId: user.businessId,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.metadata.loginCount,
        createdAt: user.createdAt,
        tokenBalance: user.tokenBalance
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = await userService.getUserByBusinessId(businessId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }
    res.json({
      success: true,
      user: { businessId: user.businessId,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.metadata.loginCount,
        createdAt: user.createdAt,
        tokenBalance: user.tokenBalance }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
