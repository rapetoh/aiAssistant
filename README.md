# AI-Powered Personal Chat Assistant

An intelligent chat assistant that provides context-aware responses based on your personal documents and data.

## Features

- 📄 Document Upload: Support for PDF, text, and other document formats
- 🤖 AI-Powered Chat: Context-aware responses using OpenAI and LangChain
- 🔍 Document Analysis: Intelligent processing of uploaded documents
- 💾 Document Management: Easy organization and retrieval of your documents
- 🔒 Secure: Your data stays private and secure

## Tech Stack

- Frontend: React + Vite
- UI Framework: Chakra UI
- Backend: Node.js + Express
- AI: OpenAI + LangChain
- Database: MongoDB
- File Storage: Local storage (expandable to cloud storage)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   REMOVED=your_openai_api_key
   MONGODB_URI=your_mongodb_uri
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Start the backend server:
   ```bash
   npm run server
   ```

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   └── App.jsx        # Main App component
├── server/
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── index.js       # Server entry point
└── public/            # Static assets
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License
