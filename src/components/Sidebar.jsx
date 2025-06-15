import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useTheme } from '../context/ThemeContext';

// Icons (using simple SVGs for now, can be replaced with an icon library later)
const SunIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const MoonIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>);
const HomeIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const ChatIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>);
const DocumentIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const SettingsIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12h.09a1.65 1.65 0 0 0 1.51 1z"></path></svg>);


const Sidebar = ({ 
  chats = [], 
  currentChatId, 
  onChatSelect, // This prop is now primarily handled by NavLink internal logic
  onChatCreate, 
  onChatDelete 
}) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleCreateChat = async (e) => {
    e.preventDefault();
    console.log('Sidebar: Attempting to create chat with title:', newChatTitle);
    if (!newChatTitle.trim()) {
      console.log('Sidebar: New chat title is empty.');
      return;
    }

    try {
      if (onChatCreate) {
        console.log('Sidebar: Calling onChatCreate prop...');
        const chat = await onChatCreate(newChatTitle);
        console.log('Sidebar: Chat created via prop, response:', chat);
        setNewChatTitle('');
        setIsCreatingChat(false);
        if (chat && chat._id) {
          console.log('Sidebar: Navigating to new chat:', `/chat/${chat._id}`);
          navigate(`/chat/${chat._id}`);
        }
      }
    } catch (error) {
      console.error('Sidebar: Error creating chat:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Roch</h2>
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
            <ChatIcon /> New Chat
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
          <HomeIcon /> Home
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <DocumentIcon /> Documents
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <SettingsIcon /> Settings
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
          <NavLink
            key={chat._id}
            to={`/chat/${chat._id}`}
            className={({ isActive }) => 
              `chat-item ${isActive || currentChatId === chat._id ? 'active' : ''}`
            }
            style={{ textDecoration: 'none' }}
          >
            <ChatIcon />
            <span className="chat-title">&nbsp;{chat.title}</span>
            <button
              className="delete-chat"
              onClick={(e) => {
                e.preventDefault(); // Prevent navigating when deleting
                e.stopPropagation(); // Stop event from bubbling to NavLink
                onChatDelete && onChatDelete(chat._id);
              }}
            >
              ×
            </button>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 