# Getting Started with AIMS

Quick start guide to get the Asbestos Inspection Management System running in 5 minutes.

## For Windows Users

### Step 1: Initial Setup (2 minutes)
```bash
# Navigate to the project directory
cd "path/to/asbestos-inspection-app"

# Run the setup script
setup.bat
```

This will:
- ✓ Check Node.js installation
- ✓ Install dependencies
- ✓ Create configuration files
- ✓ Build the frontend

### Step 2: Choose Your Mode

**Development Mode** (for coding/testing):
```bash
start-dev.bat
```
- Opens backend in one window, frontend in another
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Code changes auto-reload!

**Production Mode** (for deployment):
```bash
start-prod.bat
```
- Serves optimized build
- Access at: http://localhost:3000
- Static files from `dist/` directory

## For macOS/Linux Users

### Step 1: Install Dependencies
```bash
npm install
cd server
npm install
cd ..
```

### Step 2: Development Mode
**Terminal 1:**
```bash
npm run dev
# Runs at http://localhost:5173
```

**Terminal 2:**
```bash
cd server
node server.js
# Runs at http://localhost:3000
```

### Step 3: Production Mode
```bash
npm run build
cd server
NODE_ENV=production node server.js
# Visit http://localhost:3000
```

## First Login

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change these in production!** Edit `server/.env`

## What Can You Do?

| Feature | Admin | Editor | Viewer |
|---------|:-----:|:------:|:------:|
| View Dashboard | ✓ | ✓ | ✓ |
| Create Samples | ✓ | ✓ | ✗ |
| View Samples | ✓ | ✓ | ✓ |
| Manage Users | ✓ | ✗ | ✗ |
| Upload Files | ✓ | ✓ | ✗ |
| Create Maps | ✓ | ✓ | ✗ |
| Generate Reports | ✓ | ✓ | ✓ |
| View Audit Log | ✓ | ✗ | ✗ |

## Common Tasks

### Create Your First Sample
1. Log in with admin credentials
2. Click "Samples" in the navigation
3. Click "+ New Sample"
4. Fill in the form:
   - Sample ID (auto-generated)
   - Site name
   - Area
   - Equipment name
   - Collection date
   - Any other fields
5. Click "Create Sample"
6. Scroll down to upload files

### Upload Files
1. Go to "Files" section
2. Click "Upload Files"
3. Select images, PDFs, or documents
4. Link to samples or add to map

### Create a Map Overlay
1. Go to "Map View"
2. Upload a site plan or floor plan
3. Position and resize the overlay
4. Adjust opacity for reference

### Share Data with Others
1. Go to "Sharing"
2. Click "+ Create New Share"
3. Select what to share (samples/files)
4. Set expiration date (optional)
5. Send the generated link

### Export Report
1. Go to "Reports"
2. Choose report type (Samples/Files)
3. Select format (CSV/Excel/PDF)
4. Click "Export"

## Offline Mode

The app automatically detects when you go offline:

**What happens offline:**
- All actions are queued locally
- You can still view cached data
- Actions sync when you reconnect
- No data is lost!

**Check offline queue:**
- Click "Offline Queue" in navigation
- View pending actions
- Sync when back online

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Global Search |
| Ctrl+/ | Command Menu |
| Esc | Close Dialogs |

## Troubleshooting

### "Cannot find npm"
- Ensure Node.js is installed: https://nodejs.org
- Restart your terminal

### "Port 3000 already in use"
- Stop the other process using port 3000
- Or change PORT in `server/.env`

### "Database errors"
- Delete `server/data.sqlite`
- Restart the server (it recreates the DB)

### "Frontend won't load"
- Check browser console (F12)
- Ensure backend is running on port 3000
- Clear browser cache (Ctrl+Shift+Delete)

### "Can't upload files"
- Check file size (max 50MB per file)
- Ensure `server/uploads/` directory exists
- Check disk space

## Need Help?

1. **Read the Docs:**
   - [README.md](README.md) - Full documentation
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
   - [guidelines/Guidelines.md](guidelines/Guidelines.md) - Design guidelines

2. **Check Configuration:**
   - `server/.env` - Backend settings
   - `vite.config.ts` - Frontend build config
   - `tailwind.config.mjs` - Styling config

3. **Inspect Logs:**
   - **Backend:** Check server terminal for errors
   - **Frontend:** Open DevTools (F12) → Console tab

4. **Reset Everything:**
   - Delete `server/data.sqlite` to reset DB
   - Delete `dist/` to rebuild frontend
   - Delete `node_modules/`, `server/node_modules/` to reinstall

## Next Steps

- Customize sample fields in `src/app/data/mockData.ts`
- Add your users in the "Users" section after login
- Create sample records and test workflows
- Read [DEVELOPMENT.md](DEVELOPMENT.md) to understand the code
- Review [guidelines/Guidelines.md](guidelines/Guidelines.md) for design standards

---

**Version:** 1.0.0  
**Last Updated:** February 7, 2026  
**Status:** ✅ Ready to Use
