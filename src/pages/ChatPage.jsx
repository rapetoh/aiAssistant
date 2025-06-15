import { useParams, useOutletContext } from 'react-router-dom';
import Chat from '../components/Chat';

const ChatPage = () => {
  const { chatId } = useParams();
  const { chats } = useOutletContext(); // Get chats from context

  // Find the current chat title
  const currentChat = chats.find(chat => chat._id === chatId);
  const chatTitle = currentChat ? currentChat.title : `Chat ${chatId}`;

  return <Chat chatId={chatId} chatTitle={chatTitle} />;
};

export default ChatPage; 