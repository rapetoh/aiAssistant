import { PDFDocument } from 'pdf-lib';
import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { PDFExtract } from 'pdf.js-extract';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname);
console.log(__filename);



// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');

console.log(uploadsDir);

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

    // Extract text from PDF
    if (file.mimetype === 'application/pdf') {
      try {
        // Get PDF metadata using pdf-lib
        const pdfDoc = await PDFDocument.load(file.buffer);
        const pageCount = pdfDoc.getPageCount();

        // Save file to disk first
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`;
        filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, file.buffer);

        // Extract text content using pdf.js-extract
        const pdfExtract = new PDFExtract();
        const options = {};
        const data = await pdfExtract.extract(filePath, options);
        
        // Combine text from all pages
        content = data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n');

        // If text extraction is empty, fallback to page count
        if (!content.trim()) {
          content = `PDF with ${pageCount} pages (No extractable text found)`;
        }
      } catch (error) {
        console.error('Error processing PDF:', error);
        // Log the full error details
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        content = `Error processing PDF file: ${error.message}`;
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
      filePath: filePath,
      metadata: {
        size: file.size,
        pages: file.mimetype === 'application/pdf' ? (await PDFDocument.load(file.buffer)).getPageCount() : 1,
        author: 'Unknown'
      }
    });

    await document.save();
    res.status(201).json({
      ...document.toObject(),
      filePath: filePath
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