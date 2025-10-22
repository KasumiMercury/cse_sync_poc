# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a proof-of-concept (POC) for end-to-end encrypted synchronization, consisting of two main components:
- **Frontend** (`e2ee_sync_front/`): React + TypeScript + Vite + TailwindCSS application
- **Backend** (`e2ee_sync_back/`): Go backend with Echo framework

## Quick Start (Docker)

```bash
# Start both frontend and backend with hot reload
docker compose up

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
```

## Frontend Development

### Build Commands
```bash
cd e2ee_sync_front
pnpm dev          # Start development server with HMR
pnpm build        # TypeScript compilation + production build
pnpm lint         # Run Biome linter
pnpm preview      # Preview production build
```

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Styling**: TailwindCSS 4.1.15
- **Build Tool**: Vite 7.1.7
- **Linter**: Biome 2.2.6 (configured via `biome.json`)
- **React Compiler**: Enabled via babel-plugin-react-compiler
- **Package Manager**: pnpm (uses pnpm-lock.yaml)

### Frontend Structure
```
e2ee_sync_front/src/
├── App.tsx                 # Main app component with page routing
├── main.tsx               # Entry point
├── index.css              # TailwindCSS imports
├── features/               # Feature-based organization
│   ├── auth/              # Authentication feature
│   │   ├── components/
│   │   │   └── LoginForm.tsx      # Login/Registration form
│   │   ├── types/
│   │   │   └── session.ts         # Session-related types
│   │   ├── api/
│   │   │   └── authApi.ts         # Auth API functions
│   │   └── index.ts               # Public exports
│   ├── dashboard/         # Dashboard feature
│   │   ├── components/
│   │   │   └── Dashboard.tsx      # Post-login dashboard
│   │   └── index.ts               # Public exports
│   └── debug/             # Debug feature
│       ├── components/
│       │   └── Debug.tsx          # Debug information page
│       ├── types/
│       │   └── debug.ts           # Debug info types
│       ├── api/
│       │   └── debugApi.ts        # Debug API functions
│       └── index.ts               # Public exports
└── shared/                # Shared utilities and constants
    └── constants/
        └── api.ts         # API base URL
```

### Frontend Configuration
- **TypeScript**: Split config with `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tooling)
- **Vite Config**: Uses React plugin with React Compiler integration and TailwindCSS
- **Docker**: Development environment in `Dockerfile` (Node 20 Alpine, pnpm)

## Backend Development

### Backend Setup
- **Language**: Go 1.25.1
- **Framework**: Echo v4.13.3
- **Dependencies**: google/uuid v1.6.0
- **Hot Reload**: Air (configured via `.air.toml`)

### Backend Commands
```bash
cd e2ee_sync_back
go mod download   # Download dependencies
go run .          # Run the application
go build          # Build binary
air               # Run with hot reload (development)
```

### Backend Structure
```
e2ee_sync_back/
├── main.go                # Entry point, routing, middleware setup
├── models/
│   ├── user.go           # User model (UUID, Username)
│   └── session.go        # Session model (24h expiry)
├── store/
│   ├── user_store.go     # In-memory user store
│   └── session_store.go  # In-memory session store
├── handlers/
│   ├── auth.go           # Authentication handlers
│   └── debug.go          # Debug endpoint handlers
└── middleware/
    └── session.go        # Session validation middleware
```

### Backend Configuration
- **Docker**: Development environment in `Dockerfile` (Go 1.25 Alpine, air)
- **Air Config**: `.air.toml` for hot reload settings
- **CORS**: Configured to allow `localhost:5173` with credentials

## Implemented Features

### 1. Session Management
- **User Registration** (`POST /api/register`)
  - Username-based registration (no password for PoC)
  - UUID assignment for each user
  - Duplicate username check

- **User Login** (`POST /api/login`)
  - Existing user authentication
  - Session creation (24-hour expiry)
  - HTTP-only cookie-based session management

- **Session Check** (`GET /api/session`)
  - Protected endpoint (requires session cookie)
  - Returns user information

- **Logout** (`POST /api/logout`)
  - Session deletion
  - Cookie clearing

### 2. Debug Information Page
- **Debug Endpoint** (`GET /api/debug`)
  - Public endpoint (no authentication required)
  - Returns all users and sessions from memory

- **Debug UI**
  - Accessible from login page and dashboard
  - Real-time view of all registered users
  - Session list with status (Active/Expired)
  - Reload functionality
  - ⚠️ **PoC only - never use in production**

### 3. UI Components
- **Login/Registration Form**
  - TailwindCSS styled
  - Username input
  - Login and Register buttons
  - Success/error message display

- **Dashboard**
  - User information display
  - Logout functionality
  - Debug page access

- **Debug Page**
  - Users table (UUID, Username)
  - Sessions table (ID, User ID, Created, Expires, Status)
  - Color-coded session status

## Docker Configuration

### Compose Services
- **backend**: Go backend with air hot reload (port 8080)
- **frontend**: Vite dev server (port 5173)
- **Volumes**: Source code mounted for hot reload
- **Network**: `e2ee-network` for service communication

### Development Workflow
1. `docker compose up` - Start all services
2. Edit source files - Changes auto-reload
3. `docker compose down` - Stop all services

## Data Storage

⚠️ **All data is stored in memory (PoC only)**
- Users: Map of UUID → User
- Sessions: Map of SessionID → Session
- No database or persistence
- Data is lost on server restart

## Security Notes

This is a **proof-of-concept** implementation:
- ❌ No password authentication
- ❌ No encryption (E2EE not yet implemented)
- ❌ No data persistence
- ❌ Debug endpoints publicly accessible
- ❌ No rate limiting
- ⚠️ **Never deploy this to production**

## Future E2EE Implementation

When implementing E2EE sync functionality:
- **Frontend**:
  - Encryption/decryption using Web Crypto API
  - Key derivation from user credentials
  - Client-side data encryption before sync

- **Backend**:
  - Opaque encrypted data storage
  - Server never decrypts user data
  - Sync conflict resolution

- **Communication**:
  - Consider WebSocket for real-time sync
  - Encrypted payload transmission

## Code Quality

- **Frontend**: Biome linter configured and enforced
- **Backend**: Follow standard Go conventions
- **Type Safety**: Full TypeScript coverage on frontend
- **Error Handling**: Proper HTTP status codes and error messages
