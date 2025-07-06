import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import './Chat.css';
import { marked } from 'marked'; // For rendering markdown
import LoadingSpinner from './LoadingSpinner';
import { Link } from 'react-router-dom';

const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner" />
  </div>
);

// Basic Avatar components (can be extended with actual images/logic later)
const UserAvatar = () => (
  <div className="avatar user-avatar">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" />
    </svg>
  </div>
);

const AssistantAvatar = () => (
  <div className="avatar assistant-avatar">
    <LoadingSpinner size="small" color="accent" />
  </div>
);

const Chat = ({ chatId, chatTitle }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      loadChat();
    } else {
      // Clear messages if no chat is selected (e.g., navigated back to home)
      setMessages([]);
      setCurrentStreamingMessage('');
      setIsLoading(false);
    }
  }, [chatId]);

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const chat = await chatService.getChat(chatId);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error('Error loading chat:', error);
      // Display an error message in chat if load fails
      setMessages([{ role: 'assistant', content: 'Error loading chat history.' }]);
    } finally {
      setIsLoading(false);
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

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message immediately
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Add a placeholder assistant message that will be updated
      const placeholderMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, placeholderMessage]);

      // Send message and get streaming response
      await chatService.sendMessage(
        chatId,
        userMessage,
        (streamingContent) => {
          setCurrentStreamingMessage(streamingContent);
        },
        (finalContent) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = finalContent || 'No response received.';
            }
            return newMessages;
          });
          setCurrentStreamingMessage('');
        },
        (error) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = 'Sorry, I encountered an error. Please try again.';
            }
            return newMessages;
          });
          setCurrentStreamingMessage('');
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Update the placeholder message with error
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, I encountered an error. Please try again.';
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <LoadingSpinner size="large" color="primary" text="Loading chat..." />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-actions-bar">
        <button className="export-chat-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Chat
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message-row ${message.role}`}>
            {message.role === 'user' ? <UserAvatar /> : <AssistantAvatar />}
            <div className="message-bubble">
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ 
                  __html: marked(message.content || '') 
                }}
              />
            </div>
          </div>
        ))}
        
        {/* Show streaming message if there is one */}
        {currentStreamingMessage && (
          <div className="message-row assistant">
            <AssistantAvatar />
            <div className="message-bubble">
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ 
                  __html: marked(currentStreamingMessage) 
                }}
              />
            </div>
          </div>
        )}

        {/* Show loading indicator when waiting for response */}
        {isLoading && !currentStreamingMessage && (
          <div className="message-row assistant">
            <AssistantAvatar />
            <div className="message-bubble">
              <div className="message-content">
                <LoadingSpinner size="small" color="accent" text="Thinking..." />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Integrated Tip Line above input */}
      <div className="chat-input-tip-line">
        <span className="chat-input-tip-label">Tip:</span> You can <b >&nbsp;upload a file&nbsp;</b> in the <Link to="/documents" className="chat-input-tip-link">Documents</Link> section and chat about it here!
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading}>
          {isLoading ? (
            <LoadingSpinner size="small" color="primary" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default Chat; 