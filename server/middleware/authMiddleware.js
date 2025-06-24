import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn('[AUTH] No Authorization header provided');
    return res.status(401).json({ message: 'No Authorization header provided' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Authorization header is not in Bearer format:', authHeader);
    return res.status(401).json({ message: 'Authorization header must start with Bearer' });
  }

  // Improved token extraction and check
  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    console.warn('[AUTH] Authorization header has unexpected format:', authHeader);
    return res.status(401).json({ message: 'Authorization header has unexpected format' });
  }
  const token = parts[1];
  if (!token || token === 'null' || token === 'undefined') {
    console.warn('[AUTH] Bearer token is missing or invalid:', token);
    return res.status(401).json({ message: 'Bearer token is missing or invalid' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    // Optionally, fetch user details:
    // req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}; 