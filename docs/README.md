# Saarthi AI - The Welfare Navigator

Saarthi AI is a multilingual, WhatsApp-first AI Welfare Navigator for India. It helps citizens discover and apply for government welfare schemes using conversational AI.

## Features
- **Multilingual Support**: Hindi, Kannada, Tamil, Telugu, English.
- **Voice & Text Chat**: Reach users where they are (WhatsApp & Web UI).
- **AI Eligibility Checker**: Uses RAG and LLMs to check scheme eligibility against user profiles.
- **Auto Form Filling & OCR**: Upload documents (Aadhaar, Income Certificates) for AI to validate and fill forms.
- **Application Tracking & Reminders**: Get WhatsApp updates on application status.
- **Payments**: Razorpay integration to collect a nominal platform fee (₹15 per application).

## Project Structure
- `frontend/`: Next.js 15 application using Tailwind CSS and ShadCN UI.
- `backend/`: Node.js Express server to handle Razorpay, WhatsApp Webhooks, and AI APIs.
- `prisma/`: Prisma ORM schema for PostgreSQL.
- `agents/`: AI logic for Eligibility, Document Processing, and Conversation.
- `rag/`: Ingestion scripts for embedding welfare scheme data into a Vector Database.
- `docs/`: Additional documentation and architecture diagrams.

## Prerequisites
- Node.js 18+
- PostgreSQL
- Razorpay Account
- Twilio Account (for WhatsApp API)
- OpenAI API Key (or equivalent LLM)

## Setup Instructions

1. **Install Dependencies**
   Run the following from the root directory:
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the `.env.example` file to `.env` and fill in the required keys:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   Ensure your PostgreSQL server is running and the `DATABASE_URL` is set in `.env`.
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Run the Project**
   Start both the frontend and backend concurrently:
   ```bash
   npm run dev
   ```

   - Frontend running at: http://localhost:3000
   - Backend running at: http://localhost:5000

## Deployment
- **Frontend**: Deploy `frontend/` to Vercel.
- **Backend**: Deploy `backend/` to Railway or Render.
- Set the respective environment variables on your deployment platforms.
