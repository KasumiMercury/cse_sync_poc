# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a proof-of-concept (POC) for end-to-end encrypted synchronization, consisting of two main components:
- **Frontend** (`e2ee_sync_front/`): React + TypeScript + Vite application
- **Backend** (`e2ee_sync_back/`): Go backend (currently minimal setup with only go.mod)

## Frontend Development

### Build Commands
```bash
cd e2ee_sync_front
pnpm dev          # Start development server with HMR
pnpm build        # TypeScript compilation + production build
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **React Compiler**: Enabled via babel-plugin-react-compiler (impacts dev/build performance)
- **Package Manager**: pnpm (note: uses pnpm-lock.yaml)
- **Entry Points**:
  - `index.html` → `src/main.tsx` → `src/App.tsx`
- **Structure**: Currently uses default Vite + React template structure
  - `src/` - Application source code
  - `src/assets/` - Static assets (images, etc.)
  - `public/` - Public static files served directly

### Frontend Configuration
- **TypeScript**: Split config with `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tooling)
- **ESLint**: Flat config format in `eslint.config.js`
- **Vite Config**: Uses React plugin with React Compiler integration

## Backend Development

### Backend Setup
- **Language**: Go 1.25.1
- **Module**: `github.com/KasumiMercury/e2ee_sync_poc/e2ee_sync_back`
- **Status**: Minimal setup - only go.mod exists, no source files yet

### Backend Commands
```bash
cd e2ee_sync_back
go mod download   # Download dependencies
go run .          # Run the application (once main.go exists)
go build          # Build binary
go test ./...     # Run tests
```

## Architecture Notes

This POC appears to be in early development:
- Frontend has default Vite template structure but is ready for development
- Backend is initialized but has no implementation files yet
- The repository is not yet a git repository

When implementing E2EE sync functionality, typical patterns would involve:
- Frontend: Encryption/decryption logic using Web Crypto API
- Backend: Opaque data storage (server shouldn't decrypt)
- Communication: Likely WebSocket or HTTP/2 for real-time sync
