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
      provider: provider || 'cohere',
      user: req.user.id // Associate chat with the logged-in user
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
    const chats = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Error getting chats', error: error.message });
  }
};

// Get a single chat
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
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
    const userChat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!userChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    // Add user message
    userChat.messages.push({ role, content });
    await userChat.save();
    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let fullResponse = '';
    try {
      // Fetch the user's most recent document (e.g., resume)
      const latestDoc = await Document.findOne({ user: req.user.id }).sort({ uploadDate: -1 });
      console.log('Latest document found:', latestDoc ? `Title: ${latestDoc.title}, Content length: ${latestDoc.content?.length || 0}` : 'No document found');
      
      let contextPrefix = '';
      if (latestDoc && latestDoc.content) {
        // Truncate resume content to prevent large payloads
        const MAX_RESUME_LENGTH = 1000; // Limit to 1000 characters
        const truncatedContent = latestDoc.content.length > MAX_RESUME_LENGTH 
          ? latestDoc.content.substring(0, MAX_RESUME_LENGTH) + '...'
          : latestDoc.content;
        contextPrefix = `User Resume/Profile:\n${truncatedContent}\n\n`;
        console.log('Resume context prefix created, length:', contextPrefix.length);
        console.log('Resume context preview:', contextPrefix.substring(0, 200) + '...');
      } else {
        console.log('No resume content available to include');
      }
      
      // Limit message history to prevent large payloads
      // Only include the last 4 messages (2 user, 2 assistant) plus context
      const recentMessages = userChat.messages.slice(-4);
      console.log('Recent messages count:', recentMessages.length);
      
      // Prepend the document content to the first user message
      const messagesWithContext = [...recentMessages];
      if (contextPrefix && messagesWithContext.length > 0) {
        const firstUserMsgIdx = messagesWithContext.findIndex(m => m.role === 'user');
        console.log('First user message index:', firstUserMsgIdx);
        if (firstUserMsgIdx !== -1) {
          const originalContent = messagesWithContext[firstUserMsgIdx].content;
          messagesWithContext[firstUserMsgIdx] = {
            ...messagesWithContext[firstUserMsgIdx],
            content: `${contextPrefix}${originalContent}`
          };
          console.log('Updated first user message with resume context. Original length:', originalContent.length, 'New length:', messagesWithContext[firstUserMsgIdx].content.length);
        } else {
          console.log('No user message found to prepend resume context to');
        }
      }
      
      // Clean messages: ensure all have role/content and filter out error messages
      const cleanedMessages = messagesWithContext
        .filter(m => m.role && m.content && m.content !== 'Sorry, I encountered an error while processing your request.' && m.content !== 'Sorry, I encountered an error while processing your request. Please try again.')
        .map(m => ({ role: m.role, content: m.content }));
      
      console.log('Cleaned messages count:', cleanedMessages.length);
      console.log('Cleaned messages:', cleanedMessages.map(m => ({ role: m.role, contentLength: m.content.length, contentPreview: m.content.substring(0, 100) + '...' })));
      
      // If no valid messages remain, create a message with the resume context and the current user message
      let finalMessages = cleanedMessages;
      if (finalMessages.length === 0) {
        console.log('No valid messages found, creating message with resume context');
        const userMessage = { role: 'user', content: content };
        if (contextPrefix) {
          userMessage.content = `${contextPrefix}${content}`;
        }
        finalMessages = [userMessage];
        console.log('Created fallback message with resume context');
      }
      
      // Log the payload size for debugging
      const payloadSize = JSON.stringify(finalMessages).length;
      console.log(`Sending payload to Cohere API: ${payloadSize} bytes`);
      
      // Get AI response using the specified provider or chat's default
      const aiResponse = await aiService.generateResponse(
        finalMessages,
        provider || userChat.provider,
        (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      );
      // Add AI response to chat history only if we got a response
      if (fullResponse) {
        userChat.messages.push({ role: 'assistant', content: fullResponse });
        await userChat.save();
      }
      // Send end of stream
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Log the actual Cohere error response if available
      if (error.response && error.response.data) {
        console.error('Cohere API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Only add error message if we haven't sent any response yet
      if (!fullResponse) {
        userChat.messages.push({ 
          role: 'assistant', 
          content: 'Sorry, I encountered an error while processing your request. Please try again.' 
        });
        await userChat.save();
      }
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
    const userChat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!userChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    // Verify all documents exist
    const documents = await Document.find({ _id: { $in: documentIds } });
    if (documents.length !== documentIds.length) {
      return res.status(400).json({ message: 'One or more documents not found' });
    }
    userChat.context.documents = documentIds;
    userChat.context.lastContextUpdate = Date.now();
    await userChat.save();
    res.json(userChat);
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ message: 'Error updating context', error: error.message });
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Error deleting chat', error: error.message });
  }
}; 