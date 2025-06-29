import api from './api';

export const chatService = {
  // Create a new chat
  createChat: async (title) => {
    const response = await api.post('/chat', { title });
    return response.data;
  },

  // Get all chats
  getChats: async () => {
    const response = await api.get('/chat');
    return response.data;
  },

  // Get a single chat
  getChat: async (chatId) => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },

  // Send a message with streaming support
  sendMessage: async (chatId, content, onChunk, onDone, onError) => {
    let fullResponseContent = '';
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${api.defaults.baseURL}/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          role: 'user',
          content,
        }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullResponseContent += data.chunk;
                if (typeof onChunk === 'function') onChunk(data.chunk);
              }
              if (data.done) {
                if (typeof onDone === 'function') onDone(fullResponseContent);
              }
              if (data.error) {
                if (typeof onError === 'function') onError(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if (typeof onError === 'function') onError(error.message);
    }
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
  },
}; 