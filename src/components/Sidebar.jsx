import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Tooltip } from '@chakra-ui/react';

// Media query hook for desktop detection
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth >= 769);
  React.useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 769);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
}

// Icons (using simple SVGs for now, can be replaced with an icon library later)
const SunIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const MoonIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>);
const HomeIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const ChatIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>);
const DocumentIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const MatcherIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9h4v4h-4v-4zm0-5h4v4h-4V6z"/></svg>);
const SettingsIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>);
// New Login and Logout Icons
const LogInIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>);
const LogOutIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"></path><polyline points="17 17 22 12 17 7"></polyline><line x1="22" y1="12" x2="10" y2="12"></line></svg>);
const MenuIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
const CloseIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

const Sidebar = ({
  chats = [],
  currentChatId,
  onChatSelect, // This prop is now primarily handled by NavLink internal logic
  onChatCreate,
  onChatDelete
}) => {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth(); // Use auth context
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
          setIsMobileMenuOpen(false); // Close mobile menu after creating chat
        }
      }
    } catch (error) {
      console.error('Sidebar: Error creating chat:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page after logout
    setIsMobileMenuOpen(false); // Close mobile menu after logout
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false); // Close mobile menu when a nav item is clicked
  };

  // Chevron icon for collapse/expand
  const ChevronIcon = ({ collapsed }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="15 18 9 12 15 6"></polyline></svg>
  );

  // Only allow collapse/collapsed sidebar on desktop
  const canCollapse = isDesktop;
  const showCollapsed = canCollapse && isSidebarCollapsed;

  return (
    <>
      <div className={`sidebar${showCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          {/* Username at the very top, its own row */}
          {!showCollapsed && (
            <div className="sidebar-username">
              {user && user.username ? user.username+' & SmartMate' : 'SmartMate'}
            </div>
          )}
          {/* Action buttons row */}
          {showCollapsed ? (
            <>
              <div className="sidebar-collapsed-buttons">
                <button
                  className="sidebar-collapse-btn"
                  onClick={() => setIsSidebarCollapsed(v => !v)}
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  style={{ marginBottom: 12 }}
                >
                  <ChevronIcon collapsed={isSidebarCollapsed} />
                </button>
                <button
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
              </div>
              <div className="sidebar-collapsed-nav">
                <Tooltip label="Home" placement="right" hasArrow><NavLink to="/" className={({ isActive }) => isActive ? 'collapsed-nav-link active' : 'collapsed-nav-link'} end><HomeIcon /></NavLink></Tooltip>
                <Tooltip label="Documents" placement="right" hasArrow><NavLink to="/documents" className={({ isActive }) => isActive ? 'collapsed-nav-link active' : 'collapsed-nav-link'}><DocumentIcon /></NavLink></Tooltip>
                <Tooltip label="Matcher" placement="right" hasArrow><NavLink to="/matcher" className={({ isActive }) => isActive ? 'collapsed-nav-link active' : 'collapsed-nav-link'}><MatcherIcon /></NavLink></Tooltip>
                <Tooltip label="Settings" placement="right" hasArrow><NavLink to="/settings" className={({ isActive }) => isActive ? 'collapsed-nav-link active' : 'collapsed-nav-link'}><SettingsIcon /></NavLink></Tooltip>
              </div>
              {user && (
                <div className="sidebar-collapsed-logout">
                  <Tooltip label="Logout" placement="right" hasArrow>
                    <button
                      className="collapsed-nav-link"
                      onClick={handleLogout}
                      style={{ marginTop: 'auto' }}
                      title="Logout"
                    >
                      <LogOutIcon />
                    </button>
                  </Tooltip>
                </div>
              )}
            </>
          ) : (
            <div className="sidebar-header-row">
              {canCollapse && (
                <button
                  className="sidebar-collapse-btn"
                  onClick={() => setIsSidebarCollapsed(v => !v)}
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  style={{ marginRight: 10 }}
                >
                  <ChevronIcon collapsed={isSidebarCollapsed} />
                </button>
              )}
              <div className="sidebar-header-actions" style={{ flex: 1 }}>
                <button
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                {user && !isSidebarCollapsed && (
                  <button
                    className="new-chat-button"
                    onClick={() => setIsCreatingChat(true)}
                  >
                    <ChatIcon /> New Chat
                  </button>
                )}
                <button
                  className="mobile-menu-button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>
            </div>
          )}
        </div>

        {!showCollapsed && (
          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end onClick={handleNavClick}>
              <HomeIcon /> Home
            </NavLink>
            <NavLink to="/documents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
              <DocumentIcon /> Documents
            </NavLink>
            <NavLink to="/matcher" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
              <MatcherIcon /> Matcher
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
              <SettingsIcon /> Settings
            </NavLink>
          </nav>
        )}

        {!showCollapsed && isCreatingChat && (
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

        {!showCollapsed && user && (
          <div className="chat-list">
            {chats.map(chat => (
              <NavLink
                key={chat._id}
                to={`/chat/${chat._id}`}
                className={({ isActive }) =>
                  `nav-link chat-item ${isActive || currentChatId === chat._id ? 'active' : ''}`
                }
                style={{ textDecoration: 'none' }}
                onClick={handleNavClick}
              >
                <ChatIcon />
                <span className="chat-title">&nbsp;{chat.title}</span>
                <button
                  className="delete-chat"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigating when deleting
                    e.stopPropagation(); // Stop event from bubbling to NavLink
                    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
                      onChatDelete && onChatDelete(chat._id);
                    }
                  }}
                >
                  ×
                </button>
              </NavLink>
            ))}
          </div>
        )}

        {!showCollapsed && (
          <div className="sidebar-auth">
            {!user ? (
              <>
                <div className="auth-divider"></div>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                  <LogInIcon /> Login
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                  <SettingsIcon /> Register
                </NavLink>
              </>
            ) : (
              <button onClick={handleLogout} className="nav-link logout-button">
                <LogOutIcon /> Logout {user.username && `(${user.username})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <nav className="mobile-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end onClick={handleNavClick}>
            <HomeIcon /> Home
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
            <DocumentIcon /> Documents
          </NavLink>
          <NavLink to="/matcher" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
            <MatcherIcon /> Matcher
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
            <SettingsIcon /> Settings
          </NavLink>
        </nav>

        {user && (
          <>
            <div className="mobile-chat-section">
              <button
                className="mobile-new-chat-button"
                onClick={() => {
                  setIsCreatingChat(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <ChatIcon /> New Chat
              </button>

              <div className="mobile-chat-list">
                {chats.map((chat) => (
                  <NavLink
                    key={chat._id}
                    to={`/chat/${chat._id}`}
                    className={({ isActive }) => `nav-link chat-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <ChatIcon />
                    <span className="chat-title">{chat.title}</span>
                    <button
                      className="delete-chat"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
                          onChatDelete(chat._id);
                        }
                      }}
                    >
                      ×
                    </button>
                  </NavLink>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mobile-auth">
          {!user ? (
            <>
              <div className="auth-divider"></div>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                <LogInIcon /> Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={handleNavClick}>
                <SettingsIcon /> Register
              </NavLink>
            </>
          ) : (
            <button onClick={handleLogout} className="nav-link logout-button">
              <LogOutIcon /> Logout {user.username && `(${user.username})`}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 