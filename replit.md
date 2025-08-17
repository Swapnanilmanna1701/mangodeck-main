# Overview

This is a full-stack web application that enables users to upload meeting transcripts, provide custom summarization instructions, generate AI-powered summaries using Google's Gemini AI, edit those summaries, and share them via email. The application focuses on functionality over design with a minimalistic frontend and reliable backend logic.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state, React Context for global state (auth, theme)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom alias configuration

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **File Processing**: Multer for file uploads with support for .txt, .pdf, .docx files
- **Session Management**: JWT-based authentication with bcrypt password hashing

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon Database (serverless PostgreSQL)
- **Schema**: Three main entities - users, summaries, and email logs with proper relations
- **Migrations**: Drizzle Kit for schema management

## AI Integration
- **Provider**: Google Gemini AI (via @google/genai)
- **Features**: Custom prompt templates, tone selection, structured summary generation with emoji enhancement
- **Error Handling**: Comprehensive error handling with fallback mechanisms

## Authentication & Authorization
- **Strategy**: JWT tokens with 7-day expiration
- **Security**: bcrypt password hashing with salt rounds of 12
- **Middleware**: Express middleware for route protection
- **Storage**: localStorage for token persistence

## File Processing Pipeline
- **Upload Handling**: Multer with 10MB file size limit
- **Supported Formats**: .txt (direct read), .pdf and .docx (placeholder for pdf-parse and mammoth libraries)
- **Validation**: File type and size validation with user feedback

## Email System
- **Provider**: Nodemailer with SMTP configuration
- **Features**: HTML and PDF/DOCX export options, CC self functionality
- **Export Formats**: PDF generation (jsPDF placeholder), DOCX generation (docx library placeholder)

## Development Features
- **Hot Reload**: Vite development server with React fast refresh
- **Error Overlay**: Replit runtime error modal integration
- **Logging**: Structured request/response logging for API routes
- **Type Safety**: Full TypeScript coverage with strict configuration

# External Dependencies

## Core Technologies
- **Database**: Neon Database (serverless PostgreSQL)
- **AI Service**: Google Gemini AI API
- **Email Service**: SMTP provider (Gmail by default)

## Key Libraries
- **Frontend**: React, Wouter, TanStack Query, Radix UI, Tailwind CSS
- **Backend**: Express, Drizzle ORM, Multer, Nodemailer, JWT, bcrypt
- **AI**: @google/genai for Gemini integration
- **Validation**: Zod for schema validation across frontend and backend

## Development Tools
- **Build**: Vite, esbuild for production builds
- **TypeScript**: Full type safety with path mapping
- **Linting**: ESLint configuration for code quality

## Missing Dependencies (Placeholders)
- **PDF Processing**: pdf-parse library needed for PDF file support
- **DOCX Processing**: mammoth library needed for DOCX file support  
- **PDF Export**: jsPDF library needed for PDF generation
- **DOCX Export**: docx library needed for DOCX export functionality

## Environment Variables Required
- `DATABASE_URL`: Neon database connection string
- `GEMINI_API_KEY`: Google Gemini AI API key
- `JWT_SECRET`: Secret key for JWT token signing
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email service configuration