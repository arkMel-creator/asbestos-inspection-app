# AIMS Development Guide

## Architecture Overview

The Asbestos Inspection Management System (AIMS) follows a client-server architecture:

```
┌─────────────────────┐
│  React Frontend     │
│  (Vite 6 + TS + TW4)│
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐
│ Express Backend     │
│ (Node.js)           │
└──────────┬──────────┘
           │ SQL
           ▼
┌─────────────────────┐
│ SQLite Database     │
│ (Local File)        │
└─────────────────────┘
```

## Frontend Architecture

### Component Structure

```
src/app/
├── App.tsx                          # Main application (routing & state)
├── components/
│   ├── Dashboard.tsx               # Overview dashboard
│   ├── Samples.tsx                 # Sample management
│   ├── Files.tsx                   # File & document management
│   ├── MapView.tsx                 # Interactive map with overlays
│   ├── UserManagement.tsx          # User administration
│   ├── Sharing.tsx                 # Secure share links
│   ├── Reports.tsx                 # Data export/reporting
│   ├── AuditLog.tsx                # Activity monitoring
│   ├── OfflineQueue.tsx            # Offline sync management
│   ├── GlobalSearch.tsx            # Cross-module search
│   ├── figma/
│   │   └── ImageWithFallback.tsx  # Dynamic asset handling
│   └── ui/                         # shadcn/ui & Radix primitives
├── lib/
│   └── api.ts                      # Axios/Fetch API client
├── types/
│   └── index.ts                    # TypeScript definitions
└── styles/
    ├── index.css                   # Global styles
    ├── tailwind.css                # Tailwind 4 configuration
    ├── theme.css                   # Theme variables
    └── fonts.css                   # Typography
```

### State Management & Logic

The application uses a centralized logic pattern in `App.tsx` combined with specialized components:

- **Auth State** - Managed via JWT stored in `localStorage`.
- **Entity State** - Samples, Files, and Users are fetched from the Express API.
- **Offline Logic** - Actions are queued in `localStorage` when `navigator.onLine` is false and synced via `OfflineQueue.tsx`.

## Backend Architecture

### Server Structure

```
server/
├── server.js       # Main entry point & API routes
├── db.js           # SQLite initialization & query logic
├── package.json    # Backend dependencies
├── uploads/        # Stored files (images, PDFs)
└── data.sqlite     # Persistent relational database
```

### API Routes

#### Authentication
- `POST /api/auth/login` - Returns JWT and user profile.

#### Projects
- `GET    /api/projects`     # List all projects
- `POST   /api/projects`     # Create new project
- `PATCH  /api/projects/:id` # Update project
- `DELETE /api/projects/:id` # Delete project (Admin)

#### Samples
- `GET    /api/samples`     # List all samples
- `GET    /api/samples/:id` # Get details with linked files
- `POST   /api/samples`     # Create sample (multipart/form-data)
- `PATCH  /api/samples/:id` # Update sample data

#### Files
- `GET    /api/files`       # List all files
- `POST   /api/files`       # Upload files
- `PATCH  /api/files/:id`   # Update file metadata
- `DELETE /api/files/:id`   # Delete file and physical asset

#### Users (Admin only)
- `GET    /api/users`       # List accounts
- `POST   /api/users`       # Create account
- `PATCH  /api/users/:id`   # Update account/password
- `DELETE /api/users/:id`   # Remove account

#### Sharing
- `GET    /api/shares`      # List active shares
- `POST   /api/shares`      # Create new secure link
- `GET    /api/shares/:token` # Resolve share data

### Database Schema (SQLite)

The system manages 5 primary tables:

1. **`projects`** - Top-level site/client groupings.
2. **`samples`** - Core inspection data (Site, Area, Status, coordinates).
3. **`files`** - Asset metadata linked to samples or as map overlays.
4. **`users`** - Authentication records with Role-Based Access Control (RBAC).
5. **`shares`** - Secure external access tokens.

## Development Workflow

### 1. Environment Setup
Run the setup script to initialize the project:
```powershell
.\setup.bat
```

### 2. Launching Services
Use the development batch file to start both layers:
```powershell
.\start-dev.bat
```
- **Frontend**: http://localhost:5173 (Vite HMR)
- **Backend**: http://localhost:3000 (Express)

### 3. Database Management
The database initializes automatically. To reset for testing:
1. Stop the server.
2. Delete `server/data.sqlite`.
3. Restart the server; an admin user (`admin`/`admin123`) will be recreated.

## Technical Patterns

### File Uploads
Uses `multer` on the backend. Files are stored in `server/uploads/` with a timestamped prefix to prevent collisions. Metadata is stored in the `files` table.

### Map Overlays
Floor plans are uploaded as files with `isOverlay: true`. The `MapView.tsx` component uses Leaflet to render these as `ImageOverlay` layers.

### Role-Based Access (RBAC)
Implemented via the `authRequired` middleware in `server/server.js`:
- `admin`: Full system control.
- `inspector`: Data entry and management.
- `viewer`: Read-only access.
- `external`: Restricted access via share links.

## Building for Production

```powershell
.\start-prod.bat
```
This builds the frontend into `dist/` and starts the Express server in production mode, where it serves both the API and the static frontend assets on port 3000.

---

**Last Updated:** April 15, 2026
**Version:** 1.1.0
