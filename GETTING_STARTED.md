# Getting Started with AIMS

Welcome! This guide will get you up and running with the Asbestos Inspection Management System (AIMS) in minutes.

## Quick Installation (Windows)

The simplest way to set up the project is to use the provided batch script:

1.  **Clone/Download** the repository.
2.  **Open PowerShell** in the project directory.
3.  **Run the setup script**:
    ```powershell
    .\setup.bat
    ```
    This script will:
    - ✓ Detect and verify Node.js installation.
    - ✓ Install both frontend and backend dependencies.
    - ✓ Build the application for production.

## Launching the App

### 👨‍💻 Development Mode
If you want to modify the code and see changes in real-time:
```powershell
.\start-dev.bat
```
- **Frontend (Vite)**: http://localhost:5173
- **Backend (API)**: http://localhost:3000

### 🚀 Production Mode
For regular use, run the production build:
```powershell
.\start-prod.bat
```
- **Access the app**: http://localhost:3000

## Initial Login

Access the system using the default administrative credentials:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Security Tip**: Once logged in, go to **User Management** and change the admin password or create a new personal account.

## Feature Guide

| Module | Purpose |
| :--- | :--- |
| **Dashboard** | View project summaries, sample statuses, and recent activities. |
| **Samples** | Create and manage asbestos sample data (IDs, locations, risk levels). |
| **Files** | Upload site photos, lab results, and site floor plans. |
| **Map View** | View and position samples on interactive site maps and floor plans. |
| **Reports** | Generate and export inspection data as CSV, Excel, or PDF. |
| **Sharing** | Create secure, expiration-protected links to share data with clients. |

## Keyboard Shortcuts

- `Ctrl + K` : Open Global Search from anywhere.
- `Esc` : Close active dialogs or search panels.

---

**Last Updated**: April 15, 2026
**Version**: 1.1.0
