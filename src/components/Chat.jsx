import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import './Chat.css';

const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner" />
  </div>
);

const Chat = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      loadChat();
    }
  }, [chatId]);

  const loadChat = async () => {
    try {
      const chat = await chatService.getChat(chatId);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStreamingMessage('');

    try {
      await chatService.sendMessage(
        chatId,
        input,
        // onChunk callback
        (chunk) => {
          setCurrentStreamingMessage(prev => prev + chunk);
        },
        // onDone callback
        () => {
          setMessages(prev => [...prev, { role: 'assistant', content: currentStreamingMessage }]);
          setCurrentStreamingMessage('');
          setIsLoading(false);
        },
        // onError callback
        (error) => {
          console.error('Error sending message:', error);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your message.' }]);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {currentStreamingMessage && (
          <div className="message assistant">
            <div className="message-content">{currentStreamingMessage}</div>
          </div>
        )}
        {isLoading && !currentStreamingMessage && <Spinner />}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Chat; 