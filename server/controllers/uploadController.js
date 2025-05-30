import { PDFDocument } from 'pdf-lib';
import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept PDF and text files
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

// Middleware to handle file upload
export const handleFileUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          message: 'Please send the file with field name "file" in form-data' 
        });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Controller function to process the uploaded file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    let content = '';
    let filePath = '';

    // Save file to disk
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Extract text from PDF
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfDoc = await PDFDocument.load(file.buffer);
        content = `PDF with ${pdfDoc.getPageCount()} pages`;
      } catch (error) {
        console.error('Error processing PDF:', error);
        content = 'Error processing PDF file';
      }
    } else if (file.mimetype === 'text/plain') {
      content = file.buffer.toString('utf-8');
    } else {
      // Clean up the file if it's not supported
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    // Create a new document
    const document = new Document({
      title: file.originalname,
      content: content,
      type: file.mimetype === 'application/pdf' ? 'pdf' : 'txt',
      filePath: filePath, // Store the file path
      metadata: {
        size: file.size,
        pages: file.mimetype === 'application/pdf' ? (await PDFDocument.load(file.buffer)).getPageCount() : 1,
        author: 'Unknown'
      }
    });

    await document.save();
    res.status(201).json({
      ...document.toObject(),
      filePath: filePath // Include the file path in the response
    });
  } catch (error) {
    // Clean up the file if there's an error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error processing file', error: error.message });
  }
}; 