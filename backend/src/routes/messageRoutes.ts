// Message API routes - for saving messages after streaming
import { Router, Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/messages
 * Save a message to a chat (called by frontend after streaming completes)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { chatId, role, content, toolUses, tokens, model } = req.body;

    if (!chatId || !role || !content) {
      res.status(400).json({
        success: false,
        error: 'chatId, role, and content are required'
      });
      return;
    }

    const message = await messageService.saveMessage(
      chatId,
      businessId,
      role,
      content,
      {
        toolUses,
        tokens,
        model
      }
    );

    res.json({
      success: true,
      message: {
        id: message.id,
        chatId: message.chatId.toString(),
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        toolUses: message.toolUses
      }
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
