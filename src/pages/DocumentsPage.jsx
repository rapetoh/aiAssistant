import React, { useEffect, useState, useRef } from 'react';
import { documentService } from '../services/documentService';
import './DocumentsPage.css';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      setError('Failed to fetch documents.');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      await documentService.uploadDocument(file);
      await fetchDocuments(); // Refresh the list
      alert('Document uploaded successfully!');
    } catch (err) {
      setUploadError('Failed to upload document.');
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(id);
        await fetchDocuments(); // Refresh the list
        alert('Document deleted successfully!');
      } catch (err) {
        alert('Failed to delete document.');
        console.error('Error deleting document:', err);
      }
    }
  };

  return (
    <div className="documents-page-container">
      <h1 className="documents-page-title">Your Documents</h1>
      <div className="upload-section">
        <label htmlFor="file-upload" className="upload-button">
          {uploading ? 'Uploading...' : 'Upload New Document'}
        </label>
        <input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".pdf,.txt"
          style={{ display: 'none' }}
        />
        {uploadError && <p className="upload-error-message">{uploadError}</p>}
      </div>
      {loading && <p className="loading-message">Loading documents...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="no-documents-message">No documents uploaded yet. Upload one to get started!</p>
      )}
      {!loading && !error && documents.length > 0 && (
        <div className="documents-list">
          {documents.map((doc) => (
            <div key={doc._id} className="document-item">
              <div className="document-info">
                <span className="document-title">{doc.title}</span>
                <span className="document-metadata">
                  {doc.type.toUpperCase()} - {new Date(doc.uploadDate).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => handleDeleteDocument(doc._id)}
                className="delete-document-button"
                title="Delete Document"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 