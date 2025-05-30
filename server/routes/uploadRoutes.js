import express from 'express';
import { handleFileUpload, uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

// Upload route
router.post('/', handleFileUpload, uploadFile);

export default router; 