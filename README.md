# Intelligent SmartDoc Chat Assistant

<div align="center">
  
# SmartDoc 

<p align="center">
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Untitled%20design%20(1).png?raw=true" alt="SmartDoc Logo" width="100"/>
</p>


**Transform static PDFs into interactive, AI-powered conversations**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-2596BE?style=for-the-badge&logo=trpc&logoColor=white)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Xata](https://img.shields.io/badge/Xata-DB-purple?style=for-the-badge)](https://xata.io/)
[![NVIDIA AI](https://img.shields.io/badge/NVIDIA-Llama_3.1-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://nvidia.com/)

</div>

## 📑 Overview

The **Intelligent SmartDoc Chat Assistant** revolutionizes document interaction by transforming static PDFs into dynamic, interactive resources. Built with modern technologies and powered by **NVIDIA's Llama-3.3-Nemotron-70B-Instruct** model, this application enables natural language conversations with your documents.

Designed for professionals in **law**, **academia**, and **business**, SmartDoc Chat eliminates the limitations of traditional PDF readers by providing intelligent search, summarization, highlighting, and contextual suggestions.

## ✨ Features

- **🔄 Drag-and-Drop PDF Upload** - Seamlessly upload documents with real-time validation
- **💬 Natural Language Chat** - Ask questions like "Summarize this section" or "Find clauses related to data privacy"
- **📝 Text Summarization & Highlighting** - Get instant summaries and highlighted relevant content
- **💡 Contextual Suggestions** - Receive AI-driven navigation suggestions for related document sections
- **📤 Chat Export** - Save your document conversations as PDF or TXT
- **✏️ PDF Annotations & Notepad** - Add comments and take notes directly in the interface
- **📊 Analytics Dashboard** - Track interaction metrics with interactive charts
- **🔐 Secure Authentication** - Enterprise-grade security with Kinde authentication and MFA
- **⚡ Scalable Architecture** - Built for performance with Vercel, Redis caching, and Docker containerization

## 🖥️ Screenshots

### Landing Pages
<div align="center">
  <img src="https://raw.githubusercontent.com/manu14357/smartdoc/refs/heads/main/src/components/Pics/Screenshot%202025-05-03%20114715.png" alt="Upload Interface" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114647.png?raw=true" alt="Chat Interface" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114744.png?raw=true" alt="Document View" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114801.png?raw=true" alt="Analytics Dashboard" width="400" />
</div>

### Dashboard & Pricing Page
<div align="center">
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114451.png?raw=true" alt="Dashboard" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114607.png?raw=true" alt="Pricing Page" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114647.png?raw=true" alt="Document View" width="400" />
</div>

### Chat Interface
<div align="center">
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05.png?raw=true" alt="Chat Overview" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114253.png?raw=true" alt="Chat Interface" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114316.png?raw=true" alt="Document View" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114338.png?raw=true" alt="Analytics View" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114355.png?raw=true" alt="Document Analysis" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114410.png?raw=true" alt="Settings View" width="400" />
  <img src="https://github.com/manu14357/smartdoc/blob/main/src/components/Pics/Screenshot%202025-05-03%20114425.png?raw=true" alt="User Profile" width="400" />
</div>

## 🛠️ Tech Stack

### Frontend
- **React & TypeScript** - For a robust, type-safe UI
- **CSS Modules** - For scoped styling
- **Uploadthing** - For efficient file uploads
- **Chart.js** - For interactive analytics visualizations

### Backend
- **Node.js & Express** - Server framework
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - ORM for database operations
- **Xata** - Serverless database platform

### AI & Processing
- **NVIDIA Llama-3.3-Nemotron-70B-Instruct** - Large language model deployed on GPU cluster
- **PDF.js** - For parsing and metadata extraction

### Infrastructure
- **Vercel** - For serverless deployment
- **Docker** - For containerized AI server
- **Redis** - For efficient caching
- **Kinde** - For authentication (OAuth, JWT, MFA)

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn
- NVIDIA API Key for Llama-3.3-Nemotron-70B-Instruct
- Xata account for database
- Uploadthing account for file uploads
- Kinde account for authentication
- Docker (optional, for AI server)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smartdoc-chat-assistant.git
   cd smartdoc-chat-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following:
   ```
   NVIDIA_API_KEY=your-nvidia-api-key
   XATA_API_KEY=your-xata-api-key
   XATA_DATABASE_URL=your-xata-database-url
   UPLOADTHING_SECRET=your-uploadthing-secret
   KINDE_CLIENT_ID=your-kinde-client-id
   KINDE_CLIENT_SECRET=your-kinde-client-secret
   KINDE_ISSUER_URL=your-kinde-issuer-url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000

5. **Optional: Run AI Server with Docker**
   ```bash
   docker pull your-ai-server-image
   docker run -p 8000:8000 your-ai-server-image
   ```

### Build for Production
```bash
npm run build
npm start
```

## 📝 Usage

1. **Access the Application**: Open in your browser
2. **Sign Up/Log In**: Create an account or log in using Kinde
3. **Upload a PDF**: Navigate to the Upload page and drag & drop your document
4. **Interact with Documents**: Use the Chat interface to ask questions
5. **Export & Analyze**: Save your conversations or view usage analytics

## 🔮 Future Roadmap

- **Personalization**: User-specific query preferences and adaptive learning
- **Multilingual Support**: Integration of multilingual NLP models
- **Advanced Analytics**: Sentiment analysis and enhanced visualization tools
- **Mobile App**: Native applications for iOS and Android

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NVIDIA for their powerful LLM technology
- Vercel for serverless hosting infrastructure
- Xata for database solutions
- Uploadthing for file handling capabilities
- Kinde for authentication services

---

<div align="center">
  <p>Made with ❤️ by Manohar</p>
  <p>© 2025 Intelligent SmartDoc Chat Assistant</p>
</div>
