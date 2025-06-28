import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import './Chat.css';
import { marked } from 'marked'; // For rendering markdown

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

    const userMessageContent = input.trim();
    const userMessage = { role: 'user', content: userMessageContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStreamingMessage('');

    try {
      await chatService.sendMessage(
        chatId,
        userMessageContent,
        // onChunk callback
        (chunk) => {
          setCurrentStreamingMessage(prev => prev + chunk);
        },
        // onDone callback
        (fullResponse) => {
          setMessages(prev => {
            // Only add the streaming message if it's not empty
            if (fullResponse) {
              return [...prev, { role: 'assistant', content: fullResponse }];
            } 
            return prev; // If empty, it means an error or no content, don't add
          });
          setCurrentStreamingMessage('');
          setIsLoading(false);
        },
        // onError callback
        (error) => {
          console.error('Error sending message:', error);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while processing your message. Please try again.' }]);
          setCurrentStreamingMessage(''); // Clear any partial streaming message
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your network connection or API key.' }]);
      setCurrentStreamingMessage(''); // Clear any partial streaming message
      setIsLoading(false);
    }
  };

  const handleExportChat = () => {
    if (!chatId || messages.length === 0) return;

    // Use the chatTitle prop if available, otherwise fallback to a generic name
    const fileName = `${chatTitle.replace(/[^a-z0-9]/gi, '_')}.txt`;
    const fileContent = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="chat-container">
      <div className="chat-actions-bar">
        <button onClick={handleExportChat} className="export-chat-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Chat
        </button>
      </div>
      <div className="messages-container">
        {isLoading && messages.length === 0 ? (
          <Spinner />
        ) : (
          messages.map((message, index) => (
            <div key={message._id || index} className={`message-row ${message.role}`}>
              <div className="avatar-wrapper">
                {message.role === 'user' ? <UserAvatar /> : <AssistantAvatar />}
              </div>
              <div className="message-bubble">
                <div 
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }}
                />
              </div>
            </div>
          ))
        )}
        {currentStreamingMessage && (
          <div className="message-row assistant">
            <div className="avatar-wrapper">
              <AssistantAvatar />
            </div>
            <div className="message-bubble">
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ __html: marked.parse(currentStreamingMessage) }}
              />
            </div>
          </div>
        )}
        {isLoading && currentStreamingMessage && (
          <div className="message-row assistant">
             <div className="avatar-wrapper">
              <AssistantAvatar />
            </div>
            <div className="message-bubble">
              <Spinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  );
};

export default Chat; 