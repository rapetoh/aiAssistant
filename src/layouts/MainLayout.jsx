import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useColorModeValue } from '@chakra-ui/react';
import Sidebar from '../components/Sidebar';
import { chatService } from '../services/chatService';

const MainLayout = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const mainBg = useColorModeValue('white', '#1A202C'); // Light: white, Dark: gray.800

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    // Set currentChatId from URL if on chat page
    const match = location.pathname.match(/^\/chat\/(.+)$/);
    if (match) setCurrentChatId(match[1]);
    else setCurrentChatId(null);
  }, [location.pathname]);

  const loadChats = async () => {
    try {
      const loadedChats = await chatService.getChats();
      setChats(loadedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleCreateChat = async (title) => {
    console.log('MainLayout: handleCreateChat triggered with title:', title);
    try {
      const newChat = await chatService.createChat(title);
      console.log('MainLayout: Chat created successfully:', newChat);
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat._id);
      navigate(`/chat/${newChat._id}`);
      return newChat;
    } catch (error) {
      console.error('MainLayout: Error creating chat:', error);
      throw error;
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      if (currentChatId === chatId) {
        if (chats.length > 1) {
          const nextChat = chats.find(c => c._id !== chatId);
          if (nextChat) navigate(`/chat/${nextChat._id}`);
          else navigate('/');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatCreate={handleCreateChat}
        onChatDelete={handleDeleteChat}
      />
      <div className="main-content" style={{ backgroundColor: mainBg }}>
        <Outlet context={{ chats, handleCreateChat, handleDeleteChat }} />
      </div>
    </div>
  );
};

export default MainLayout; 