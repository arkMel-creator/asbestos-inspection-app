# AIMS Documentation Index

This index serves as a central hub for navigating the documentation of the Asbestos Inspection Management System.

---

## 📖 Primary Guides

1.  **[QUICK_START.md](QUICK_START.md)**
    *   *Purpose*: High-level summary of the project status and fastest way to run it.
2.  **[GETTING_STARTED.md](GETTING_STARTED.md)**
    *   *Purpose*: Step-by-step setup and basic usage guide for new users.
3.  **[README.md](README.md)**
    *   *Purpose*: The definitive reference for features, tech stack, and API documentation.
4.  **[DEVELOPMENT.md](DEVELOPMENT.md)**
    *   *Purpose*: Detailed technical guide covering architecture, database schema, and dev workflows.

---

## 📁 Repository Structure Map

```text
asbestos-inspection-app/
├── src/                        # React frontend source (TS + Tailwind 4)
│   ├── app/
│   │   ├── components/         # Feature modules (Dashboard, Samples, etc.)
│   │   │   └── ui/             # Reusable UI component library
│   │   ├── lib/                # API client (api.ts)
│   │   └── types/              # TypeScript interfaces
│   └── styles/                 # Global CSS and theme configuration
├── server/                     # Node.js backend source (Express + SQLite)
│   ├── server.js               # API routing and business logic
│   ├── db.js                   # Database management
│   ├── uploads/                # User asset storage (photos, PDFs)
│   └── data.sqlite             # Persistent database file
├── guidelines/                 # Project standards and design documents
├── example pages to learn from/ # UI/UX reference materials
├── dist/                       # Built frontend assets for production
└── setup.bat                   # Automation scripts (Windows)
```

---

## 🚀 Key Automation Scripts

| Script | Purpose |
| :--- | :--- |
| `setup.bat` | One-time initialization and dependency installation. |
| `start-dev.bat` | Launch development servers (Frontend & Backend). |
| `start-prod.bat` | Build and run the app in production mode. |
| `stop-all.bat` | Safely terminate all running AIMS processes. |

---

**Last Updated**: April 15, 2026
**Project Status**: ✅ Stable & Maintained
