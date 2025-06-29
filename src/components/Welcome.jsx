import React, { useState } from 'react';
import './Welcome.css';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import LoadingSpinner from './LoadingSpinner';

const Welcome = () => {
  const navigate = useNavigate();
  const [loadingStates, setLoadingStates] = useState({});

  const handleSuggestionClick = async (suggestionText, index) => {
    console.log('Welcome: Suggestion click triggered for:', suggestionText);
    
    // Set loading state for this specific suggestion
    setLoadingStates(prev => ({ ...prev, [index]: true }));
    
    try {
      console.log('Welcome: Attempting to create new chat via chatService...');
      const newChat = await chatService.createChat('New Chat'); // Create a new chat for the suggestion
      console.log('Welcome: New chat created successfully:', newChat);
      
      // Add a small delay to ensure the chat is properly saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await chatService.sendMessage(newChat._id, suggestionText);
      console.log('Welcome: Message sent to new chat, navigating...');
      navigate(`/chat/${newChat._id}`);
    } catch (error) {
      console.error('Welcome: Error handling suggestion/creating chat:', error);
      // Optionally, show an error message to the user
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  const suggestions = [
    "What are the top skills employers look for in a software developer resume?",
    "How can I improve my resume to stand out for remote jobs?",
    "How do I tailor my resume for a specific job description?",
    "What are common mistakes to avoid on a tech resume?",
    "How can I highlight my soft skills on my resume?",
    "How can I optimize my resume for applicant tracking systems (ATS)?"
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
        {suggestions.map((suggestion, index) => {
          const isLoading = loadingStates[index];
          
          return (
            <button 
              key={index} 
              className={`suggestion-card ${isLoading ? 'loading' : ''}`}
              onClick={() => !isLoading && handleSuggestionClick(suggestion, index)}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner 
                  size="small" 
                  color="primary" 
                  text="Creating chat..." 
                />
              ) : (
                suggestion
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Welcome; 