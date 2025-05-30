import express from 'express';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
} from '../controllers/documentController.js';

const router = express.Router();

// Document routes
router.get('/', getDocuments);
router.get('/:id', getDocument);



router.post('/', createDocument);



router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router; 