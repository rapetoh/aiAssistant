import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chat';

export const chatService = {
  // Create a new chat
  createChat: async (title) => {
    const response = await axios.post(API_URL, { title });
    return response.data;
  },

  // Get all chats
  getChats: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // Get a single chat
  getChat: async (chatId) => {
    const response = await axios.get(`${API_URL}/${chatId}`);
    return response.data;
  },

  // Send a message with streaming support
  sendMessage: async (chatId, content, onChunk, onDone, onError) => {
    let fullResponseContent = ''; // Accumulate the full response here

    try {
      const response = await fetch(`${API_URL}/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
                fullResponseContent += data.chunk; // Accumulate chunks
                onChunk(data.chunk);
              }
              if (data.done) {
                onDone(fullResponseContent); // Pass the accumulated full response
              }
              if (data.error) {
                onError(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error.message);
    }
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    const response = await axios.delete(`${API_URL}/${chatId}`);
    return response.data;
  },
}; 