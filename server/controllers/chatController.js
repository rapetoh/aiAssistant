import Chat from '../models/Chat.js';
import Document from '../models/Document.js';
import aiService from '../services/aiService.js';

// Create a new chat
export const createChat = async (req, res) => {
  try {
    const { title, provider } = req.body;
    const chat = new Chat({
      title: title || 'New Chat',
      messages: [],
      provider: provider || 'openai' // Store the AI provider preference
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Error creating chat', error: error.message });
  }
};

// Get all chats
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Error getting chats', error: error.message });
  }
};

// Get a single chat
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ message: 'Error getting chat', error: error.message });
  }
};

// Add a message to a chat
export const addMessage = async (req, res) => {
  try {
    const { role, content, provider } = req.body;
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add user message
    chat.messages.push({ role, content });
    await chat.save();
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullResponse = '';
    
    try {
      // Get AI response using the specified provider or chat's default
      const aiResponse = await aiService.generateResponse(
        chat.messages,
        provider || chat.provider,
        (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );
      
      // Add AI response to chat history
      chat.messages.push({ role: 'assistant', content: fullResponse });
      await chat.save();
      
      // Send end of stream
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error generating AI response:', error);
      chat.messages.push({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.' 
      });
      await chat.save();
      res.write(`data: ${JSON.stringify({ error: 'Error generating response' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Error adding message', error: error.message });
  }
};

// Update chat context with documents
export const updateContext = async (req, res) => {
  try {
    const { documentIds } = req.body;
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify all documents exist
    const documents = await Document.find({ _id: { $in: documentIds } });
    if (documents.length !== documentIds.length) {
      return res.status(400).json({ message: 'One or more documents not found' });
    }

    chat.context.documents = documentIds;
    chat.context.lastContextUpdate = Date.now();
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ message: 'Error updating context', error: error.message });
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Error deleting chat', error: error.message });
  }
}; 