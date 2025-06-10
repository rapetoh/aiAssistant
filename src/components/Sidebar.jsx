import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useTheme } from '../context/ThemeContext';

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
);

const Sidebar = ({ 
  chats = [], 
  currentChatId, 
  onChatSelect, 
  onChatCreate, 
  onChatDelete 
}) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    try {
      if (onChatCreate) {
        const chat = await onChatCreate(newChatTitle);
        setNewChatTitle('');
        setIsCreatingChat(false);
        if (chat && chat._id) navigate(`/chat/${chat._id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>AI Chat</h2>
        <div className="sidebar-header-actions">
          <button 
            className="theme-toggle-button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button 
            className="new-chat-button"
            onClick={() => setIsCreatingChat(true)}
          >
            New Chat
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
          Home
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Documents
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Settings
        </NavLink>
      </nav>

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
              onClick={() => navigate(`/chat/${chat._id}`)}
            >
              {chat.title}
            </button>
            <button
              className="delete-chat"
              onClick={() => onChatDelete && onChatDelete(chat._id)}
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