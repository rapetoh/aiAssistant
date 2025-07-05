import React, { useState } from 'react';
import './CreateChatModal.css';

const CreateChatModal = ({ isOpen, onClose, onCreateChat }) => {
  const [chatTitle, setChatTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateChat(chatTitle);
      setChatTitle('');
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setChatTitle('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-chat-modal-overlay">
      <div className="create-chat-modal">
        <div className="create-chat-modal-header">
          <h2>Create New Chat</h2>
          <button 
            className="create-chat-modal-close" 
            onClick={handleCancel}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-chat-modal-form">
          <div className="create-chat-modal-input-group">
            <label htmlFor="chat-title">Chat Title</label>
            <input
              id="chat-title"
              type="text"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              placeholder="Enter chat title..."
              autoFocus
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="create-chat-modal-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="create-chat-modal-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-chat-modal-create"
              disabled={!chatTitle.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChatModal; 