import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Register a new user
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with that email already exists.' });
    }

    const user = new User({ username, email, password });
    await user.save();

    // Generate JWT token with user data
    const token = jwt.sign({ 
      id: user._id, 
      username: user.username, 
      email: user.email 
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Set expiry based on rememberMe
    const expiresIn = rememberMe ? '7d' : '1h';

    // Generate JWT token with user data
    const token = jwt.sign({ 
      id: user._id, 
      username: user.username, 
      email: user.email 
    }, process.env.JWT_SECRET, { expiresIn });

    res.status(200).json({ message: 'Logged in successfully', user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
}; 