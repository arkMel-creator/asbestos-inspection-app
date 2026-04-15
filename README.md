
# Asbestos Inspection Management System (AIMS)

A comprehensive web-based application for managing asbestos inspection projects, samples, documentation, and team coordination. Built with a modern full-stack architecture focusing on speed, reliability, and ease of use.

**Design Source:** [Figma Design](https://www.figma.com/design/6EdnSNJAi85xmFhRrFnBkQ/Asbestos-Inspection-Management-System)

## Features

- **Dashboard** - High-level overview of project health, sample status, and recent activities.
- **Project Management** - Organize inspections into specific projects with metadata and status tracking.
- **Sample Management** - Detailed tracking of asbestos samples, including types, concentrations, and risk levels.
- **File & Asset Management** - robust system for uploading site photos, floor plans, and lab reports.
- **Interactive Map Integration** - Overlay site maps with floor plans and position samples using precise coordinates.
- **User Management** - Secure role-based access control (Admin, Inspector, Viewer, External).
- **Secure Sharing** - Generate protected share links for external stakeholders with expiration and password options.
- **Advanced Reporting** - Export professional reports in PDF, Excel (XLSX), and CSV formats.
- **Audit Logging** - Complete transparency with detailed logs of all system actions.
- **Offline Capabilities** - Intelligent offline queueing that syncs your work once a connection is restored.
- **Global Search** - Instant access to any sample, file, or project across the entire system.

## Technology Stack

### Frontend
- **React 18** - Modern functional component architecture.
- **TypeScript** - Strict typing for robust development.
- **Vite 6** - Lightning-fast build and development tooling.
- **Tailwind CSS 4** - Next-generation utility-first styling.
- **Radix UI & Shadcn/UI** - Accessible, high-quality primitive components.
- **Material UI (MUI)** - Polished UI components and iconography.
- **Leaflet** - High-performance interactive maps.
- **Recharts** - Dynamic data visualization and charting.
- **Motion** - Fluid animations and transitions.

### Backend
- **Express.js** - Lightweight and scalable Node.js framework.
- **SQLite 3** - Reliable, serverless relational database.
- **JWT (JSON Web Tokens)** - Secure stateless authentication.
- **Bcrypt.js** - Industry-standard password hashing.
- **Multer** - Advanced multi-part file upload handling.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (included with Node.js)
- **Windows OS** (Optimized for Windows with included .bat scripts)

## Installation & Setup

### 1. Automated Setup (Windows)
Run the included setup script to install all dependencies for both frontend and backend:
```powershell
.\setup.bat
```

### 2. Manual Installation
If not using the setup script:
```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Running the Application

### Development Mode (Windows)
To start both the Vite dev server and the Express backend simultaneously:
```powershell
.\start-dev.bat
```
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

### Production Mode (Windows)
To build the frontend and serve it via the production Express server:
```powershell
.\start-prod.bat
```
The application will be accessible at: http://localhost:3000

## Project Structure

```
asbestos-inspection-app/
├── src/                        # Frontend source code
│   ├── app/
│   │   ├── components/         # React components (Dashboard, Samples, etc.)
│   │   │   ├── ui/             # Reusable UI primitives
│   │   │   └── figma/          # Figma-specific UI elements
│   │   ├── lib/                # API clients and utilities
│   │   └── types/              # TypeScript definitions
│   └── styles/                 # Global CSS and themes
├── server/                     # Backend source code
│   ├── server.js               # Main Express application
│   ├── db.js                   # SQLite database logic
│   ├── uploads/                # Directory for uploaded files
│   └── data.sqlite             # Local database file
├── guidelines/                 # Project documentation and standards
├── example pages to learn from/ # Reference material for UI/UX
├── dist/                       # Compiled production build
└── *.bat                       # Windows utility scripts
```

## API Reference

### Authentication
- `POST /api/auth/login` - Authenticate user and receive JWT.

### Projects
- `GET /api/projects` - Retrieve all projects.
- `POST /api/projects` - Create a new project.
- `PATCH /api/projects/:id` - Update project details.
- `DELETE /api/projects/:id` - Remove a project (Admin only).

### Samples
- `GET /api/samples` - List all inspection samples.
- `POST /api/samples` - Create a sample (supports file uploads).
- `PATCH /api/samples/:id` - Update sample data and coordinates.

### Files
- `GET /api/files` - List all uploaded files.
- `POST /api/files` - Upload new documents or images.
- `DELETE /api/files/:id` - Delete a specific file.

### Sharing
- `GET /api/shares` - List all active share links.
- `POST /api/shares` - Create a new secure share.
- `DELETE /api/shares/:token` - Revoke a share link.

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, and data resets. |
| **Inspector** | Create/Edit samples and projects, upload files, generate reports. |
| **Viewer** | Read-only access to samples, projects, and reports. |
| **External** | Limited read-only access restricted to shared content. |

## Security & Configuration

Create a `.env` file in the `server/` directory for production settings:
```env
PORT=3000
JWT_SECRET=your_secure_random_string
ADMIN_USER=admin
ADMIN_PASS=admin123
```
*Note: The system automatically initializes an admin user on first run if none exists.*

---
**Last Updated:** April 15, 2026
**Project Status:** 🚀 Active Development
