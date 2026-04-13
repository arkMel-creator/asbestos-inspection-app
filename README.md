
# Asbestos Inspection Management System (AIMS)

A comprehensive web-based application for managing asbestos inspection projects, samples, documentation, and team coordination. Built with React, TypeScript, and Express.js.

**Design Source:** https://www.figma.com/design/6EdnSNJAi85xmFhRrFnBkQ/Asbestos-Inspection-Management-System

## Features

- **Dashboard** - Overview of samples, files, and recent activities
- **Sample Management** - Create, track, and manage asbestos samples with customizable fields
- **File Management** - Upload, organize, and link documents to samples
- **Map Integration** - Overlay site maps and floor plans with interactive positioning
- **User Management** - Role-based access control (Admin, Editor, Viewer)
- **Sharing** - Create secure share links with expiration dates
- **Reports** - Export data in CSV, Excel, or PDF formats
- **Audit Logging** - Track all user actions and changes
- **Offline Support** - Queue actions while offline and sync when reconnected
- **Global Search** - Find samples, files, users, and shares across the system

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library
- **Leaflet** - Map integration
- **Chart Library** - Data visualization (Recharts)

### Backend
- **Express.js** - Node.js web framework
- **SQLite** - Lightweight database
- **JWT** - Authentication & authorization
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- Windows, macOS, or Linux OS

## Installation

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configuration (Optional)

Backend environment variables (create `.env` in the `server/` directory):

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USER=admin
ADMIN_PASS=admin123
```

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ Change these credentials in production!**

## Running the Application

### Development Mode

**Windows:**
```bash
start-dev.bat
```

**macOS/Linux:**
```bash
npm install
cd server && npm install && cd ..
# Terminal 1
npm run dev

# Terminal 2 (in another terminal window)
cd server
node server.js
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Production Mode

**Windows:**
```bash
start-prod.bat
```

**macOS/Linux:**
```bash
npm run build
cd server
node server.js
```

Access the application at: http://localhost:3000

## Project Structure

```
asbestos-inspection-app/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── app/
│   │   ├── App.tsx             # Main application component
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Samples.tsx
│   │   │   ├── Files.tsx
│   │   │   ├── MapView.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── Sharing.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── AuditLog.tsx
│   │   │   ├── OfflineQueue.tsx
│   │   │   ├── GlobalSearch.tsx
│   │   │   └── ui/            # UI component library
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   └── data/
│   │       └── mockData.ts     # Mock data for development
│   └── styles/                 # CSS files
├── server/
│   ├── server.js               # Express server
│   ├── db.js                   # Database schema & helpers
│   ├── package.json            # Backend dependencies
│   ├── uploads/                # File uploads directory
│   └── data.sqlite             # SQLite database (created on first run)
├── dist/                       # Production build output (generated)
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.mjs         # Tailwind CSS configuration
├── package.json                # Frontend dependencies
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Samples
- `GET /api/samples` - List all samples
- `GET /api/samples/:id` - Get sample details
- `POST /api/samples` - Create new sample
- `PATCH /api/samples/:id` - Update sample

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)

### Files
- `POST /api/samples/:id/upload` - Upload files to a sample
- `GET /api/files/:path` - Download file

### Sharing
- `POST /api/shares` - Create share link
- `GET /api/shares/:token` - Access shared content

### Health
- `GET /api/health` - Server health check

## User Roles & Permissions

| Feature | Admin | Editor | Viewer |
|---------|-------|--------|--------|
| View Dashboard | ✓ | ✓ | ✓ |
| View Samples | ✓ | ✓ | ✓ |
| Create Samples | ✓ | ✓ | ✗ |
| Edit Samples | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| Share Content | ✓ | ✓ | ✗ |
| View Audit Log | ✓ | ✗ | ✗ |
| Generate Reports | ✓ | ✓ | ✓ |

## Database

SQLite database is automatically created on first server run with tables for:
- **samples** - Asbestos sample records
- **files** - File uploads and references
- **users** - User accounts and roles
- **shares** - Share links and tokens

Reset database (deletes all data):
```bash
# Send authenticated DELETE request to /api/reset (admin only)
```

## Offline Support

The application automatically:
- Detects online/offline status
- Queues actions while offline
- Syncs with server when reconnected
- Preserves data in local storage

## Building for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory ready for deployment.

## Development Tips

1. **Mock Data** - Edit `src/app/data/mockData.ts` to customize sample data
2. **Styling** - Modify Tailwind classes in components or `src/styles/tailwind.css`
3. **Components** - UI components are in `src/app/components/ui/`
4. **Types** - All TypeScript types are in `src/app/types/index.ts`
5. **Backend Routes** - Modify `server/server.js` to add new API endpoints

## Troubleshooting

### Backend won't start
- Ensure Node.js is installed: `node --version`
- Check port 3000 is not in use
- Verify SQLite3 is installed: `npm list sqlite3`

### Frontend build errors
- Clear node_modules: `rm -r node_modules && npm install`
- Clear Vite cache: `rm -r node_modules/.vite`

### Database issues
- Delete `server/data.sqlite` and restart (recreates with fresh schema)
- Check file permissions in server directory

### Port conflicts
- Change PORT in `server/server.js` or `server/.env`
- Change Vite port in `vite.config.ts`

## Performance Optimization

The production build generates chunks up to ~1.2 MB. For optimization:
- Enable code splitting in `vite.config.ts`
- Consider lazy loading for heavy components
- Compress images before uploading
- Use CDN for static assets on production

## License

This project was created based on Figma design specifications.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs (browser DevTools and server terminal)
3. Check API responses in Network tab

---

**Last Updated:** February 7, 2026
**Status:** ✅ Production Ready
  