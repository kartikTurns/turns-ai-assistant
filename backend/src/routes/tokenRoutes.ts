// Token management routes
import { Router, Request, Response } from 'express';
import { tokenService } from '../services/tokenService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/tokens/balance
 * Get user's token balance
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;

    const balance = await tokenService.getTokenBalance(businessId);

    if (balance === null) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      balance,
      formattedBalance: balance.toLocaleString()
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token balance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tokens/stats
 * Get user's token usage statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;

    const stats = await tokenService.getTokenStats(businessId);

    if (!stats) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      stats: {
        balance: stats.balance,
        balanceFormatted: stats.balance.toLocaleString(),
        tokensUsed: stats.tokensUsed,
        tokensUsedFormatted: stats.tokensUsed.toLocaleString(),
        percentageUsed: stats.percentageUsed,
        initialBalance: 1000000,
        initialBalanceFormatted: '1,000,000'
      }
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tokens/add
 * Add tokens to user balance (admin/top-up)
 */
router.post('/add', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
      return;
    }

    const result = await tokenService.addTokens(businessId, amount);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.message
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      newBalance: result.newBalance,
      newBalanceFormatted: result.newBalance?.toLocaleString()
    });
  } catch (error) {
    console.error('Error adding tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tokens',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
