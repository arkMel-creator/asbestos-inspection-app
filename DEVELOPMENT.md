# AIMS Development Guide

## Architecture Overview

The Asbestos Inspection Management System (AIMS) follows a client-server architecture:

```
┌─────────────────────┐
│  React Frontend     │
│  (Vite + TypeScript)│
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
├── App.tsx                          # Main application (state management)
├── components/
│   ├── Dashboard.tsx               # Overview dashboard
│   ├── Samples.tsx                 # Sample CRUD operations
│   ├── Files.tsx                   # File management
│   ├── MapView.tsx                 # Interactive map overlays
│   ├── UserManagement.tsx          # User admin panel
│   ├── Sharing.tsx                 # Share link management
│   ├── Reports.tsx                 # Data export/reporting
│   ├── AuditLog.tsx                # Activity logging
│   ├── OfflineQueue.tsx            # Offline sync queue
│   ├── GlobalSearch.tsx            # Cross-section search
│   ├── figma/
│   │   └── ImageWithFallback.tsx  # Dynamic image handling
│   └── ui/                         # Reusable UI components
│       ├── button.tsx              # Button component
│       ├── card.tsx                # Card container
│       ├── input.tsx               # Text input
│       ├── select.tsx              # Dropdown select
│       ├── table.tsx               # Data table
│       └── ... (40+ components)
├── types/
│   └── index.ts                    # TypeScript type definitions
├── data/
│   └── mockData.ts                 # Sample data for development
└── styles/
    ├── index.css                   # Global styles
    ├── tailwind.css                # Tailwind imports
    ├── theme.css                   # Theme variables
    └── fonts.css                   # Font definitions
```

### State Management

The main application state is managed in `App.tsx` using React hooks:

- **`currentView`** - Current page (dashboard, samples, map, etc.)
- **`samples`** - Array of sample records
- **`files`** - Array of uploaded files
- **`users`** - Array of user accounts
- **`overlays`** - Array of map overlays
- **`shareLinks`** - Array of share tokens
- **`auditLog`** - Sequence of audit entries
- **`syncQueue`** - Offline actions to sync
- **`isOnline`** - Connection status

### Key Patterns

**Component Props Pattern:**
```typescript
interface ComponentProps {
  data: DataType[];
  onAction: (id: string, data: any) => void;
  canEdit: boolean;
}
```

**Event Handlers:**
- `handleAdd*` - Create new items
- `handleUpdate*` - Modify existing items
- `handleDelete*` - Remove items
- `handle* Change` - Handle user input

**Offline Support:**
Every state-changing operation calls `queueIfOffline()` to save actions when offline, syncing when reconnected.

## Backend Architecture

### Server Structure

```
server/
├── server.js       # Express app, routes, and initialization
├── db.js           # Database schema and query helpers
├── package.json    # Backend dependencies
├── uploads/        # User-uploaded files directory
└── data.sqlite     # SQLite database (auto-created)
```

### API Routes

#### Authentication
```
POST /api/auth/login
  - Request: { username, password }
  - Response: { token, user }
```

#### Samples
```
GET    /api/samples              # List all samples
GET    /api/samples/:id          # Get sample with files
POST   /api/samples              # Create new sample
PATCH  /api/samples/:id          # Update sample
```

#### Files
```
POST   /api/samples/:id/upload   # Upload files
GET    /api/files/:path          # Download file
```

#### Users (Admin only)
```
GET    /api/users                # List all users
POST   /api/users                # Create new user
```

#### Sharing
```
POST   /api/shares               # Create share link
GET    /api/shares/:token        # Access shared sample
```

#### Admin
```
POST   /api/reset                # Clear all data (admin)
GET    /api/health               # Health check
```

### Database Schema

```sql
-- Samples table
CREATE TABLE samples (
  id TEXT PRIMARY KEY,
  collectionDate TEXT,
  equipmentName TEXT,
  sampleType TEXT,
  status TEXT,
  asbestosType TEXT,
  concentration REAL,
  riskLevel TEXT,
  collectorName TEXT,
  labName TEXT,
  cocRef TEXT,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)

-- Files table
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  sampleId TEXT,
  name TEXT,
  type TEXT,
  size INTEGER,
  path TEXT,
  createdAt TEXT,
  FOREIGN KEY(sampleId) REFERENCES samples(id)
)

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)

-- Shares table
CREATE TABLE shares (
  token TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  targetId TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Authentication

**JWT Flow:**
1. User sends username/password to `/api/auth/login`
2. Server verifies credentials with bcrypt
3. Server issues JWT token valid for 12 hours
4. Client includes token in `Authorization: Bearer <token>` header
5. Server verifies token on protected routes

**Role-Based Access:**
```javascript
authRequired(['admin'])    // Only admins
authRequired(['admin', 'editor'])  // Admins and editors
authRequired(['admin', 'editor', 'viewer'])  // Anyone authenticated
```

## Development Workflow

### 1. Start Development Servers

```bash
# Windows
start-dev.bat

