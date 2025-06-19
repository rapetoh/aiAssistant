import express from 'express';
import {
  createChat,
  getChats,
  getChat,
  addMessage,
  updateContext,
  deleteChat
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all chat routes
router.use(authenticate);

// Create a new chat
router.post('/', createChat);

// Get all chats
router.get('/', getChats);

// Get a single chat
router.get('/:id', getChat);

// Add a message to a chat
router.post('/:id/messages', addMessage);

// Update chat context
router.put('/:id/context', updateContext);

// Delete a chat
router.delete('/:id', deleteChat);

export default router; 