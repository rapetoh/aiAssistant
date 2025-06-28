import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import matcherRoutes from './routes/matcherRoutes.js';
import dotenv from 'dotenv';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/matcher', matcherRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://rapetohsenyo:fhmnpNwpu54X6Bvw@cluster0.aixaypb.mongodb.net/')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 