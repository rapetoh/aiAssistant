import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { getMatchResult } from '../controllers/matcherController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All matcher routes will be protected
router.use(authenticate);

// POST /api/matcher/match
// Receives a resume and job description, returns an AI-generated match analysis
router.post('/match', upload.single('resume'), getMatchResult);

export default router; 