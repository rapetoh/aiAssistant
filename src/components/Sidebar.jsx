import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  chats, 
  currentChatId, 
  onChatSelect, 
  onChatCreate, 
  onChatDelete 
}) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    try {
      await onChatCreate(newChatTitle);
      setNewChatTitle('');
      setIsCreatingChat(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button 
          className="new-chat-button"
          onClick={() => setIsCreatingChat(true)}
        >
          New Chat
        </button>
      </div>

      {isCreatingChat && (
        <form onSubmit={handleCreateChat} className="new-chat-form">
          <input
            type="text"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Enter chat title..."
            autoFocus
          />
          <div className="new-chat-buttons">
            <button type="submit">Create</button>
            <button type="button" onClick={() => setIsCreatingChat(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat._id}
            className={`chat-item ${currentChatId === chat._id ? 'active' : ''}`}
          >
            <button
              className="chat-title"
              onClick={() => onChatSelect(chat._id)}
            >
              {chat.title}
            </button>
            <button
              className="delete-chat"
              onClick={() => onChatDelete(chat._id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 