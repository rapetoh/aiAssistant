import aiService from '../services/aiService.js';
import { PDFDocument } from 'pdf-lib';
import { PDFExtract } from 'pdf.js-extract';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const getMatchResult = async (req, res) => {
  let filePath = '';
  try {
    const { jobDescription, timestamp } = req.body;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ message: 'Resume file is required.' });
    }
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job Description is required.' });
    }

    let resumeText = '';
    // Save file to disk first
    const fileTimestamp = timestamp || Date.now();
    const fileName = `${fileTimestamp}-${resumeFile.originalname}`;
    filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, resumeFile.buffer);

    if (resumeFile.mimetype === 'application/pdf') {
      try {
        // Load PDF to check for encryption and get page count
        await PDFDocument.load(resumeFile.buffer, { ignoreEncryption: true });
        // Extract text using pdf.js-extract
        const pdfExtract = new PDFExtract();
        const options = {};
        const data = await pdfExtract.extract(filePath, options);
        resumeText = data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n');
        if (!resumeText.trim()) {
          resumeText = 'PDF file has no extractable text.';
        }
      } catch (error) {
        console.error('Error processing PDF:', error);
        resumeText = `Error processing PDF file: ${error.message}`;
      }
    } else {
      // Fallback for other types (e.g., text)
      resumeText = resumeFile.buffer.toString('utf-8');
    }

    // Clean up the file after extraction
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Pass timestamp to AI service for cache busting
    const analysis = await aiService.generateMatchAnalysis(resumeText, jobDescription, timestamp);
    res.status(200).json(analysis);
  } catch (error) {
    // Clean up the file if there's an error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Error in getMatchResult:', error);
    res.status(500).json({ message: 'Error generating match result.', error: error.message });
  }
}; 