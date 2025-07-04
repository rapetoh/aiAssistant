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
    const { jobDescription, timestamp, resumeText } = req.body;
    const resumeFile = req.file;

    if (!resumeFile && !resumeText) {
      return res.status(400).json({ message: 'Resume file or resume text is required.' });
    }
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job Description is required.' });
    }

    let resumeContent = '';
    if (resumeFile) {
      // Save file to disk first
      const fileTimestamp = timestamp || Date.now();
      const fileName = `${fileTimestamp}-${resumeFile.originalname}`;
      filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, resumeFile.buffer);

      if (resumeFile.mimetype === 'application/pdf') {
        try {
          await PDFDocument.load(resumeFile.buffer, { ignoreEncryption: true });
          const pdfExtract = new PDFExtract();
          const options = {};
          const data = await pdfExtract.extract(filePath, options);
          resumeContent = data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n');
          if (!resumeContent.trim() || resumeContent.trim().length < 30) {
            // Consider less than 30 chars as failed extraction
            return res.status(400).json({ message: 'Could not extract text from your PDF. Please upload a text-based PDF or a .txt file.' });
          }
        } catch (error) {
          console.error('Error processing PDF:', error);
          return res.status(400).json({ message: 'Could not extract text from your PDF. Please upload a text-based PDF or a .txt file.' });
        }
      } else {
        resumeContent = resumeFile.buffer.toString('utf-8');
        if (!resumeContent.trim() || resumeContent.trim().length < 30) {
          return res.status(400).json({ message: 'Resume file appears to be empty or invalid. Please upload a valid resume.' });
        }
      }

      // Clean up the file after extraction
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (resumeText) {
      resumeContent = resumeText;
      if (!resumeContent.trim() || resumeContent.trim().length < 30) {
        return res.status(400).json({ message: 'Resume text appears to be empty or invalid. Please provide a valid resume.' });
      }
    }

    // Pass timestamp to AI service for cache busting
    const analysis = await aiService.generateMatchAnalysis(resumeContent, jobDescription, timestamp);
    res.status(200).json(analysis);
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Error in getMatchResult:', error);
    res.status(500).json({ message: 'Error generating match result.', error: error.message });
  }
}; 