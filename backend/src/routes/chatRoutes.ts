// Chat API routes
import { Router, Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { messageService } from '../services/messageService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/chats
 * Get all chats for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const limit = parseInt(req.query.limit as string) || 50;

    const chats = await chatService.getUserChats(businessId, limit);

    res.json({
      success: true,
      chats: chatService.convertToFrontendFormat(chats)
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/chats
 * Create a new chat
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { title } = req.body;

    const chat = await chatService.createChat(businessId, title || 'New Chat');

    res.json({
      success: true,
      chat: {
        id: chat.id,
        title: chat.title,
        messages: [],
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chats/:chatId
 * Get a specific chat with all its messages
 */
router.get('/:chatId', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { chatId } = req.params;

    const chat = await chatService.getChatById(chatId, businessId);

    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
      return;
    }

    const messages = await messageService.getChatMessages(chatId, businessId);

    res.json({
      success: true,
      chat: {
        id: chat.id,
        title: chat.title,
        messages: messageService.convertToFrontendFormat(messages),
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/chats/:chatId
 * Update chat title
 */
router.put('/:chatId', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Title is required'
      });
      return;
    }

    const chat = await chatService.updateChatTitle(chatId, title, businessId);

    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
      return;
    }

    res.json({
      success: true,
      chat: {
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chat',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/chats/:chatId
 * Delete a chat and all its messages
 */
router.delete('/:chatId', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { chatId } = req.params;

    const deleted = await chatService.deleteChat(chatId, businessId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chats/:chatId/messages
 * Get all messages for a specific chat
 */
router.get('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { chatId } = req.params;

    const messages = await messageService.getChatMessages(chatId, businessId);

    res.json({
      success: true,
      messages: messageService.convertToFrontendFormat(messages)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
