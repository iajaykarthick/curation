# Data Curation Platform

## Overview

This application is a professional data curation platform designed for comparing and selecting between model outputs in different formats including text, bounding box, and SVG. The platform allows users to upload folders of images, compare model predictions side-by-side, edit outputs, and save preferences for data curation workflows.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with Express routes
- **Development**: Hot module replacement with Vite integration

### Build System
- **Development**: Vite dev server with HMR
- **Production**: Vite build for frontend, esbuild for backend bundling
- **TypeScript**: Strict mode enabled with path mapping for imports

## Key Components

### Data Models
- **Curation Items**: Core entities containing input data and model outputs
- **User Preferences**: Storage for user selections and edited outputs
- **Output Types**: Support for text, bounding box, and SVG formats

### Frontend Pages
- **Landing Page**: Output type selection and folder upload interface
- **Curation Page**: Side-by-side comparison and editing interface
- **404 Page**: Error handling for unknown routes

### Backend Services
- **Storage Interface**: Abstracted storage layer with in-memory implementation
- **API Routes**: RESTful endpoints for curation items and preferences
- **File Handling**: Session-based image storage and retrieval

### UI Components
- **Input Panel**: Display uploaded images and input data
- **Output Panel**: Side-by-side model output comparison with editing
- **Form Components**: Comprehensive form handling with validation

## Data Flow

1. **Image Upload**: Users select folders containing images via file input
2. **Output Type Selection**: Users choose between text, bounding box, or SVG comparison
3. **Curation Interface**: Platform loads corresponding curation items and displays side-by-side
4. **Preference Management**: Users can select preferred models and edit outputs
5. **Data Persistence**: Preferences and edits are saved to PostgreSQL database

## External Dependencies

### Core Dependencies
- **Database**: Neon Database for serverless PostgreSQL hosting
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime type checking and schema validation
- **Date Handling**: date-fns for date manipulation utilities

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Code Quality**: ESLint configuration via Replit integrations
- **Database Tools**: Drizzle Kit for schema migrations and management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API integration
- **Hot Reloading**: Full-stack HMR with Vite middleware
- **Database**: Environment variable-based connection to Neon Database

### Production Build
- **Frontend**: Static assets built with Vite and served from Express
- **Backend**: Bundled with esbuild for Node.js runtime
- **Database Migrations**: Managed through Drizzle Kit push commands
- **Environment**: Production mode with optimized builds

### Configuration Management
- **Environment Variables**: DATABASE_URL for database connection
- **Path Aliases**: TypeScript path mapping for clean imports
- **Asset Handling**: Static file serving for uploaded content

## Changelog
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.