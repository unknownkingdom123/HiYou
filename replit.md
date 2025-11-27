# ClgBooksAI Bot - Replit Agent Guide

## Overview

ClgBooksAI Bot is an intelligent PDF library management system designed for college students and educational institutions. The application enables users to search for and download educational PDFs using natural language queries powered by fuzzy matching search. It features a dual-interface system with separate user and admin portals, where admins can manage the PDF library and external links, while users can interact with an AI chatbot to find and download resources.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript using Vite as the build tool
- Single Page Application (SPA) with client-side routing via Wouter
- Component-based architecture with reusable UI components from shadcn/ui

**UI Design System**
- Dark-first design approach optimized for extended study sessions
- Modern productivity tool aesthetic (Linear, Notion, Vercel Dashboard inspired)
- Tailwind CSS for styling with custom design tokens
- Typography: Inter for UI text, JetBrains Mono for technical data (MIS numbers, file sizes)
- Responsive layout system with container strategies for different page types

**State Management**
- React Context API for global state (Auth, Theme)
- TanStack Query (React Query) for server state management and data fetching
- React Hook Form with Zod for form validation and state

**Key UI Patterns**
- Authentication flows: Multi-step signup with OTP verification, login with remember me, password reset
- Dashboard: User profile, download history, statistics
- Chat Interface: AI-powered conversational PDF search with fuzzy matching
- Admin Panel: Tabbed interface for PDF uploads, library management, external links, user management

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- HTTP server with JSON API endpoints
- RESTful API design pattern

**Authentication & Authorization**
- JWT-based authentication with bcrypt password hashing
- Token storage in localStorage on client
- Role-based access control (user vs admin)
- Session management with configurable expiration (7 days standard, 30 days with "remember me")

**File Upload System**
- Multer middleware for handling PDF uploads
- Local file storage in `/uploads` directory
- 50MB file size limit
- PDF-only file type validation

**Search & Matching Logic**
- Fuse.js for fuzzy string matching on PDF titles
- Local search implementation (no external AI API dependencies)
- Fallback to external links when no PDF match found
- Similarity scoring for best match recommendations

**Database Layer**
- PostgreSQL database via Neon serverless adapter
- Drizzle ORM for type-safe database operations
- Schema-first approach with TypeScript type generation

### Data Storage Solutions

**Database Schema (PostgreSQL + Drizzle ORM)**

Tables:
- `users`: User accounts with email, username (MIS number), mobile, password hash, verification status, admin flag, download count
- `otpCodes`: OTP verification codes for signup and password reset with expiration tracking
- `pdfs`: PDF metadata including title, author, category, description, tags, filename, file size, upload timestamp
- `externalLinks`: External resource links with title, URL, description
- `downloadHistory`: User download tracking linking users to PDFs with timestamps
- `sessions`: User session management (referenced in schema but implementation uses JWT)

**File Storage**
- PDFs stored in local filesystem at `/uploads` directory
- Filename includes timestamp and random suffix to prevent collisions
- File metadata tracked in database

### External Dependencies

**Core Third-Party Services**
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **No External AI APIs**: Search uses local Fuse.js library for fuzzy matching

**Key NPM Packages**
- **UI Components**: Radix UI primitives (@radix-ui/*) with shadcn/ui wrapper
- **Forms & Validation**: React Hook Form, Zod, @hookform/resolvers
- **Authentication**: bcryptjs, jsonwebtoken
- **File Uploads**: multer
- **Search**: fuse.js for fuzzy string matching
- **Database**: Drizzle ORM, drizzle-zod
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **State Management**: TanStack Query (@tanstack/react-query)
- **Routing**: wouter

**Development Tools**
- TypeScript for type safety across frontend and backend
- Vite for fast development and optimized production builds
- ESBuild for server bundling
- Drizzle Kit for database migrations

**Design Assets**
- Google Fonts CDN: Inter (UI), JetBrains Mono (monospace)
- Custom dark/light theme system with CSS variables