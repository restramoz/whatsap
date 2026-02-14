# Ingrid AI System 🤖

**De Royal Nirwana Marketing AI Agent** — An advanced autonomous agent for WhatsApp automation, lead management, and property sales handling.

![Ingrid AI](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Framework-Next.js_15-black)
![LangChain](https://img.shields.io/badge/AI-LangChain-green)
![WhatsApp](https://img.shields.io/badge/Gateway-WhatsApp_Web.js-25D366)

## 📖 Overview

Ingrid is a hybrid AI system designed to handle real estate marketing operations autonomously. It combines:
- **WhatsApp Automation**: For direct customer interaction.
- **RAG (Retrieval-Augmented Generation)**: Uses Supabase pgvector for long-term memory.
- **Multi-Model AI**: Dynamically switches between Groq (Llama-3), Gemini, and OpenAI based on task complexity.
- **Lead Tracking**: Automated lead scoring and CRM integration.

Detailed architecture documentation: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚀 Features

- **24/7 Auto-Reply**: Handles inquiries instantly with context-aware responses.
- **Smart Asset Sending**: Automatically sends brochures (PDF) and videos based on user intent.
- **Memory System**: Remembers user preferences and history across conversations.
- **Lead Dashboard**: Real-time monitoring of conversations and lead status.
- **QR Code Connection**: Easy WhatsApp Web pairing via the dashboard.

---

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **Orchestrator**: LangChain.js

### Services
- **Web App**: `web-app/` (Dashboard & API)
- **WhatsApp Service**: `wa-service/` (Node.js + Puppeteer)
- **Process Manager**: PM2

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- Docker (optional)
- Supabase Project

### Local Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/restramoz/whatsap.git
   cd ingrid-ai-system
   ```

2. **Install Dependencies**
   ```bash
   npm install      # Root dependencies
   npm run setup    # Frontend & Backend dependencies
   ```

3. **Configure Environment**
   Duplicate `.env.example` to `.env` in root and `wa-service/.env`.
   ```bash
   cp .env.example .env
   cp .env.example wa-service/.env
   ```

4. **Start System**
   ```bash
   npm run start    # Starts PM2 ecosystem
   ```

---

## 🐳 Docker Deployment (Hugging Face Spaces)

This project is optimized for Hugging Face Spaces (Docker SDK).

1. **Build Docker Image**
   ```bash
   docker build -t ingrid-ai .
   ```

2. **Run Container**
   ```bash
   docker run -p 7860:7860 ingrid-ai
   ```

**Note**: Large assets (PDF/Video) are excluded from the Docker image to save space. Please host them externally (e.g., Supabase Storage) and update links in `web-app/public`.

---

## 📂 Project Structure

```
ingrid-ai-system/
├── docs/               # Documentation
│   └── ARCHITECTURE.md # System Manifesto & Technical Details
├── wa-service/         # WhatsApp Gateway (Node.js)
│   ├── index.js        # Main entry point
│   └── lib/            # WA logic
├── web-app/            # Dashboard & Brain (Next.js)
│   ├── src/lib/        # AI Logic (LangChain, Embeddings)
│   └── src/app/        # API Routes & UI
├── Dockerfile          # HF Spaces Config
└── ecosystem.config.js # PM2 Process Manager
```

---

## 📄 License

Private Property of **De Royal Nirwana**. Not for public distribution.