# macOS/Linux
npm run dev          # Terminal 1: Frontend on port 5173
cd server && node server.js  # Terminal 2: Backend on port 3000
```

### 2. Making Changes

**Frontend:**
- Vite hot-reloads automatically on file save
- Components in `src/app/components/`
- Styles in `src/styles/`

**Backend:**
- Manual restart needed: Stop process and run again
- Or install `nodemon` for auto-restart

### 3. Testing Changes

**In Browser Console (DevTools):**
```javascript
// Check online status
navigator.onLine

// View offline queue
localStorage.getItem('aims.syncQueue')

// Clear localStorage
localStorage.clear()
```

**In Browser Network Tab:**
- Monitor API requests
- Check JWT token in headers
- Verify response status codes

## Adding New Features

### Adding a New Sample Field

1. **Update Type Definition** (`src/app/types/index.ts`):
```typescript
interface Sample {
  /// ... existing fields
  newField: string;
}
```

2. **Update Database Schema** (`server/db.js`):
```javascript
`ALTER TABLE samples ADD COLUMN newField TEXT`
```

3. **Update Samples Component** (`src/app/components/Samples.tsx`):
```typescript
const defaultSchema = [
  // ... existing fields
  { key: 'newField', label: 'New Field', type: 'text', required: false }
]
```

4. **Update Mock Data** (`src/app/data/mockData.ts`):
```typescript
newField: 'sample value'
```

### Adding a New API Endpoint

1. **Add Route** (`server/server.js`):
```javascript
app.get('/api/endpoint', authRequired(['admin']), async (req, res) => {
  try {
    // Logic here
    res.json({ result: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

2. **Add Database Helper** (`server/db.js`):
```javascript
export const queryFunction = async (params) => {
  return await all('SELECT * FROM table WHERE ...', params);
};
```

3. **Use in Frontend** (`App.tsx`):
```typescript
const handleNew = async () => {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
};
```

### Adding a New UI Component

1. **Create Component** (`src/app/components/ui/newComponent.tsx`):
```typescript
import { ComponentPropsWithoutRef } from 'react';

export interface NewComponentProps 
  extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'secondary';
}

export function NewComponent({ 
  variant = 'default', 
  ...props 
}: NewComponentProps) {
  return <div className={`styles-${variant}`} {...props} />;
}
```

2. **Use in Other Components**:
```typescript
import { NewComponent } from './ui/newComponent';

<NewComponent variant="secondary">Content</NewComponent>
```

## Performance Optimization Tips

### Frontend
1. **Lazy Load Components:**
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

2. **Memoize Components:**
```typescript
const MemoizedComponent = memo(MyComponent);
```

3. **Use useCallback for Event Handlers:**
```typescript
const handleClick = useCallback(() => { /* ... */ }, [deps]);
```

### Backend
1. **Add Database Indexes:**
```javascript
await run(`CREATE INDEX idx_samples_status ON samples(status)`);
```

2. **Pagination for Large Lists:**
```javascript
const limit = 50;
const offset = (page - 1) * limit;
```

3. **Caching:**
```javascript
const cache = new Map();
if (cache.has(key)) return cache.get(key);
```

## Debugging

### Frontend Debugging
1. **React DevTools Extension** - For component inspection
2. **Redux DevTools** - For state tracking (if using Redux)
3. **Console Logs** - Strategic logging
4. **Breakpoints** - DevTools Sources tab

### Backend Debugging
1. **Console Logs:**
```javascript
console.log('Debug:', variable);
console.error('Error:', error);
```

2. **Postman/Insomnia** - Test API endpoints directly

3. **SQLite Browser** - Inspect database:
```bash
# Install: npm install sqlite3 -g
sqlite3 server/data.sqlite
```

### Common Issues

**CORS Errors:**
- Ensure frontend and backend URLs match
- Check `Access-Control-Allow-Origin` headers

**JWT Token Expired:**
- Clear localStorage: `localStorage.clear()`
- Login again

**Database Locked:**
- Ensure only one server instance running
- Delete `data.sqlite` and restart

**Build Size Too Large:**
- Check for large dependencies
- Consider code-splitting
- Use production builds (`npm run build`)

## Testing

### Manual Testing Checklist
- [ ] Create/edit/delete samples
- [ ] Upload files to samples
- [ ] Map overlay placement
- [ ] User login/logout
- [ ] Share link generation
- [ ] Report export (CSV/Excel)
- [ ] Audit log entries
- [ ] Offline queue operations
- [ ] Different user roles

### Test Data
Modify `src/app/data/mockData.ts` to add test samples before building.

## Deployment

### Production Build
```bash
npm run build
cd server
NODE_ENV=production node server.js
```

### Environment Variables Check
```bash
# server/.env
PORT=3000
JWT_SECRET=your-secure-random-string
ADMIN_USER=admin
ADMIN_PASS=secure-password-here
```

### Database Backup
```bash
# Backup before deployment
cp server/data.sqlite server/data.sqlite.backup
```

## Resources

- **React Documentation:** https://react.dev
- **Vite Documentation:** https://vitejs.dev
- **Express.js Guide:** https://expressjs.com
- **SQLite Reference:** https://www.sqlite.org/docs.html
- **Tailwind CSS:** https://tailwindcss.com
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

---

**Last Updated:** February 7, 2026
