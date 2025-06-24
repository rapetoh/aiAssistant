import Document from '../models/Document.js';

// Get all documents for the logged-in user
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id }).sort({ uploadDate: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single document for the logged-in user
export const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new document - This route is less used, main creation is via upload
export const createDocument = async (req, res) => {
  try {
    const document = new Document({
      ...req.body,
      user: req.user.id // Associate with user
    });
    const savedDocument = await document.save();
    res.status(201).json(savedDocument);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a document for the logged-in user
export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a document for the logged-in user
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 