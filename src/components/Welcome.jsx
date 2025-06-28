import React from 'react';
import './Welcome.css';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';

const Welcome = () => {
  const navigate = useNavigate();

  const handleSuggestionClick = async (suggestionText) => {
    console.log('Welcome: Suggestion click triggered for:', suggestionText);
    try {
      console.log('Welcome: Attempting to create new chat via chatService...');
      const newChat = await chatService.createChat('New Chat'); // Create a new chat for the suggestion
      console.log('Welcome: New chat created successfully:', newChat);
      await chatService.sendMessage(newChat._id, suggestionText);
      console.log('Welcome: Message sent to new chat, navigating...');
      navigate(`/chat/${newChat._id}`);
    } catch (error) {
      console.error('Welcome: Error handling suggestion/creating chat:', error);
      // Optionally, show an error message to the user
    }
  };

  const suggestions = [
    "What are the advantages of using Next.js?",
    "Write code to demonstrate Dijkstra\'s algorithm",
    "Help me write an essay about Silicon Valley",
    "What is the weather in San Francisco?"
  ];

  // You can replace 'there' with a dynamic user name if available
  const userName = "there"; 

  return (
    <div className="welcome-container" style={{ backgroundColor: 'var(--color-bg-alt)' }}>
      <div className="welcome-header">
        <h1>Hello {userName}!</h1>
        <p>How can I help you today?</p>
      </div>
      <div className="suggestion-cards">
        {suggestions.map((suggestion, index) => (
          <button 
            key={index} 
            className="suggestion-card"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Welcome; 