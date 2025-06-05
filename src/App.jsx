import { useState, useEffect } from 'react'
import { chatService } from './services/chatService'
import Chat from './components/Chat'
import Sidebar from './components/Sidebar'
import Welcome from './components/Welcome'
import './App.css'

function App() {
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const loadedChats = await chatService.getChats()
      setChats(loadedChats)
      if (loadedChats.length > 0 && !currentChatId) {
        setCurrentChatId(loadedChats[0]._id)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    }
  }

  const handleCreateChat = async (title) => {
    try {
      const newChat = await chatService.createChat(title)
      setChats(prev => [newChat, ...prev])
      setCurrentChatId(newChat._id)
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId)
      setChats(prev => prev.filter(chat => chat._id !== chatId))
      if (currentChatId === chatId) {
        setCurrentChatId(chats.length > 1 ? chats[0]._id : null)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onChatCreate={handleCreateChat}
        onChatDelete={handleDeleteChat}
      />
      <div className="main-content">
        {currentChatId ? (
          <Chat chatId={currentChatId} />
        ) : (
          <Welcome />
        )}
      </div>
    </div>
  )
}

export default App
