import express from 'express';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
} from '../controllers/documentController.js';
import { uploadFile } from '../controllers/uploadController.js';
import Document from '../models/Document.js';
import fs from 'fs';

const router = express.Router();

// Document routes
router.get('/', getDocuments);
router.get('/:id', getDocument);

router.post('/', createDocument);

router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// Upload a document
router.post('/upload', uploadFile);

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ message: 'Error getting documents', error: error.message });
  }
});

// Get a single document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ message: 'Error getting document', error: error.message });
  }
});

// Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the file from disk
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

export default router; 